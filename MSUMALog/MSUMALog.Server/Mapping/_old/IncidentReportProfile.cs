using AutoMapper;
using System.Text.RegularExpressions;
using MSUMALog.Server.Models;
using MSUMALog.Server.DTOs;

namespace MSUMALog.Server.Mapping;

public class IncidentReportProfile : Profile
{
    public IncidentReportProfile()
    {
        CreateMap<IncidentReport, IncidentReportDto>()
            .ForMember(d => d.Severity,
                opt => opt.MapFrom(s => ParseSeverityNumber(s.Severity)))
            ;

        // Reverse map (adjust if dto.Severity is int and entity expects string)
        CreateMap<IncidentReportDto, IncidentReport>()
            .ForMember(d => d.Severity,
                opt => opt.MapFrom(s => s.Severity.ToString())); // or format "สูงที่สุด (5)" if needed
    }

    private static int ParseSeverityNumber(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return 0;
        if (int.TryParse(value, out var direct)) return direct;
        var m = Regex.Match(value, @"\d+");
        if (m.Success && int.TryParse(m.Value, out var num)) return num;
        return 0;
    }
}
