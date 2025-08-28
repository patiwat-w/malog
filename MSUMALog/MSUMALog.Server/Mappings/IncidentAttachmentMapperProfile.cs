using System;
using AutoMapper;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Models;

namespace MSUMALog.Server.Mappings;

public class IncidentAttachmentMapperProfile : Profile
{
    public IncidentAttachmentMapperProfile()
    {
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
    }
}