using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Moq;
using MSUMALog.Server.Mappings;
using MSUMALog.Server.Models;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Repositories;
using MSUMALog.Server.Services;
using Microsoft.AspNetCore.Http;
using Xunit;
using MSUMALog.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace MSUMALog.Server.Services.Tests
{
    public class IncidentReportServiceTests
    {
        private static IMapper BuildMapper()
        {
            var cfg = new MapperConfiguration(cfg =>
            {
                // register only the profiles you maintain to avoid duplicate CreateMap definitions
                cfg.AddProfile(new ConsolidatedAutoMapperProfile());
                cfg.AddProfile(new IncidentReportMapperProfile());
                cfg.AddProfile(new IncidentCommentMapperProfile());
                cfg.AddProfile(new IncidentAttachmentMapperProfile());
                cfg.AddProfile(new UserMapperProfile());
            });
            cfg.AssertConfigurationIsValid();
            return cfg.CreateMapper();
        }

        [Fact]
        public async Task CreateAsync_MapsDtoAndCallsRepository()
        {
            var mapper = BuildMapper();

            var repoMock = new Mock<IIncidentReportRepository>();
            repoMock.Setup(r => r.AddAsync(It.IsAny<IncidentReport>(), It.IsAny<CancellationToken>()))
                .Returns((IncidentReport report, CancellationToken token) => Task.FromResult(report))
                .Verifiable();

            var httpAccessorMock = new Mock<IHttpContextAccessor>();
            var auditMock = new Mock<IAuditService>();
            // Use real in-memory ApplicationDbContext instead of mocking (DbContext has no parameterless ctor)
            var dbOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase("incident-report-test-db")
                .Options;
            await using var db = new ApplicationDbContext(dbOptions);

            var service = new IncidentReportService(repoMock.Object, mapper, db, httpAccessorMock.Object, auditMock.Object, Microsoft.Extensions.Options.Options.Create(new AuditConfig()));

            var dto = new IncidentReportCreateDto { SubDomain = "sd" };

            var result = await service.CreateAsync(dto);

            // Service generates CaseNo when creating; assert it was created and has expected format
            Assert.False(string.IsNullOrEmpty(result.CaseNo));
            Assert.Matches(@"^\d{4}-\d{2}-\d{4}$", result.CaseNo);

            repoMock.Verify();
        }
    }
}