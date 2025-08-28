using MSUMALog.Server.DTOs;

namespace MSUMALog.Server.Services;

public interface IIncidentReportService
{
    Task<IncidentReportDto> CreateAsync(IncidentReportCreateDto dto, CancellationToken ct = default);
    Task<IEnumerable<IncidentReportDto>> GetAllAsync(CancellationToken ct = default, int? userId = null);
    Task<IncidentReportDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IncidentReportDto?> GetByCaseNoAsync(string caseNo, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, IncidentReportUpdateDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);

    Task<IncidentReportDto?> UpdatePartialAsync(int id, IncidentReportPatchDto dto, int userId, CancellationToken ct = default);

    Task<PagedResultDto<IncidentReportDto>> SearchAsync(
        int page, int limit,
        IDictionary<string, string> filters,
        string? order,
        IEnumerable<string> selectFields,
        int? userId = null,
        CancellationToken ct = default
    );
}