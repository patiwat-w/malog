using MSUMALog.Server.DTOs;

namespace MSUMALog.Server.Services;

public interface IIncidentReportService
{
    Task<IncidentReportDto> CreateAsync(IncidentReportDto dto, CancellationToken ct = default);
    Task<IEnumerable<IncidentReportDto>> GetAllAsync(CancellationToken ct = default);
    Task<IncidentReportDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IncidentReportDto?> GetByCaseNoAsync(string caseNo, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, IncidentReportDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}