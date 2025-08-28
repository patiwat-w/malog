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

public class IncidentReportsControllerTests
{
    private IncidentReportsController CreateController(
        IIncidentReportService service,
        ApplicationDbContext dbContext,
        ClaimsPrincipal? user = null) // เพิ่ม ? ให้เป็น nullable
    {
        // สร้าง mock สำหรับ IAuditService แล้วส่งเข้าไปยังคอนโทรลเลอร์
        var auditMock = new Mock<IAuditService>();

        var controller = new IncidentReportsController(service, dbContext, auditMock.Object);
        var httpContext = new DefaultHttpContext();
        if (user != null)
            httpContext.User = user;
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        return controller;
    }

    // คำอธิบาย: ทดสอบ GetAll เมื่อผู้ใช้งานไม่ authenticated
    // ผลลัพธ์ที่คาดหวัง: คืนค่า UnauthorizedObjectResult พร้อมข้อความ "User not authenticated"
    [Fact]
    public async Task GetAll_ReturnsUnauthorized_IfUserNotAuthenticated()
    {
        var serviceMock = new Mock<IIncidentReportService>();
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase("TestDb1")
            .Options;
        using var dbContext = new ApplicationDbContext(options);
        var controller = CreateController(serviceMock.Object, dbContext);

        var result = await controller.GetAll(CancellationToken.None);

        var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result.Result);
        Assert.Equal("User not authenticated", unauthorized.Value);
    }

    // คำอธิบาย: ทดสอบ Create เมื่อ claim มีชื่อแต่ไม่พบผู้ใช้ในฐานข้อมูล
    // ผลลัพธ์ที่คาดหวัง: คืนค่า UnauthorizedObjectResult พร้อมข้อความ "User not found"
    [Fact]
    public async Task Create_ReturnsUnauthorized_IfUserIdNotFound()
    {
        var serviceMock = new Mock<IIncidentReportService>();
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase("TestDb2")
            .Options;
        using var dbContext = new ApplicationDbContext(options);
        var claims = new List<Claim> { new Claim(ClaimTypes.Name, "test") };
        var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        var controller = CreateController(serviceMock.Object, dbContext, user);

        var result = await controller.Create(new IncidentReportCreateDto(), CancellationToken.None);

        var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result.Result);
        Assert.Equal("User not found", unauthorized.Value);
    }

    // คำอธิบาย: ทดสอบ Create เมื่อมี user id ใน claim และ service คืนค่า object ที่สร้างแล้ว
    // ผลลัพธ์ที่คาดหวัง: คืนค่า CreatedAtActionResult และ Body เท่ากับ DTO ที่สร้างโดย service
    [Fact]
    public async Task Create_ReturnsCreated_WhenValid()
    {
        var serviceMock = new Mock<IIncidentReportService>();
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase("TestDb3")
            .Options;
        using var dbContext = new ApplicationDbContext(options);
        var claims = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "123") };
        var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        var controller = CreateController(serviceMock.Object, dbContext, user);

        // เปลี่ยนให้ mock คืน IncidentReportDto (ไม่ใช่ CreateDto)
        var createDto = new IncidentReportCreateDto { /* Initialize properties as needed */ };
        var dto = new IncidentReportDto { Id = 1 };
        serviceMock.Setup(s => s.CreateAsync(It.IsAny<IncidentReportCreateDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(dto);

        var result = await controller.Create(createDto, CancellationToken.None);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(dto, created.Value);
    }
}