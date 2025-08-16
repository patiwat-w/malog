using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using System;
using System.Linq;
using System.Threading.Tasks;
using MSUMALog.Server.Models;
using MSUMALog.Server.Data;
using System.Collections.Generic;

namespace MSUMALog.Server.Controllers;

[ApiController]
[Route("auth")]
public class GoogleAuthController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<GoogleAuthController> _logger;

    public GoogleAuthController(ApplicationDbContext dbContext, ILogger<GoogleAuthController> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    // The main endpoint to initiate Google login
    [HttpGet("google")]
    [AllowAnonymous]
    public IActionResult GoogleLogin([FromQuery] string? returnUrl = "/home")
    {
        _logger.LogInformation("LogInformation:Google Login: start with ReturnUrl={ReturnUrl}", returnUrl);
        Console.WriteLine($"Google Login: Received returnUrl = {returnUrl}");

        string finalReturnUrl;
        if (string.IsNullOrWhiteSpace(returnUrl))
        {
            finalReturnUrl = "/home";
            Console.WriteLine("Google Login: returnUrl is empty, defaulting to /home");
        }
        else if (Uri.TryCreate(returnUrl, UriKind.Absolute, out var abs) &&
                 (abs.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
                  abs.Host.Equals("msu-malog.egmu-research.org", StringComparison.OrdinalIgnoreCase)))
        {
            finalReturnUrl = abs.ToString();
            Console.WriteLine($"Google Login: Absolute returnUrl validated = {finalReturnUrl}");
        }
        else
        {
            finalReturnUrl = returnUrl.StartsWith('/') ? returnUrl : $"/{returnUrl}";
            Console.WriteLine($"Google Login: Relative returnUrl processed = {finalReturnUrl}");
        }

        var props = new AuthenticationProperties
        {
            RedirectUri = finalReturnUrl,
            Items =
            {
                { "prompt", "consent" } // Force Google to show the consent screen
            }
        };

        Console.WriteLine($"Google Login: Redirecting to Google with a final returnUrl of {finalReturnUrl}");
        return Challenge(props, GoogleDefaults.AuthenticationScheme);
    }


    // The callback endpoint that Google redirects to
    [HttpGet("signin-google-allback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback()
    {
        _logger.LogInformation("Google Callback: start");

        // Authenticate the Google external result
        var result = await HttpContext.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);
        if (!result.Succeeded)
        {
            _logger.LogInformation("Google Callback: external authentication failed");
            return Redirect("/login-fail");
        }

        var principal = result.Principal;
        if (principal == null)
        {
            _logger.LogInformation("Google Callback: principal is null");
            return Redirect("/login-fail");
        }

        var email = principal.FindFirst(ClaimTypes.Email)?.Value;
        var firstName = principal.FindFirst(ClaimTypes.GivenName)?.Value;
        var lastName = principal.FindFirst(ClaimTypes.Surname)?.Value;
        var profilePicture = principal.FindFirst("picture")?.Value;

        if (string.IsNullOrEmpty(email))
        {
            _logger.LogInformation("Google Callback: Email claim missing");
            return Redirect("/login-fail");
        }

        // Ensure local user exists and update stats
        var user = _dbContext.Users.FirstOrDefault(u => u.Email == email);
        if (user == null)
        {
            _logger.LogInformation("Google Callback: creating new user for {Email}", email);
            user = new User
            {
                Email = email,
                Role = "User",
                LoginCount = 1,
                LastLoginDate = DateTime.UtcNow,
                FirstName = firstName,
                LastName = lastName,
                ProfilePicture = profilePicture
            };
            _dbContext.Users.Add(user);
            try
            {
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Google Callback: error saving new user");
                return Redirect("/login-fail");
            }
        }
        else
        {
            _logger.LogInformation("Google Callback: updating existing user {Email}", email);
            user.LoginCount++;
            user.LastLoginDate = DateTime.UtcNow;
            user.FirstName = firstName ?? user.FirstName;
            user.LastName = lastName ?? user.LastName;
            user.ProfilePicture = profilePicture ?? user.ProfilePicture;
            try
            {
                await _dbContext.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Google Callback: error updating user");
                return StatusCode(500, "Cannot update user");
            }
        }

        // Build local claims and ensure NameIdentifier is the numeric user Id
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FirstName ?? user.Email),
            new Claim(ClaimTypes.GivenName, user.FirstName ?? string.Empty),
            new Claim(ClaimTypes.Surname, user.LastName ?? string.Empty),
            new Claim("picture", user.ProfilePicture ?? string.Empty),
            new Claim(ClaimTypes.Role, user.Role ?? "User")
        };

        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var cookiePrincipal = new ClaimsPrincipal(identity);

        var redirectUri = result.Properties?.RedirectUri ?? "/home";

        // Sign in with cookie scheme using the local user id in NameIdentifier
        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            cookiePrincipal,
            new AuthenticationProperties
            {
                IsPersistent = true,
                ExpiresUtc = DateTimeOffset.UtcNow.AddHours(8),
                RedirectUri = redirectUri
            });

        _logger.LogInformation("Google Callback: signed in and redirecting to {RedirectUri}", redirectUri);
        return Redirect(redirectUri);
    }

    // A simple endpoint to get user information
    [HttpGet("me")]
    [Authorize]
    public IActionResult GetCurrentUser()
    {
         _logger.LogInformation("LogInformation:GetCurrentUser");
        var email = HttpContext.User.FindFirst(ClaimTypes.Email)?.Value;
        if (email == null)
        {
            return Unauthorized();
        }

        return Ok(new { Email = email });
    }
    
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
         _logger.LogInformation("LogInformation:logout");
        if (User.Identity?.IsAuthenticated == true)
        {
            Console.WriteLine("Logout: User is authenticated, signing out...");
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            Console.WriteLine("Logout: User signed out successfully.");
        }
        else
        {
            Console.WriteLine("Logout: No authenticated user found.");
        }

        // Clear cookies related to authentication
        Response.Cookies.Delete(".AspNetCore.Cookies"); // Default cookie name for ASP.NET Core authentication

        return NoContent(); // Return 204 No Content
    }
}