using System;
using AutoMapper;
using MSUMALog.Server.Mapping;
using MSUMALog.Server.Models;
using MSUMALog.Server.DTOs;
using Xunit;

namespace MSUMALog.Server.Mapping.Tests
{
    public class ConsolidatedAutoMapperProfileTest
    {
        private static IMapper GetMapper()
        {
            var cfg = new MapperConfiguration(cfg => cfg.AddProfile(new ConsolidatedAutoMapperProfile()));
            cfg.AssertConfigurationIsValid();
            return cfg.CreateMapper();
        }

        [Fact]
        public void IncidentReport_To_IncidentReportDto_MapsFieldsAndParsesSeverity()
        {
            var mapper = GetMapper();

            var entity = new IncidentReport
            {
                CaseNo = "CASE-123",
                IncidentDate = new DateTime(2020, 1, 2, 3, 4, 5, DateTimeKind.Utc),
                SubDomain = "sub",
                PartNumber = "P-1",
                AdditionalInfo = "info",
                InterimAction = "intim",
                IntermediateAction = "interm",
                LongTermAction = "long",
                CreatedUserId = 1,
                UpdatedUserId = 2,
                ResponsibleName = "Resp",
                ResponsibleLineId = "L1",
                ResponsibleEmail = "r@e.com",
                ResponsiblePhone = "555",
                CreatedUser = new User { FirstName = "Alice", LastName = "Smith", Role = "Admin", Email = "a@e" },
                UpdatedUser = new User { FirstName = "Bob", LastName = "Jones", Role = "User", Email = "b@e" },
                CreatedUtc = new DateTime(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedUtc = new DateTime(2020, 2, 1, 0, 0, 0, DateTimeKind.Utc),
                EstimateCostOfMa = 123.45m,
                EstimateCostOfMaCurrency = "USD",
                Severity = "Priority 5"
            };

            var dto = mapper.Map<IncidentReportDto>(entity);

            Assert.Equal(entity.CaseNo, dto.CaseNo);
            Assert.Equal(entity.IncidentDate, dto.IncidentDate);
            Assert.Equal(entity.SubDomain, dto.SubDomain);
            Assert.Equal(entity.PartNumber, dto.PartNumber);
            Assert.Equal(entity.AdditionalInfo, dto.AdditionalInfo);
            Assert.Equal(entity.InterimAction, dto.InterimAction);
            Assert.Equal(entity.IntermediateAction, dto.IntermediateAction);
            Assert.Equal(entity.LongTermAction, dto.LongTermAction);
            Assert.Equal(entity.CreatedUserId, dto.CreatedUserId);
            Assert.Equal(entity.UpdatedUserId, dto.UpdatedUserId);
            Assert.Equal(entity.ResponsibleName, dto.ResponsibleName);
            Assert.Equal(entity.ResponsibleLineId, dto.ResponsibleLineId);
            Assert.Equal(entity.ResponsibleEmail, dto.ResponsibleEmail);
            Assert.Equal(entity.ResponsiblePhone, dto.ResponsiblePhone);
            Assert.Equal("Alice Smith", dto.CreatedUserName);
            Assert.Equal("Admin", dto.CreatedUserRole);
            Assert.Equal("Bob Jones", dto.UpdatedUserName);
            Assert.Equal("User", dto.UpdatedUserRole);
            Assert.Equal(entity.CreatedUtc, dto.CreatedUtc);
            Assert.Equal(entity.UpdatedUtc, dto.UpdatedUtc);
            Assert.Equal(entity.EstimateCostOfMa, dto.EstimateCostOfMa);
            Assert.Equal(entity.EstimateCostOfMaCurrency, dto.EstimateCostOfMaCurrency);
            Assert.Equal(5, dto.Severity);

            entity.Severity = null;
            var dto2 = mapper.Map<IncidentReportDto>(entity);
            Assert.Equal(0, dto2.Severity);
        }

        [Fact]
        public void IncidentReportDto_To_IncidentReport_MapsFieldsAndConvertsSeverity_And_IgnoresCaseNo()
        {
            var mapper = GetMapper();

            var sourceForDto = new IncidentReport
            {
                CaseNo = "CLIENT-PROVIDED",
                IncidentDate = DateTime.UtcNow,
                SubDomain = "sd",
                PartNumber = "PN",
                AdditionalInfo = "ai",
                InterimAction = "ia",
                IntermediateAction = "ima",
                LongTermAction = "lta",
                ResponsibleName = "RN",
                ResponsibleLineId = "RL",
                ResponsibleEmail = "re@e.com",
                ResponsiblePhone = "000",
                EstimateCostOfMa = 10.5m,
                EstimateCostOfMaCurrency = "EUR",
                Severity = "7"
            };

            var dto = mapper.Map<IncidentReportDto>(sourceForDto);
            var entity = mapper.Map<IncidentReport>(dto);

            Assert.True(string.IsNullOrEmpty(entity.CaseNo) || entity.CaseNo != dto.CaseNo);
            Assert.Equal(dto.SubDomain, entity.SubDomain);
            Assert.Equal(dto.PartNumber, entity.PartNumber);
            Assert.Equal(dto.AdditionalInfo, entity.AdditionalInfo);
            Assert.Equal(dto.InterimAction, entity.InterimAction);
            Assert.Equal(dto.IntermediateAction, entity.IntermediateAction);
            Assert.Equal(dto.LongTermAction, entity.LongTermAction);
            Assert.Equal(dto.ResponsibleName, entity.ResponsibleName);
            Assert.Equal(dto.ResponsibleLineId, entity.ResponsibleLineId);
            Assert.Equal(dto.ResponsibleEmail, entity.ResponsibleEmail);
            Assert.Equal(dto.ResponsiblePhone, entity.ResponsiblePhone);
            Assert.Equal(dto.EstimateCostOfMa, entity.EstimateCostOfMa);
            Assert.Equal(dto.EstimateCostOfMaCurrency, entity.EstimateCostOfMaCurrency);

            Assert.Equal(dto.Severity.ToString(), entity.Severity);
        }

        [Fact]
        public void IncidentComment_Mapping_CaseNoAndNavigationIgnored()
        {
            var mapper = GetMapper();

            var incident = new IncidentReport { CaseNo = "CASE-555" };
            var comment = new IncidentComment
            {
                Id = 1,
                IncidentReport = incident,
                IncidentReportId = 42,
                Body = "hello",
                AuthorUserId = 1,
                AuthorUser = new User { FirstName = "Ann", LastName = "Lee", Email = "ann@e" },
                CreatedUserId = 2,
                UpdatedUserId = 3,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow
            };

            var dto = mapper.Map<IncidentCommentDto>(comment);
            Assert.Equal("CASE-555", dto.CaseNo);
            Assert.Equal(1, dto.AuthorUserId);
            Assert.Equal("Ann Lee", dto.AuthorUserName);
            Assert.Equal(comment.CreatedUserId, dto.CreatedUserId);
            Assert.Equal(comment.UpdatedUserId, dto.UpdatedUserId);

            var dto2 = mapper.Map<IncidentCommentDto>(comment);
            var mapped = mapper.Map<IncidentComment>(dto2);

            Assert.Equal(dto2.Id, mapped.Id);
            Assert.Equal(dto2.IncidentReportId, mapped.IncidentReportId);
            Assert.Equal(dto2.Body, mapped.Body);
            Assert.Null(mapped.IncidentReport);
        }

        [Fact]
        public void IncidentAttachment_MapsKindAndIgnoresPhysicalPathOnDtoToEntity()
        {
            var mapper = GetMapper();

            var attach = new IncidentAttachment
            {
                Kind = AttachmentType.File,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
                RowVersion = new byte[] { 1, 2, 3 },
                PhysicalPath = "/var/data/file.bin"
            };

            var dto = mapper.Map<IncidentAttachmentDto>(attach);
            Assert.Equal(attach.Kind.ToString(), dto.Kind);

            var dto2 = mapper.Map<IncidentAttachmentDto>(new IncidentAttachment { Kind = AttachmentType.Image });
            var mapped = mapper.Map<IncidentAttachment>(dto2);
            Assert.Equal(AttachmentType.Image, mapped.Kind);
            Assert.True(string.IsNullOrEmpty(mapped.PhysicalPath));
        }

        [Fact]
        public void ResponsiblePerson_ReverseMap_RoundTrips()
        {
            var mapper = GetMapper();

            var rp = new ResponsiblePerson
            {
                Name = "R",
                Email = "r@e",
                Phone = "p",
                LineId = "L"
            };

            var dto = mapper.Map<ResponsiblePersonDto>(rp);
            var rp2 = mapper.Map<ResponsiblePerson>(dto);

            Assert.Equal(rp.Name, rp2.Name);
            Assert.Equal(rp.Email, rp2.Email);
            Assert.Equal(rp.Phone, rp2.Phone);
            Assert.Equal(rp.LineId, rp2.LineId);
        }

        [Fact]
        public void User_To_UserDto_And_Back_PreservesFields()
        {
            var mapper = GetMapper();

            var user = new User
            {
                Id = 1,
                FirstName = "F",
                LastName = "L",
                Email = "e@e",
                PhoneNumber = "555",
                LineID = "Line",
                OrganizationInfo = "Org",
                Role = "R",
                IsBlocked = true,
                ReceiveNotifications = false
            };

            var dto = mapper.Map<UserDto>(user);
            Assert.Equal(user.FirstName, dto.FirstName);
            Assert.Equal(user.LastName, dto.LastName);
            Assert.Equal(user.Email, dto.Email);
            Assert.Equal(user.PhoneNumber, dto.PhoneNumber);
            Assert.Equal(user.LineID, dto.LineID);
            Assert.Equal(user.OrganizationInfo, dto.OrganizationInfo);
            Assert.Equal(user.Role, dto.Role);
            Assert.Equal(user.IsBlocked, dto.IsBlocked);
            Assert.Equal(user.ReceiveNotifications, dto.ReceiveNotifications);

            var user2 = mapper.Map<User>(dto);
            Assert.Equal(dto.FirstName, user2.FirstName);
            Assert.Equal(dto.LastName, user2.LastName);
            Assert.Equal(dto.Email, user2.Email);
            Assert.Equal(dto.PhoneNumber, user2.PhoneNumber);
            Assert.Equal(dto.LineID, user2.LineID);
            Assert.Equal(dto.OrganizationInfo, user2.OrganizationInfo);
            Assert.Equal(dto.Role, user2.Role);
            Assert.Equal(dto.IsBlocked, user2.IsBlocked);
            Assert.Equal(dto.ReceiveNotifications, user2.ReceiveNotifications);
        }
    }
}