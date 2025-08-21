using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using MSUMALog.Server.Controllers;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Services;
using MSUMALog.Server.Data;
using System.Collections.Generic;
using System;
using Microsoft.EntityFrameworkCore;

public class IncidentCommentsControllerTests
{
    private IncidentCommentsController CreateController(
        IIncidentCommentService service,
        ApplicationDbContext dbContext,
        ClaimsPrincipal? user = null) // เพิ่ม ? ให้เป็น nullable
    {
        var controller = new IncidentCommentsController(service, dbContext);
        var httpContext = new DefaultHttpContext();
        if (user != null)
            httpContext.User = user;
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        return controller;
    }

    [Fact]
    public async Task Create_ReturnsUnauthorized_IfUserNotAuthenticated()
    {
        // Arrange
        var serviceMock = new Mock<IIncidentCommentService>();
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb1")
            .Options;
        using var dbContext = new ApplicationDbContext(options);
        var controller = CreateController(serviceMock.Object, dbContext);

        // Act
        var result = await controller.Create(new IncidentCommentDto(), CancellationToken.None);

        // Assert
        var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result.Result);
        Assert.Equal("User not authenticated", unauthorized.Value);
    }

    [Fact]
    public async Task Create_ReturnsUnauthorized_IfUserIdNotFound()
    {
        // Arrange
        var serviceMock = new Mock<IIncidentCommentService>();
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb2")
            .Options;
        using var dbContext = new ApplicationDbContext(options);
        var claims = new List<Claim> { new Claim(ClaimTypes.Name, "test") };
        var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        var controller = CreateController(serviceMock.Object, dbContext, user);

        // Act
        var result = await controller.Create(new IncidentCommentDto(), CancellationToken.None);

        // Assert
        var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result.Result);
        Assert.Equal("User not found", unauthorized.Value);
    }

    [Fact]
    public async Task Create_ReturnsCreated_WhenValid()
    {
        // Arrange
        var serviceMock = new Mock<IIncidentCommentService>();
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb3")
            .Options;
        using var dbContext = new ApplicationDbContext(options);
        var claims = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "123") };
        var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        var controller = CreateController(serviceMock.Object, dbContext, user);

        var dto = new IncidentCommentDto { IncidentReportId = 1 };
        serviceMock.Setup(s => s.CreateAsync(It.IsAny<IncidentCommentDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(dto);

        // Act
        var result = await controller.Create(dto, CancellationToken.None);

        // Assert
        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(dto, created.Value);
    }
}