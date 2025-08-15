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
            .ForMember(d => d.Case_no, o => o.MapFrom(s => s.CaseNo))
            .ForMember(d => d.Incident_date, o => o.MapFrom(s => s.IncidentDate.HasValue ? s.IncidentDate.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) : null))
            .ForMember(d => d.Sub_domain, o => o.MapFrom(s => s.SubDomain))
            .ForMember(d => d.Part_number, o => o.MapFrom(s => s.PartNumber))
            .ForMember(d => d.Additional_info, o => o.MapFrom(s => s.AdditionalInfo))
            .ForMember(d => d.Interim_action, o => o.MapFrom(s => s.InterimAction))
            .ForMember(d => d.Intermediate_action, o => o.MapFrom(s => s.IntermediateAction))
            .ForMember(d => d.Long_term_action, o => o.MapFrom(s => s.LongTermAction))
            .ForMember(d => d.Created_by, o => o.MapFrom(s => s.CreatedBy))
            .ForMember(d => d.Responsible_name, o => o.MapFrom(s => s.ResponsibleName))
            .ForMember(d => d.Responsible_lineid, o => o.MapFrom(s => s.ResponsibleLineId))
            .ForMember(d => d.Responsible_email, o => o.MapFrom(s => s.ResponsibleEmail))
            .ForMember(d => d.Responsible_phone, o => o.MapFrom(s => s.ResponsiblePhone));

        CreateMap<IncidentReportDto, IncidentReport>()
            .ForMember(d => d.CaseNo, o => o.MapFrom(s => s.Case_no))
            .ForMember(d => d.IncidentDate, o => o.MapFrom(s =>
                string.IsNullOrWhiteSpace(s.Incident_date)
                    ? DateTime.UtcNow // ใช้เวลาปัจจุบันหากค่าว่าง
                    : ParseDate(s.Incident_date) ?? DateTime.UtcNow)) // ใช้เวลาปัจจุบันหากรูปแบบไม่ถูกต้อง
            .ForMember(d => d.SubDomain, o => o.MapFrom(s => s.Sub_domain))
            .ForMember(d => d.PartNumber, o => o.MapFrom(s => s.Part_number))
            .ForMember(d => d.AdditionalInfo, o => o.MapFrom(s => s.Additional_info))
            .ForMember(d => d.InterimAction, o => o.MapFrom(s => s.Interim_action))
            .ForMember(d => d.IntermediateAction, o => o.MapFrom(s => s.Intermediate_action))
            .ForMember(d => d.LongTermAction, o => o.MapFrom(s => s.Long_term_action))
            .ForMember(d => d.CreatedBy, o => o.MapFrom(s => s.Created_by))
            .ForMember(d => d.ResponsibleName, o => o.MapFrom(s => s.Responsible_name))
            .ForMember(d => d.ResponsibleLineId, o => o.MapFrom(s => s.Responsible_lineid))
            .ForMember(d => d.ResponsibleEmail, o => o.MapFrom(s => s.Responsible_email))
            .ForMember(d => d.ResponsiblePhone, o => o.MapFrom(s => s.Responsible_phone));

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
