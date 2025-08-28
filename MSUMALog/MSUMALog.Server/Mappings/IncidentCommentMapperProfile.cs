using System;
using AutoMapper;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Models;

namespace MSUMALog.Server.Mappings;

public class IncidentCommentMapperProfile : Profile
{
    public IncidentCommentMapperProfile()
    {
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
    }
}