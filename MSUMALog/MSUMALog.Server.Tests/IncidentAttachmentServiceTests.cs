using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Moq;
using MSUMALog.Server.Mappings;
using MSUMALog.Server.Models;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Repositories;
using MSUMALog.Server.Services;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Hosting;
using Xunit;
using MSUMALog.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace MSUMALog.Server.Services.Tests
{
    public class IncidentAttachmentServiceTests
    {
        private static IMapper BuildMapper()
        {
            // Register only the explicit profiles you maintain to avoid duplicate CreateMap definitions
            var cfg = new MapperConfiguration(cfg =>
            {
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
        public async Task CreateAsync_MapsDtoAndResolvesKind()
        {
            var mapper = BuildMapper();

            var repoMock = new Mock<IIncidentAttachmentRepository>();
            repoMock.Setup(r => r.AddAsync(It.IsAny<IncidentAttachment>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Use a real in-memory ApplicationDbContext instance instead of mocking (DbContext has no parameterless ctor)
            var dbOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase("incident-attachment-test-db")
                .Options;
            await using var db = new ApplicationDbContext(dbOptions);

            var auditMock = new Mock<IAuditService>();
            var envMock = new Mock<IWebHostEnvironment>();
            var opts = Options.Create(new UploadsOptions { RootPath = ".", AllowedMimePrefixes = new string[0] });

            var service = new IncidentAttachmentService(repoMock.Object, mapper, opts, envMock.Object, db, auditMock.Object, Options.Create(new AuditConfig()));

            var dto = new IncidentAttachmentDto { Kind = "Image", FileName = "f.jpg" };

            // simulate repo returning reloaded entity after add (just call CreateAsync and ensure no exception)
            repoMock.Setup(r => r.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(new IncidentAttachment { Kind = AttachmentType.Image });

            // call CreateAsync (non-file overload)
            var created = await service.CreateAsync(dto, CancellationToken.None);

            Assert.Equal("Image", created.Kind);
        }
    }
}