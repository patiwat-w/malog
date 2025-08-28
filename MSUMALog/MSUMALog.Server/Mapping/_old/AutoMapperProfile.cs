using AutoMapper;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Models;

namespace MSUMALog.Server.Mapping;

public class AutoMapperProfile : Profile
{
    public AutoMapperProfile()
    {
        // ...existing mappings...

        // IncidentComment -> IncidentCommentDto
        CreateMap<IncidentComment, IncidentCommentDto>()
            .ForMember(d => d.CaseNo, opt => opt.MapFrom(s => s.IncidentReport != null ? s.IncidentReport.CaseNo : null))
            .ForMember(d => d.AuthorUserId, opt => opt.MapFrom(s => s.AuthorUserId))
            .ForMember(d => d.AuthorUserName, opt => opt.MapFrom(
                s => s.AuthorUser != null
                    ? $"{(s.AuthorUser.FirstName ?? "").Trim()} {(s.AuthorUser.LastName ?? "").Trim()}".Trim()
                    : null
            ))
            .ForMember(d => d.CreatedUserName, o => o.MapFrom(s => s.CreatedUser != null ? ((s.CreatedUser.FirstName ?? "").Trim() + " " + (s.CreatedUser.LastName ?? "").Trim()).Trim() : null))
           
            .ForMember(d => d.UpdatedUserName, o => o.MapFrom(s => s.UpdatedUser != null ? ((s.UpdatedUser.FirstName ?? "").Trim() + " " + (s.UpdatedUser.LastName ?? "").Trim()).Trim() : null))
            // server-managed fields should be mapped/read-only
            
            .ForMember(d => d.CreatedUserId, opt => opt.MapFrom(s => s.CreatedUserId))
            .ForMember(d => d.UpdatedUserId, opt => opt.MapFrom(s => s.UpdatedUserId))
            .ForMember(d => d.CreatedUtc, opt => opt.MapFrom(s => s.CreatedUtc))
            .ForMember(d => d.UpdatedUtc, opt => opt.MapFrom(s => s.UpdatedUtc));

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
            // ignore navigation properties on mapping from DTO -> entity
            .ForSourceMember(d => d.AuthorUserName, opt => opt.DoNotValidate())
            .ForSourceMember(d => d.CreatedUserName, opt => opt.DoNotValidate())
            .ForSourceMember(d => d.UpdatedUserName, opt => opt.DoNotValidate())
            .ForSourceMember(d => d.CaseNo, opt => opt.DoNotValidate());

        // IncidentAttachment -> IncidentAttachmentDto
        CreateMap<IncidentAttachment, MSUMALog.Server.DTOs.IncidentAttachmentDto>()
            .ForMember(d => d.Kind, o => o.MapFrom(s => s.Kind.ToString()))
            .ForMember(d => d.CreatedUtc, o => o.MapFrom(s => s.CreatedUtc))
            .ForMember(d => d.UpdatedUtc, o => o.MapFrom(s => s.UpdatedUtc))
            .ForMember(d => d.RowVersion, o => o.MapFrom(s => s.RowVersion))
            // Do not map PhysicalPath to DTO
            .ForSourceMember(s => s.PhysicalPath, o => o.DoNotValidate());

        // IncidentAttachmentDto -> IncidentAttachment
        CreateMap<MSUMALog.Server.DTOs.IncidentAttachmentDto, IncidentAttachment>()
            .ForMember(e => e.Kind, o => o.MapFrom(d => Enum.Parse<AttachmentType>(d.Kind ?? "File")))
            .ForMember(e => e.PhysicalPath, o => o.Ignore()) // never accept physical path from client
            // ignore navigation properties to avoid attaching detached instances
            .ForMember(e => e.Incident, o => o.Ignore())
            .ForMember(e => e.CreatedUser, o => o.Ignore())
            .ForMember(e => e.UpdatedUser, o => o.Ignore());
    }
}
