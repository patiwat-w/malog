using System.Globalization;
using AutoMapper;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Models;

namespace MSUMALog.Server.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
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
            .ForMember(d => d.CreatedUserName, o => o.MapFrom(s => s.CreatedUser != null ? ((s.CreatedUser.FirstName ?? "").Trim() + " " + (s.CreatedUser.LastName ?? "").Trim()).Trim() : null))
            .ForMember(d => d.CreatedUserRole, o => o.MapFrom(s => s.CreatedUser != null ? s.CreatedUser.Role : null))
            .ForMember(d => d.UpdatedUserName, o => o.MapFrom(s => s.UpdatedUser != null ? ((s.UpdatedUser.FirstName ?? "").Trim() + " " + (s.UpdatedUser.LastName ?? "").Trim()).Trim() : null))
            .ForMember(d => d.UpdatedUserRole, o => o.MapFrom(s => s.UpdatedUser != null ? s.UpdatedUser.Role : null))
            .ForMember(d => d.CreatedUtc, o => o.MapFrom(s => s.CreatedUtc))
            .ForMember(d => d.UpdatedUtc, o => o.MapFrom(s => s.UpdatedUtc));

        CreateMap<IncidentReportDto, IncidentReport>()
            .ForMember(d => d.CaseNo, o => o.Ignore()) // CaseNo is server-generated; ignore client value
            .ForMember(d => d.IncidentDate, o => o.MapFrom(s => s.IncidentDate ?? DateTime.UtcNow))
            .ForMember(d => d.SubDomain, o => o.MapFrom(s => s.SubDomain))
            .ForMember(d => d.PartNumber, o => o.MapFrom(s => s.PartNumber))
            .ForMember(d => d.AdditionalInfo, o => o.MapFrom(s => s.AdditionalInfo))
            .ForMember(d => d.InterimAction, o => o.MapFrom(s => s.InterimAction))
            .ForMember(d => d.IntermediateAction, o => o.MapFrom(s => s.IntermediateAction))
            .ForMember(d => d.LongTermAction, o => o.MapFrom(s => s.LongTermAction))
            // Do not allow client dto to set audit fields (server will set)
            .ForMember(d => d.CreatedUserId, o => o.Ignore())
            .ForMember(d => d.UpdatedUserId, o => o.Ignore())
            .ForMember(d => d.CreatedUtc, o => o.Ignore())
            .ForMember(d => d.UpdatedUtc, o => o.Ignore())
            .ForMember(d => d.ResponsibleName, o => o.MapFrom(s => s.ResponsibleName))
            .ForMember(d => d.ResponsibleLineId, o => o.MapFrom(s => s.ResponsibleLineId))
            .ForMember(d => d.ResponsibleEmail, o => o.MapFrom(s => s.ResponsibleEmail))
            .ForMember(d => d.ResponsiblePhone, o => o.MapFrom(s => s.ResponsiblePhone));

        CreateMap<ResponsiblePerson, ResponsiblePersonDto>().ReverseMap();
    }

    private static DateTime? ParseDate(string dateString)
    {
        if (DateTime.TryParse(dateString, out var parsedDate))
        {
            return parsedDate;
        }
        return null; // Handle invalid date format gracefully  
    }
}
