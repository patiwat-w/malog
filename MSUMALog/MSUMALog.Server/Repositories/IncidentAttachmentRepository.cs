using Microsoft.EntityFrameworkCore;
using MSUMALog.Server.Data;
using MSUMALog.Server.Models;

namespace MSUMALog.Server.Repositories;

public class IncidentAttachmentRepository : IIncidentAttachmentRepository
{
    private readonly ApplicationDbContext _db;
    public IncidentAttachmentRepository(ApplicationDbContext db) => _db = db;

    public Task<IncidentAttachment?> GetByIdAsync(int id, CancellationToken ct = default) =>
        _db.IncidentAttachments
           .AsNoTracking()
           .FirstOrDefaultAsync(a => a.Id == id, ct);

    public Task<List<IncidentAttachment>> GetByIncidentIdAsync(int incidentId, CancellationToken ct = default) =>
        _db.IncidentAttachments
           .AsNoTracking()
           .Where(a => a.IncidentId == incidentId)
           .ToListAsync(ct);

    public async Task AddAsync(IncidentAttachment entity, CancellationToken ct = default)
    {
        _db.IncidentAttachments.Add(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(IncidentAttachment entity, CancellationToken ct = default)
    {
        _db.IncidentAttachments.Update(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(IncidentAttachment entity, CancellationToken ct = default)
    {
        _db.IncidentAttachments.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }
}