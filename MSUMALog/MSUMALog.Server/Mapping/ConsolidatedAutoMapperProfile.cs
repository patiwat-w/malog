using System;
using System.Text.RegularExpressions;
using AutoMapper;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Models;

namespace MSUMALog.Server.Mapping;

public class ConsolidatedAutoMapperProfile : Profile
{
    public ConsolidatedAutoMapperProfile()
    {
        // IncidentReport -> IncidentReportDto
        CreateMap<IncidentReport, IncidentReportDto>()
            .ForMember(d => d.CaseNo, o => o.MapFrom(s => s.CaseNo))
            .ForMember(d => d.IncidentDate, o => o.MapFrom(s => s.IncidentDate))
            .ForMember(d => d.SubDomain, o => o.MapFrom(s => s.SubDomain))
            .ForMember(d => d.PartNumber, o => o.MapFrom(s => s.PartNumber))
            .ForMember(d => d.AdditionalInfo, o => o.MapFrom(s => s.AdditionalInfo))
            .ForMember(d => d.InterimAction, o => o.MapFrom(s => s.InterimAction))
            .ForMember(d => d.IntermediateAction, o => o.MapFrom(s => s.IntermediateAction))
            .ForMember(d => d.LongTermAction, o => o.MapFrom(s => s.LongTermAction))
            .ForMember(d => d.CreatedUserId, o => o.MapFrom(s => s.CreatedUserId))
            .ForMember(d => d.UpdatedUserId, o => o.MapFrom(s => s.UpdatedUserId))
            .ForMember(d => d.ResponsibleName, o => o.MapFrom(s => s.ResponsibleName))
            .ForMember(d => d.ResponsibleLineId, o => o.MapFrom(s => s.ResponsibleLineId))
            .ForMember(d => d.ResponsibleEmail, o => o.MapFrom(s => s.ResponsibleEmail))
            .ForMember(d => d.ResponsiblePhone, o => o.MapFrom(s => s.ResponsiblePhone))
            .ForMember(d => d.CreatedUserName, o => o.MapFrom(s => s.CreatedUser != null ? $"{(s.CreatedUser.FirstName ?? "").Trim()} {(s.CreatedUser.LastName ?? "").Trim()}".Trim() : null))
            .ForMember(d => d.CreatedUserRole, o => o.MapFrom(s => s.CreatedUser != null ? s.CreatedUser.Role : null))
            .ForMember(d => d.UpdatedUserName, o => o.MapFrom(s => s.UpdatedUser != null ? $"{(s.UpdatedUser.FirstName ?? "").Trim()} {(s.UpdatedUser.LastName ?? "").Trim()}".Trim() : null))
            .ForMember(d => d.UpdatedUserRole, o => o.MapFrom(s => s.UpdatedUser != null ? s.UpdatedUser.Role : null))
            .ForMember(d => d.CreatedUtc, o => o.MapFrom(s => s.CreatedUtc))
            .ForMember(d => d.UpdatedUtc, o => o.MapFrom(s => s.UpdatedUtc))
            // map Description if DTO uses that name
            .ForMember(d => d.Description, o => o.MapFrom(s => s.Symptoms))
            // DTO uses EstimateCostMyMA names — map from model's EstimateCostOfMa
            .ForMember(d => d.EstimateCostMyMA, o => o.MapFrom(s => s.EstimateCostOfMa))
            .ForMember(d => d.EstimateCostMyMACurrency, o => o.MapFrom(s => s.EstimateCostOfMaCurrency))
            .ForMember(d => d.EstimateCostOfMa, o => o.MapFrom(s => s.EstimateCostOfMa)) // keep original if present
            .ForMember(d => d.EstimateCostOfMaCurrency, o => o.MapFrom(s => s.EstimateCostOfMaCurrency))
            .ForMember(d => d.Severity, opt => opt.MapFrom(s => ParseSeverityNumber(s.Severity)));

        // IncidentReportDto -> IncidentReport
        CreateMap<IncidentReportDto, IncidentReport>()
            .ForMember(d => d.CaseNo, o => o.Ignore())
            .ForMember(d => d.IncidentDate, o => o.MapFrom(s => s.IncidentDate ?? DateTime.UtcNow))
            .ForMember(d => d.SubDomain, o => o.MapFrom(s => s.SubDomain))
            .ForMember(d => d.PartNumber, o => o.MapFrom(s => s.PartNumber))
            .ForMember(d => d.AdditionalInfo, o => o.MapFrom(s => s.AdditionalInfo))
            .ForMember(d => d.InterimAction, o => o.MapFrom(s => s.InterimAction))
            .ForMember(d => d.IntermediateAction, o => o.MapFrom(s => s.IntermediateAction))
            .ForMember(d => d.LongTermAction, o => o.MapFrom(s => s.LongTermAction))
            .ForMember(d => d.CreatedUserId, o => o.Ignore())
            .ForMember(d => d.UpdatedUserId, o => o.Ignore())
            .ForMember(d => d.CreatedUtc, o => o.Ignore())
            .ForMember(d => d.UpdatedUtc, o => o.Ignore())
            .ForMember(d => d.ResponsibleName, o => o.MapFrom(s => s.ResponsibleName))
            .ForMember(d => d.ResponsibleLineId, o => o.MapFrom(s => s.ResponsibleLineId))
            .ForMember(d => d.ResponsibleEmail, o => o.MapFrom(s => s.ResponsibleEmail))
            .ForMember(d => d.ResponsiblePhone, o => o.MapFrom(s => s.ResponsiblePhone))
            .ForMember(d => d.EstimateCostOfMa, o => o.MapFrom(s => s.EstimateCostMyMA ?? s.EstimateCostOfMa))
            .ForMember(d => d.EstimateCostOfMaCurrency, o => o.MapFrom(s => s.EstimateCostMyMACurrency ?? s.EstimateCostOfMaCurrency))
            .ForMember(d => d.Severity, opt => opt.MapFrom(s => s.Severity.ToString()))
            // navigation properties from DTO -> Entity should be ignored
            .ForMember(d => d.CreatedUser, o => o.Ignore())
            .ForMember(d => d.UpdatedUser, o => o.Ignore());

        // IncidentComment -> IncidentCommentDto
        CreateMap<IncidentComment, IncidentCommentDto>()
            .ForMember(d => d.CaseNo, o => o.MapFrom(s => s.IncidentReport != null ? s.IncidentReport.CaseNo : null))
            .ForMember(d => d.AuthorUserId, o => o.MapFrom(s => s.AuthorUserId))
            .ForMember(d => d.AuthorUserName, o => o.MapFrom(s => s.AuthorUser != null ? $"{(s.AuthorUser.FirstName ?? "").Trim()} {(s.AuthorUser.LastName ?? "").Trim()}".Trim() : null))
            .ForMember(d => d.CreatedUserName, o => o.MapFrom(s => s.CreatedUser != null ? $"{(s.CreatedUser.FirstName ?? "").Trim()} {(s.CreatedUser.LastName ?? "").Trim()}".Trim() : null))
            .ForMember(d => d.UpdatedUserName, o => o.MapFrom(s => s.UpdatedUser != null ? $"{(s.UpdatedUser.FirstName ?? "").Trim()} {(s.UpdatedUser.LastName ?? "").Trim()}".Trim() : null))
            .ForMember(d => d.CreatedUserId, o => o.MapFrom(s => s.CreatedUserId))
            .ForMember(d => d.UpdatedUserId, o => o.MapFrom(s => s.UpdatedUserId))
            .ForMember(d => d.CreatedUtc, o => o.MapFrom(s => s.CreatedUtc))
            .ForMember(d => d.UpdatedUtc, o => o.MapFrom(s => s.UpdatedUtc));

        // IncidentCommentDto -> IncidentComment
        CreateMap<IncidentCommentDto, IncidentComment>()
            .ForMember(e => e.Id, opt => opt.MapFrom(d => d.Id))
            .ForMember(e => e.IncidentReportId, opt => opt.MapFrom(d => d.IncidentReportId))
            .ForMember(e => e.Body, opt => opt.MapFrom(d => d.Body))
            .ForMember(e => e.AuthorUserId, opt => opt.MapFrom(d => d.AuthorUserId))
            .ForMember(e => e.CreatedUserId, opt => opt.MapFrom(d => d.CreatedUserId))
            .ForMember(e => e.UpdatedUserId, opt => opt.MapFrom(d => d.UpdatedUserId))
            .ForMember(e => e.CreatedUtc, opt => opt.MapFrom(d => d.CreatedUtc ?? DateTime.UtcNow))
            .ForMember(e => e.UpdatedUtc, opt => opt.MapFrom(d => d.UpdatedUtc))
            .ForMember(d => d.IncidentReport, o => o.Ignore())
            // ignore navigation properties on destination
            .ForMember(d => d.AuthorUser, o => o.Ignore())
            .ForMember(d => d.CreatedUser, o => o.Ignore())
            .ForMember(d => d.UpdatedUser, o => o.Ignore())
            .ForSourceMember(d => d.AuthorUserName, opt => opt.DoNotValidate())
            .ForSourceMember(d => d.CreatedUserName, opt => opt.DoNotValidate())
            .ForSourceMember(d => d.UpdatedUserName, opt => opt.DoNotValidate())
            .ForSourceMember(d => d.CaseNo, opt => opt.DoNotValidate());

        // IncidentAttachment -> IncidentAttachmentDto
        CreateMap<IncidentAttachment, IncidentAttachmentDto>()
            .ForMember(d => d.Kind, o => o.MapFrom(s => s.Kind.ToString()))
            .ForMember(d => d.CreatedUtc, o => o.MapFrom(s => s.CreatedUtc))
            .ForMember(d => d.UpdatedUtc, o => o.MapFrom(s => s.UpdatedUtc))
            .ForMember(d => d.RowVersion, o => o.MapFrom(s => s.RowVersion))
            // map creator/updater names if DTO exposes them
            .ForMember(d => d.CreatedUserName, o => o.MapFrom(s => s.CreatedUser != null ? $"{(s.CreatedUser.FirstName ?? "").Trim()} {(s.CreatedUser.LastName ?? "").Trim()}".Trim() : null))
            .ForMember(d => d.UpdatedUserName, o => o.MapFrom(s => s.UpdatedUser != null ? $"{(s.UpdatedUser.FirstName ?? "").Trim()} {(s.UpdatedUser.LastName ?? "").Trim()}".Trim() : null))
            .ForSourceMember(s => s.PhysicalPath, o => o.DoNotValidate());

        // IncidentAttachmentDto -> IncidentAttachment
        CreateMap<IncidentAttachmentDto, IncidentAttachment>()
            .ForMember(e => e.Kind, o => o.MapFrom(d => Enum.Parse<AttachmentType>(d.Kind ?? "File")))
            .ForMember(e => e.PhysicalPath, o => o.Ignore())
            .ForMember(e => e.Incident, o => o.Ignore())
            .ForMember(e => e.CreatedUser, o => o.Ignore())
            .ForMember(e => e.UpdatedUser, o => o.Ignore());

        // ResponsiblePerson <-> ResponsiblePersonDto
        CreateMap<ResponsiblePerson, ResponsiblePersonDto>().ReverseMap();

        // User <-> UserDto
        CreateMap<User, UserDto>()
            .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.FirstName))
            .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.LastName))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
            .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber))
            .ForMember(dest => dest.LineID, opt => opt.MapFrom(src => src.LineID))
            .ForMember(dest => dest.OrganizationInfo, opt => opt.MapFrom(src => src.OrganizationInfo))
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role))
            .ForMember(dest => dest.IsBlocked, opt => opt.MapFrom(src => src.IsBlocked))
            .ForMember(dest => dest.ReceiveNotifications, opt => opt.MapFrom(src => src.ReceiveNotifications));

        CreateMap<UserDto, User>()
            .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.FirstName))
            .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.LastName))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
            .ForMember(dest => dest.LineID, opt => opt.MapFrom(src => src.LineID))
            .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber))
            .ForMember(dest => dest.OrganizationInfo, opt => opt.MapFrom(src => src.OrganizationInfo))
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role))
            .ForMember(dest => dest.IsBlocked, opt => opt.MapFrom(src => src.IsBlocked))
            .ForMember(dest => dest.ReceiveNotifications, opt => opt.MapFrom(src => src.ReceiveNotifications))
            // ignore fields on User that are not in DTO
            .ForMember(dest => dest.LoginCount, o => o.Ignore())
            .ForMember(dest => dest.LastLoginDate, o => o.Ignore())
            .ForMember(dest => dest.Logs, o => o.Ignore())
            .ForMember(dest => dest.PasswordHash, o => o.Ignore())
            .ForMember(dest => dest.Position, o => o.Ignore())
            .ForMember(dest => dest.Department, o => o.Ignore());
    }

    private static int ParseSeverityNumber(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return 0;
        if (int.TryParse(value, out var direct)) return direct;
        var m = Regex.Match(value ?? string.Empty, @"\d+");
        if (m.Success && int.TryParse(m.Value, out var num)) return num;
        return 0;
    }
}