using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Moq;
using MSUMALog.Server.Mappings;
using MSUMALog.Server.Models;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Repositories;
using MSUMALog.Server.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;
using MSUMALog.Server.Data;

namespace MSUMALog.Server.Services.Tests
{
    public class IncidentCommentServiceTests
    {
        private static IMapper BuildMapper()
        {
            var cfg = new MapperConfiguration(cfg =>
            {
                // ลงทะเบียนเฉพาะ profiles ที่คุณต้องการ (ไฟล์ที่คุณสร้างใหม่)
                cfg.AddProfile(new ConsolidatedAutoMapperProfile());
                cfg.AddProfile(new IncidentReportMapperProfile());
                cfg.AddProfile(new IncidentCommentMapperProfile());
                cfg.AddProfile(new IncidentAttachmentMapperProfile());
                cfg.AddProfile(new UserMapperProfile());
                // ถ้ายังมี profile ใหม่เพิ่มเติม ให้เพิ่มที่นี่
            });

            cfg.AssertConfigurationIsValid();
            return cfg.CreateMapper();
        }

        [Fact]
        public async Task GetByIdAsync_MapsCaseNoAndUserNames()
        {
            var mapper = BuildMapper();

            var comment = new IncidentComment
            {
                Id = 11,
                Body = "hello",
                IncidentReport = new IncidentReport { CaseNo = "CASE-11" },
                AuthorUser = new User { FirstName = "A", LastName = "B", Email = "a@e", Role = "User" },
                CreatedUser = new User { FirstName = "C", LastName = "D", Email = "c@e", Role = "Admin" },
                UpdatedUser = new User { FirstName = "E", LastName = "F", Email = "e@e", Role = "User" }
            };

            var repoMock = new Mock<IIncidentCommentRepository>();
            // respond for any id to avoid mismatch between test and service call
            repoMock.Setup(r => r.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(comment);

            // Use real in-memory ApplicationDbContext (DbContext has no parameterless ctor so Moq cannot proxy it)
            var dbOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase("incident-comment-test-db")
                .Options;
            await using var db = new ApplicationDbContext(dbOptions);
            var reportRepo = new Mock<IIncidentReportRepository>();
            var auditMock = new Mock<IAuditService>();

            // Seed the comment into the in-memory database because the service queries the DbContext
            db.IncidentComments.Add(comment);
            await db.SaveChangesAsync();

            var service = new IncidentCommentService(db, repoMock.Object, reportRepo.Object, mapper, auditMock.Object);

            var dto = await service.GetByIdAsync(11, CancellationToken.None);
            Assert.NotNull(dto);
            Assert.Equal("CASE-11", dto.CaseNo);
            Assert.Equal("A B", dto.AuthorUserName);
            Assert.Equal("C D", dto.CreatedUserName);
            Assert.Equal("E F", dto.UpdatedUserName);
        }
    }
}