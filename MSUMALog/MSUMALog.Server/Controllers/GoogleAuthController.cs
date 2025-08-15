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
    [HttpGet("login")]
    [AllowAnonymous]
    public IActionResult Login([FromQuery] string? returnUrl = "/home")
    {
        Console.WriteLine($"Google Login: Received returnUrl = {returnUrl}");

        string final;
        if (string.IsNullOrWhiteSpace(returnUrl))
        {
            final = "/home";
            Console.WriteLine("Google Login: returnUrl is empty, defaulting to /home");
        }
        else if (Uri.TryCreate(returnUrl, UriKind.Absolute, out var abs))
        {
            var allowedHosts = new[] { "localhost", "msu-malog.egmu-research.org" };
            if (allowedHosts.Contains(abs.Host, StringComparer.OrdinalIgnoreCase))
            {
                final = abs.ToString();
                Console.WriteLine($"Google Login: Absolute returnUrl validated = {final}");
            }
            else
            {
                final = "/home";
                Console.WriteLine($"Google Login: Absolute returnUrl host not allowed, defaulting to /home");
            }
        }
        else
        {
            final = returnUrl.StartsWith("/") ? returnUrl : "/" + returnUrl;
            Console.WriteLine($"Google Login: Relative returnUrl processed = {final}");
        }

        var props = new AuthenticationProperties
        {
            RedirectUri = "/auth/signin-google", // URL ของ Backend
            Parameters = { { "prompt", "select_account" } }
        };

        Console.WriteLine($"Google Login: Redirecting to Google with final RedirectUri = /api/google-auth/callback");
        return Challenge(props, GoogleDefaults.AuthenticationScheme);
    }

    [HttpGet("signin-google")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback([FromQuery] string? returnUrl = "/home")
    {
        Console.WriteLine($"Google Callback: start, returnUrl={returnUrl}");

        var result = await HttpContext.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);
        Console.WriteLine($"Google Callback: AuthenticateAsync Succeeded={result.Succeeded}");

        if (!result.Succeeded)
        {
            Console.WriteLine($"Google Callback: authentication failed. Failure={result.Failure?.Message ?? "none"}");
            return BadRequest("Google authentication failed");
        }

        var principal = result.Principal;
        if (principal == null)
        {
            Console.WriteLine("Google Callback: result.Principal is null");
            return BadRequest("Google authentication failed");
        }

        var claims = principal.Claims.ToList();
        Console.WriteLine($"Google Callback: claims count={claims.Count}");

        var email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
        Console.WriteLine($"Google Callback: email={(email ?? "null")}");

        // สร้าง identity ใหม่ด้วย claims จาก Google
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity),
            new AuthenticationProperties { IsPersistent = true }
        );

        var redirectTo = returnUrl ?? "/home";
        Console.WriteLine($"Google Callback: redirecting to {redirectTo}");
        return Redirect(redirectTo);
    }

    [HttpGet("google")]
    [AllowAnonymous]
    public IActionResult Google([FromQuery] string? returnUrl = "/home")
    {
        Console.WriteLine($"Google Login: Received returnUrl = {returnUrl}");

        string final;
        if (string.IsNullOrWhiteSpace(returnUrl))
        {
            final = "/home";
            Console.WriteLine("Google Login: returnUrl is empty, defaulting to /home");
        }
        else if (Uri.TryCreate(returnUrl, UriKind.Absolute, out var abs))
        {
            var allowedHosts = new[] { "localhost", "msu-malog.egmu-research.org" };
            if (allowedHosts.Contains(abs.Host, StringComparer.OrdinalIgnoreCase))
            {
                final = abs.ToString();
                Console.WriteLine($"Google Login: Absolute returnUrl validated = {final}");
            }
            else
            {
                final = "/home";
                Console.WriteLine($"Google Login: Absolute returnUrl host not allowed, defaulting to /home");
            }
        }
        else
        {
            final = returnUrl.StartsWith("/") ? returnUrl : "/" + returnUrl;
            Console.WriteLine($"Google Login: Relative returnUrl processed = {final}");
        }

        var props = new AuthenticationProperties
        {
            RedirectUri = "/auth/signin-google", // URL ของ Backend
            Parameters = { { "prompt", "select_account" } }
        };

        Console.WriteLine($"Google Login: Redirecting to Google with final RedirectUri = /signin-google");
        return Challenge(props, "Google");
    }
}