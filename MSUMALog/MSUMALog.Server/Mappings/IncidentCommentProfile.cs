using AutoMapper;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Models;

namespace MSUMALog.Server.Mappings;

public class IncidentCommentProfile : Profile
{
    public IncidentCommentProfile()
    {
        CreateMap<IncidentComment, IncidentCommentDto>()
            .ForMember(d => d.CaseNo, o => o.MapFrom(s => s.IncidentReport!.CaseNo));
        CreateMap<IncidentCommentDto, IncidentComment>()
            .ForMember(d => d.IncidentReport, o => o.Ignore());
    }
}