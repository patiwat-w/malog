using MSUMALog.Server.Models;

namespace MSUMALog.Server.Repositories;

public interface IIncidentAttachmentRepository
{
    Task<IncidentAttachment?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<List<IncidentAttachment>> GetByIncidentIdAsync(int incidentId, CancellationToken ct = default);
    Task AddAsync(IncidentAttachment entity, CancellationToken ct = default);
    Task UpdateAsync(IncidentAttachment entity, CancellationToken ct = default);
    Task DeleteAsync(IncidentAttachment entity, CancellationToken ct = default);
}