using AutoMapper;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Models;

namespace MSUMALog.Server.Mappings;

public class ConsolidatedAutoMapperProfile : Profile
{
    public ConsolidatedAutoMapperProfile()
    {
        // Keep only consolidated mappings that weren't moved to their own profiles.
        // IncidentReport, IncidentComment, IncidentAttachment, User mappings
        // have been moved to dedicated profiles.
        CreateMap<ResponsiblePerson, ResponsiblePersonDto>().ReverseMap();

        // Add any other small/shared mappings here if needed.
    }
}