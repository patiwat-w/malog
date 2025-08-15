using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace MSUMALog.Server.Controllers;

[ApiController]
[Route("auth")]
public class GoogleAuthController : ControllerBase
{
    // The main endpoint to initiate Google login
    [HttpGet("google")]
    [AllowAnonymous]
    public IActionResult GoogleLogin([FromQuery] string? returnUrl = "/home")
    {
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
            // The RedirectUri here must match the CallbackPath configured in Program.cs
            RedirectUri = finalReturnUrl,
        };

        Console.WriteLine($"Google Login: Redirecting to Google with a final returnUrl of {finalReturnUrl}");
        return Challenge(props, GoogleDefaults.AuthenticationScheme);
    }
    

    // The callback endpoint that Google redirects to
    [HttpGet("signin-google")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback()
    {
        Console.WriteLine("Google Callback: start");

        var result = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        Console.WriteLine($"Google Callback: AuthenticateAsync Succeeded={result.Succeeded}");

        if (!result.Succeeded)
        {
            Console.WriteLine($"Google Callback: authentication failed. Failure={result.Failure?.Message ?? "none"}");
            return BadRequest("Google authentication failed");
        }

        // Now we can access the claims from the authenticated user
        var principal = result.Principal;
        if (principal == null)
        {
            Console.WriteLine("Google Callback: result.Principal is null");
            return BadRequest("Google authentication failed");
        }

        var claims = principal.Claims.ToList();
        Console.WriteLine($"Google Callback: claims count={claims.Count}");

        // The RedirectUri passed from the GoogleLogin method is now available in the properties
        var redirectUri = result.Properties?.RedirectUri ?? "/home";

        Console.WriteLine($"Google Callback: redirecting to {redirectUri}");
        return Redirect(redirectUri);
    }

    // A simple endpoint to get user information
    [HttpGet("me")]
    [Authorize]
    public IActionResult GetCurrentUser()
    {
        var email = HttpContext.User.FindFirst(ClaimTypes.Email)?.Value;
        if (email == null)
        {
            return Unauthorized();
        }

        return Ok(new { Email = email });
    }
}