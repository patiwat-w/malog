using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using System.Security.Claims;
using MSUMALog.Server.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using MSUMALog.Server.Models; // เพิ่มถ้ายังไม่มี

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
    [ProducesResponseType(typeof(User), StatusCodes.Status200OK)]
    public async Task<IActionResult> Me()
    {
        if (!User.Identity?.IsAuthenticated ?? true)
            return Unauthorized();

        var email = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value
                    ?? User.Identity!.Name
                    ?? "unknown";

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
            return NotFound();

        return Ok(user); // return Model User ตรงๆ
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        if (User.Identity?.IsAuthenticated == true)
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

        return NoContent();
    }
}