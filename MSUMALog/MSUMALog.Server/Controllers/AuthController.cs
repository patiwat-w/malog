using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using System.Security.Claims;
using MSUMALog.Server.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace MSUMALog.Server.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public AuthController(ApplicationDbContext db)
    {
        _db = db;
    }

    public record LoginRequest(string Email, string Password);

    [HttpPost("basic-login")]
    public async Task<IActionResult> BasicLogin([FromBody] LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest("Missing email/password");

        // ตัวอย่าง: หา user (ปรับตาม entity จริง)
        // สมมุติว่า entity ชื่อ Users และมีฟิลด์ Email, PasswordHash
        // var user = await _db.Users.SingleOrDefaultAsync(u => u.Email == req.Email);
        // if (user == null || !PasswordHasher.Verify(req.Password, user.PasswordHash)) return Unauthorized();

        // DEMO ONLY (ให้ผ่านทุกพาสเวิร์ด) -> แก้เป็นตรวจจริง
        var email = req.Email.Trim().ToLowerInvariant();

        // Claims
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, email),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Name, email) // ปรับตามจริง (เช่น FirstName)
        };

        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal,
            new AuthenticationProperties
            {
                IsPersistent = true,
                ExpiresUtc = DateTimeOffset.UtcNow.AddHours(8)
            });

        return Ok(new { email });
    }

    [HttpGet("me")]
    public IActionResult Me()
    {
        if (!User.Identity?.IsAuthenticated ?? true)
            return Unauthorized();

        var email = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value
                    ?? User.Identity!.Name
                    ?? "unknown";

        return Ok(new
        {
            email
            // เติมข้อมูลอื่นตามต้องการ เช่น roles, displayName
        });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        if (User.Identity?.IsAuthenticated == true)
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

        return NoContent();
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