using System;
using System.Text.RegularExpressions;
using AutoMapper;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Models;

namespace MSUMALog.Server.Mappings;

public class IncidentReportMapperProfile : Profile
{
    public IncidentReportMapperProfile()
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