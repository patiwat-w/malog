using MSUMALog.Server.Models;

namespace MSUMALog.Server.Repositories;

public interface IIncidentCommentRepository
{
    Task<List<IncidentComment>> GetByIncidentIdAsync(int incidentId, CancellationToken ct = default);
    Task<List<IncidentComment>> GetByCaseNoAsync(string caseNo, CancellationToken ct = default);
    Task<IncidentComment?> GetAsync(int id, CancellationToken ct = default);
    Task<IncidentComment> AddAsync(IncidentComment entity, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);

    Task<IncidentComment?> GetByIdAsync(int id, CancellationToken ct = default);
}