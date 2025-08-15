using MSUMALog.Server.DTOs;

namespace MSUMALog.Server.Services;

public interface IIncidentCommentService
{
    Task<List<IncidentCommentDto>> GetByCaseNoAsync(string caseNo, CancellationToken ct = default);
    Task<List<IncidentCommentDto>> GetByIncidentIdAsync(int incidentId, CancellationToken ct = default);
    Task<IncidentCommentDto> CreateAsync(IncidentCommentDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}