using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using System.Security.Claims;
using MSUMALog.Server.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using MSUMALog.Server.Models; // เพิ่มถ้ายังไม่มี
using Microsoft.AspNetCore.Identity; // <-- added for PasswordHasher
using System.Linq; // <-- added

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
    public record SetPasswordRequest(string Password);

    [HttpPost("basic-login")]
    public async Task<IActionResult> BasicLogin([FromBody] LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest("Missing email/password");

        var email = req.Email.Trim().ToLowerInvariant();

        // หา user จากฐานข้อมูล
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || string.IsNullOrEmpty(user.PasswordHash))
            return Unauthorized("Invalid credentials");

        var hasher = new PasswordHasher<User>();
        var verify = hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password);
        if (verify == PasswordVerificationResult.Failed)
            return Unauthorized("Invalid credentials");

        // อัปเดตสถิติการล็อกอิน
        user.LoginCount++;
        user.LastLoginDate = DateTime.UtcNow;
        user.Logs = "Basic login";
        await _db.SaveChangesAsync();

        // สร้าง claims คล้าย Google login
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Email),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FirstName ?? user.Email),
            new Claim(ClaimTypes.GivenName, user.FirstName ?? string.Empty),
            new Claim(ClaimTypes.Surname, user.LastName ?? string.Empty),
            new Claim("picture", user.ProfilePicture ?? string.Empty),
            new Claim(ClaimTypes.Role, user.Role ?? "User")
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

        // return user object เหมือน Google login flow /me
        return Ok(user);
    }

    // Set password for the currently authenticated user (e.g. user who logged in via Google)
    [Authorize]
    [HttpPost("set-password")]
    public async Task<IActionResult> SetPassword([FromBody] SetPasswordRequest req)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest("Missing password");

        if (!User.Identity?.IsAuthenticated ?? true)
            return Unauthorized();

        var email = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value
                    ?? User.Identity!.Name;

        if (string.IsNullOrWhiteSpace(email))
            return Unauthorized();

        email = email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
            return NotFound();

        var hasher = new PasswordHasher<User>();
        user.PasswordHash = hasher.HashPassword(user, req.Password);
        await _db.SaveChangesAsync();

        return Ok(new { email = user.Email });
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