using AutoMapper;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Models;

namespace MSUMALog.Server.Mappings;

public class IncidentCommentProfile : Profile
{
    public IncidentCommentProfile()
    {
        CreateMap<IncidentComment, IncidentCommentDto>()
            .ForMember(d => d.CaseNo, o => o.MapFrom(s => s.IncidentReport != null ? s.IncidentReport.CaseNo : null))
            .ForMember(d => d.AuthorUserId, o => o.MapFrom(s => s.AuthorUserId))
            .ForMember(d => d.AuthorUserName, o => o.MapFrom(
                s => s.AuthorUser != null
                    ? ((s.AuthorUser.FirstName ?? "").Trim() + " " + (s.AuthorUser.LastName ?? "").Trim()).Trim()
                    : null
            ))
            .ForMember(d => d.CreatedUserName, o => o.MapFrom(s => s.CreatedUser != null ? ((s.CreatedUser.FirstName ?? "").Trim() + " " + (s.CreatedUser.LastName ?? "").Trim()).Trim() : null))
            .ForMember(d => d.UpdatedUserName, o => o.MapFrom(s => s.UpdatedUser != null ? ((s.UpdatedUser.FirstName ?? "").Trim() + " " + (s.UpdatedUser.LastName ?? "").Trim()).Trim() : null))
            .ForMember(d => d.CreatedUserId, o => o.MapFrom(s => s.CreatedUserId))
            .ForMember(d => d.UpdatedUserId, o => o.MapFrom(s => s.UpdatedUserId))
            .ForMember(d => d.CreatedUtc, o => o.MapFrom(s => s.CreatedUtc))
            .ForMember(d => d.UpdatedUtc, o => o.MapFrom(s => s.UpdatedUtc));

        CreateMap<IncidentCommentDto, IncidentComment>()
            .ForMember(d => d.IncidentReport, o => o.Ignore());
    }
}