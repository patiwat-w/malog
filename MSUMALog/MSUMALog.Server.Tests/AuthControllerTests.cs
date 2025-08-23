using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using MSUMALog.Server.Controllers;
using MSUMALog.Server.Data;
using MSUMALog.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.Cookies;
using System;

// ชุดทดสอบสำหรับ AuthController:
// คำอธิบาย: แต่ละเคสทดสอบตรวจสอบพฤติกรรมของ AuthController และผลลัพธ์ที่คาดหวัง (เช่น สถานะ HTTP และข้อความ/วัตถุที่คืนค่า)
public class AuthControllerTests
{
    private DefaultHttpContext CreateHttpContextWithAuthMock(Mock<IAuthenticationService> authMock)
    {
        var services = new ServiceCollection();
        services.AddSingleton<IAuthenticationService>(authMock.Object);
        var provider = services.BuildServiceProvider();

        var ctx = new DefaultHttpContext
        {
            RequestServices = provider
        };
        return ctx;
    }

    // คำอธิบาย: ทดสอบ BasicLogin เมื่อไม่มีข้อมูลรับรอง (email/password)
    // ผลลัพธ์ที่คาดหวัง: คืนค่า BadRequest พร้อมข้อความ "Missing email/password"
    [Fact]
    public async Task BasicLogin_ReturnsBadRequest_WhenMissingCredentials()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase("AuthTestDb_MissingCreds")
            .Options;
        await using var db = new ApplicationDbContext(options);
        var controller = new AuthController(db);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.BasicLogin(new AuthController.LoginRequest("", ""));
        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Missing email/password", bad.Value);
    }

    // คำอธิบาย: ทดสอบ BasicLogin เมื่อรหัสผ่านไม่ถูกต้องสำหรับผู้ใช้ที่มีในฐานข้อมูล
    // ผลลัพธ์ที่คาดหวัง: คืนค่า Unauthorized พร้อมข้อความ "Invalid credentials"
    [Fact]
    public async Task BasicLogin_ReturnsUnauthorized_WhenInvalidPassword()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase("AuthTestDb_InvalidPwd")
            .Options;
        await using var db = new ApplicationDbContext(options);
        // seed user with known password hash
        var user = new User { Email = "user@example.com", Role = "User", Logs = "" };
        var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
        user.PasswordHash = hasher.HashPassword(user, "correct-password");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var authMock = new Mock<IAuthenticationService>();
        var ctx = CreateHttpContextWithAuthMock(authMock);

        var controller = new AuthController(db);
        controller.ControllerContext = new ControllerContext { HttpContext = ctx };

        var result = await controller.BasicLogin(new AuthController.LoginRequest("user@example.com", "wrong-password"));
        var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result);
        Assert.Equal("Invalid credentials", unauthorized.Value);
    }

    // คำอธิบาย: ทดสอบ BasicLogin กับข้อมูลรับรองที่ถูกต้อง
    // ผลลัพธ์ที่คาดหวัง: คืนค่า Ok พร้อมวัตถุ User และเรียก SignInAsync เพื่อลงชื่อเข้าใช้
    [Fact]
    public async Task BasicLogin_ReturnsOkAndSignsIn_WhenValidCredentials()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase("AuthTestDb_ValidLogin")
            .Options;
        await using var db = new ApplicationDbContext(options);
        var user = new User { Email = "valid@example.com", FirstName = "V", LastName = "User", Role = "User", Logs = "" };
        var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
        user.PasswordHash = hasher.HashPassword(user, "secret");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var authMock = new Mock<IAuthenticationService>();
        authMock
            .Setup(s => s.SignInAsync(It.IsAny<HttpContext>(), It.Is<string>(sch => sch == CookieAuthenticationDefaults.AuthenticationScheme),
                It.IsAny<ClaimsPrincipal>(), It.IsAny<AuthenticationProperties>()))
            .Returns(Task.CompletedTask)
            .Verifiable();

        var ctx = CreateHttpContextWithAuthMock(authMock);

        var controller = new AuthController(db);
        controller.ControllerContext = new ControllerContext { HttpContext = ctx };

        var result = await controller.BasicLogin(new AuthController.LoginRequest("valid@example.com", "secret"));
        var ok = Assert.IsType<OkObjectResult>(result);
        var returnedUser = Assert.IsType<User>(ok.Value);
        Assert.Equal("valid@example.com", returnedUser.Email);

        authMock.Verify(); // ensure SignInAsync was invoked
    }

    // คำอธิบาย: ทดสอบ SetPassword สำหรับผู้ใช้ที่ authenticated (จาก Claim email)
    // ผลลัพธ์ที่คาดหวัง: คืนค่า Ok พร้อมข้อมูลที่มี email และอัปเดต PasswordHash ในฐานข้อมูล
    [Fact]
    public async Task SetPassword_SetsHash_ForAuthenticatedUser()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase("AuthTestDb_SetPassword")
            .Options;
        await using var db = new ApplicationDbContext(options);
        var user = new User { Email = "setpass@example.com", Role = "User", Logs = "" };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var controller = new AuthController(db);
        var claims = new[] { new Claim(ClaimTypes.Email, "setpass@example.com") };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        var res = await controller.SetPassword(new AuthController.SetPasswordRequest("newpwd"));
        var ok = Assert.IsType<OkObjectResult>(res);
        Assert.NotNull(ok.Value);

        // try to extract email whether the controller returned a User or an anonymous/object with Email/email property
        string? returnedEmail = null;
        if (ok.Value is User u) returnedEmail = u.Email;
        else
        {
            var t = ok.Value.GetType();
            var prop = t.GetProperty("email") ?? t.GetProperty("Email");
            returnedEmail = prop?.GetValue(ok.Value) as string;
        }
        Assert.Equal("setpass@example.com", returnedEmail);

        var updated = await db.Users.FirstOrDefaultAsync(u => u.Email == "setpass@example.com");
        Assert.False(string.IsNullOrWhiteSpace(updated!.PasswordHash));
    }

    // คำอธิบาย: ทดสอบ Me เมื่อผู้ใช้ authenticated
    // ผลลัพธ์ที่คาดหวัง: คืนค่า Ok พร้อมวัตถุ User ที่มีอีเมลตรงกับ Claim
    [Fact]
    public async Task Me_ReturnsUser_WhenAuthenticated()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase("AuthTestDb_Me")
            .Options;
        await using var db = new ApplicationDbContext(options);
        var user = new User { Email = "me@example.com", FirstName = "Me", Role = "User", Logs = "" };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var controller = new AuthController(db);
        var claims = new[] { new Claim(ClaimTypes.Email, "me@example.com") };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = principal } };

        var result = await controller.Me();
        var ok = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsType<User>(ok.Value);
        Assert.Equal("me@example.com", returned.Email);
    }

    // คำอธิบาย: ทดสอบ Logout สำหรับผู้ใช้ที่ authenticated
    // ผลลัพธ์ที่คาดหวัง: เรียก SignOutAsync และคืนค่า NoContent
    [Fact]
    public async Task Logout_InvokesSignOut_WhenUserAuthenticated()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase("AuthTestDb_Logout")
            .Options;
        await using var db = new ApplicationDbContext(options);

        var authMock = new Mock<IAuthenticationService>();
        authMock
            .Setup(s => s.SignOutAsync(It.IsAny<HttpContext>(), It.Is<string>(sch => sch == CookieAuthenticationDefaults.AuthenticationScheme), It.IsAny<AuthenticationProperties?>()))
            .Returns(Task.CompletedTask)
            .Verifiable();

        var ctx = CreateHttpContextWithAuthMock(authMock);
        // set an authenticated user
        var claims = new[] { new Claim(ClaimTypes.Email, "logout@example.com") };
        ctx.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));

        var controller = new AuthController(db);
        controller.ControllerContext = new ControllerContext { HttpContext = ctx };

        var res = await controller.Logout();
        Assert.IsType<NoContentResult>(res);

        authMock.Verify();
    }
}