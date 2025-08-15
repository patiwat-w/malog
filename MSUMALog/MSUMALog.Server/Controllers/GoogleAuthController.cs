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

        // var result = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        // _logger.LogInformation("Google Callback: AuthenticateAsync Succeeded={Succeeded}", result.Succeeded);

        // if (!result.Succeeded)
        // {
        //    _logger.LogInformation("Google Callback: authentication failed. Failure={FailureMessage}", result.Failure?.Message ?? "none");
        //     return BadRequest("Google authentication failed");
        // }

        // var principal = result.Principal;
        // if (principal == null)
        // {
        //     _logger.LogInformation("Google Callback: result.Principal is null");
        //     return BadRequest("Google authentication failed");
        // }

        // var email = principal.FindFirst(ClaimTypes.Email)?.Value;
        // var firstName = principal.FindFirst(ClaimTypes.GivenName)?.Value;
        // var lastName = principal.FindFirst(ClaimTypes.Surname)?.Value;
        // var profilePicture = principal.FindFirst("picture")?.Value;

        // _logger.LogInformation("Google Callback: Email = {Email}, FirstName = {FirstName}, LastName = {LastName}, ProfilePicture = {ProfilePicture}", email, firstName, lastName, profilePicture);

        // if (string.IsNullOrEmpty(email))
        // {
        //     _logger.LogInformation("Google Callback: Email claim is missing");
        //     return BadRequest("Google authentication failed");
        // }

        // // Check if the user exists in the database
        // var user = _dbContext.Users.FirstOrDefault(u => u.Email == email);
        // if (user == null)
        // {
        //     _logger.LogInformation("Google Callback: Creating new user.");
        //     user = new User
        //     {
        //         Email = email,
        //         Role = "User",
        //         LoginCount = 1,
        //         LastLoginDate = DateTime.UtcNow,
        //         FirstName = firstName,
        //         LastName = lastName,
        //         ProfilePicture = profilePicture
        //     };
        //     _dbContext.Users.Add(user);
        //     _logger.LogInformation("Google Callback: User added to DbContext.");

        //     try
        //     {
        //         await _dbContext.SaveChangesAsync();
        //        _logger.LogInformation("Google Callback: Changes saved to database.");
        //     }
        //     catch (Exception ex)
        //     {
        //        _logger.LogError(ex, "Google Callback: Error saving changes");
        //         // Redirect to login-fail page if user creation fails
        //         return Redirect("/login-fail");
        //     }
        // }
        // else
        // {
        //     _logger.LogInformation("Google Callback: Updating existing user.");
        //     user.LoginCount++;
        //     user.LastLoginDate = DateTime.UtcNow;
        //     user.FirstName = firstName ?? user.FirstName;
        //     user.LastName = lastName ?? user.LastName;
        //     user.ProfilePicture = profilePicture ?? user.ProfilePicture;

        //     try
        //     {
        //         await _dbContext.SaveChangesAsync();
        //         _logger.LogInformation("Google Callback: Changes saved to database.");
        //     }
        //     catch (Exception ex)
        //     {
        //         _logger.LogError(ex, "Google Callback: Error saving changes - {ErrorMessage}", ex.Message);
        //         return StatusCode(500, "Cannot update user: " + ex.Message);
        //     }
        // }

        //var redirectUri = result.Properties?.RedirectUri ?? "/home";
        // replace /home to /login-fail
        var redirectUri ="/login-fail";
       _logger.LogInformation("Google Callback: redirecting to {RedirectUri}", redirectUri);
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