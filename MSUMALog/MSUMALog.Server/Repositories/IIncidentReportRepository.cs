using MSUMALog.Server.Models;

namespace MSUMALog.Server.Repositories;

public interface IIncidentReportRepository
{
    Task<IncidentReport> AddAsync(IncidentReport entity, CancellationToken ct = default);
    Task<IEnumerable<IncidentReport>> GetAllAsync(CancellationToken ct = default);
    Task<IncidentReport?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IncidentReport?> GetByCaseNoAsync(string caseNo, CancellationToken ct = default);
    Task UpdateAsync(IncidentReport entity, CancellationToken ct = default);
    Task DeleteAsync(IncidentReport entity, CancellationToken ct = default);
}