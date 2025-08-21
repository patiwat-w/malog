using Xunit;
using Microsoft.AspNetCore.Mvc;
using MSUMALog.Server.Controllers;
using MSUMALog.Server.Data;
using MSUMALog.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using System.Threading.Tasks;
using Moq;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authentication;
using System.Collections.Generic;
using System.Linq;
using System;

public class AuthControllerTests
{
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
    private readonly Mock<IAuthenticationService> _authenticationServiceMock;
    private readonly Mock<IServiceProvider> _serviceProviderMock;

    public AuthControllerTests()
    {
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        _authenticationServiceMock = new Mock<IAuthenticationService>();
        _serviceProviderMock = new Mock<IServiceProvider>();
        
        // Setup service provider to return authentication service
        _serviceProviderMock.Setup(x => x.GetService(typeof(IAuthenticationService)))
            .Returns(_authenticationServiceMock.Object);
    }

    private AuthController CreateController(ApplicationDbContext dbContext)
    {
        var httpContext = new DefaultHttpContext
        {
            RequestServices = _serviceProviderMock.Object
        };

        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(httpContext);

        return new AuthController(dbContext)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            }
        };
    }

    private User CreateTestUser(string email, string password = null)
    {
        var user = new User
        {
            Email = email,
            Role = "User",
            FirstName = "Test",
            LastName = "User",
            LoginCount = 0,
            LastLoginDate = DateTime.MinValue,
            Logs = "",
            ProfilePicture = "https://example.com/avatar.jpg",
            Position = "Developer",
            Department = "IT"
        };

        if (!string.IsNullOrEmpty(password))
        {
            var hasher = new PasswordHasher<User>();
            user.PasswordHash = hasher.HashPassword(user, password);
        }

        return user;
    }

    [Fact]
    public async Task BasicLogin_ReturnsUnauthorized_WhenUserNotFound()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb1")
            .Options;
        
        using var db = new ApplicationDbContext(options);
        var controller = CreateController(db);

        var req = new AuthController.LoginRequest("notfound@email.com", "password");

        // Act
        var result = await controller.BasicLogin(req);

        // Assert
        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
        Assert.Equal("Invalid credentials", unauthorizedResult.Value);
    }

    [Fact]
    public async Task BasicLogin_ReturnsUnauthorized_WhenPasswordIncorrect()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb2")
            .Options;
        
        using var db = new ApplicationDbContext(options);

        var user = CreateTestUser("test@email.com", "correctpassword");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var controller = CreateController(db);
        var req = new AuthController.LoginRequest("test@email.com", "wrongpassword");

        // Act
        var result = await controller.BasicLogin(req);

        // Assert
        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
        Assert.Equal("Invalid credentials", unauthorizedResult.Value);
    }

    [Fact]
    public async Task BasicLogin_ReturnsOk_WhenCredentialsAreCorrect()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb3")
            .Options;
        
        using var db = new ApplicationDbContext(options);

        var user = CreateTestUser("test@email.com", "correctpassword");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // Mock authentication service
        _authenticationServiceMock.Setup(x => x.SignInAsync(
            It.IsAny<HttpContext>(),
            It.IsAny<string>(),
            It.IsAny<ClaimsPrincipal>(),
            It.IsAny<AuthenticationProperties>()
        )).Returns(Task.CompletedTask);

        var controller = CreateController(db);
        var req = new AuthController.LoginRequest("test@email.com", "correctpassword");

        // Act
        var result = await controller.BasicLogin(req);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var returnedUser = Assert.IsType<User>(okResult.Value);
        Assert.Equal("test@email.com", returnedUser.Email);
        
        // Verify user was updated in database
        var updatedUser = await db.Users.FirstOrDefaultAsync(u => u.Email == "test@email.com");
        Assert.NotNull(updatedUser);
        Assert.Equal(1, updatedUser.LoginCount);
        Assert.True(updatedUser.LastLoginDate > DateTime.UtcNow.AddMinutes(-1)); // Should be recent
        Assert.Equal("Basic login", updatedUser.Logs);
    }

    [Fact]
    public async Task BasicLogin_ReturnsBadRequest_WhenEmailOrPasswordMissing()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb4")
            .Options;
        
        using var db = new ApplicationDbContext(options);
        var controller = CreateController(db);

        // Test cases
        var testCases = new[]
        {
            new AuthController.LoginRequest("", "password"),
            new AuthController.LoginRequest("test@email.com", ""),
            new AuthController.LoginRequest("", "")
        };

        foreach (var req in testCases)
        {
            // Act
            var result = await controller.BasicLogin(req);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Missing email/password", badRequestResult.Value);
        }
    }

    [Fact]
    public async Task BasicLogin_ReturnsUnauthorized_WhenUserHasNoPassword()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb5")
            .Options;
        
        using var db = new ApplicationDbContext(options);

        // Create user without password
        var user = CreateTestUser("test@email.com");
        user.PasswordHash = null; // No password set

        db.Users.Add(user);
        await db.SaveChangesAsync();

        var controller = CreateController(db);
        var req = new AuthController.LoginRequest("test@email.com", "anypassword");

        // Act
        var result = await controller.BasicLogin(req);

        // Assert
        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
        Assert.Equal("Invalid credentials", unauthorizedResult.Value);
    }

    [Fact]
    public async Task BasicLogin_CreatesCorrectClaims_ForAuthenticatedUser()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb6")
            .Options;
        
        using var db = new ApplicationDbContext(options);

        var user = CreateTestUser("test@email.com", "correctpassword");
        user.FirstName = "John";
        user.LastName = "Doe";
        user.ProfilePicture = "https://example.com/john.jpg";
        user.Role = "Admin";
        
        db.Users.Add(user);
        await db.SaveChangesAsync();

        ClaimsPrincipal capturedPrincipal = null;
        
        // Mock authentication service to capture the claims principal
        _authenticationServiceMock.Setup(x => x.SignInAsync(
            It.IsAny<HttpContext>(),
            It.IsAny<string>(),
            It.IsAny<ClaimsPrincipal>(),
            It.IsAny<AuthenticationProperties>()
        )).Callback<HttpContext, string, ClaimsPrincipal, AuthenticationProperties>(
            (_, _, principal, _) => capturedPrincipal = principal
        ).Returns(Task.CompletedTask);

        var controller = CreateController(db);
        var req = new AuthController.LoginRequest("test@email.com", "correctpassword");

        // Act
        var result = await controller.BasicLogin(req);

        // Assert
        Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(capturedPrincipal);
        
        var claims = capturedPrincipal.Claims.ToList();
        Assert.Contains(claims, c => c.Type == ClaimTypes.NameIdentifier && c.Value == user.Id.ToString());
        Assert.Contains(claims, c => c.Type == ClaimTypes.Email && c.Value == "test@email.com");
        Assert.Contains(claims, c => c.Type == ClaimTypes.Name && c.Value == "John");
        Assert.Contains(claims, c => c.Type == ClaimTypes.GivenName && c.Value == "John");
        Assert.Contains(claims, c => c.Type == ClaimTypes.Surname && c.Value == "Doe");
        Assert.Contains(claims, c => c.Type == "picture" && c.Value == "https://example.com/john.jpg");
        Assert.Contains(claims, c => c.Type == ClaimTypes.Role && c.Value == "Admin");
    }
}