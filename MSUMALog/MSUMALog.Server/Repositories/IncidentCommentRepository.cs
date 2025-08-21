using Microsoft.EntityFrameworkCore;
using MSUMALog.Server.Data;
using MSUMALog.Server.Models;

namespace MSUMALog.Server.Repositories;

public class IncidentCommentRepository : IIncidentCommentRepository
{
    private readonly ApplicationDbContext _db;

    public IncidentCommentRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public Task<List<IncidentComment>> GetByIncidentIdAsync(int incidentId, CancellationToken ct = default) =>
        _db.IncidentComments
            .AsNoTracking()
            .Include(c => c.AuthorUser)
            .Where(c => c.IncidentReportId == incidentId)
            .OrderByDescending(c => c.CreatedUtc)
            .ToListAsync(ct);

    public Task<List<IncidentComment>> GetByCaseNoAsync(string caseNo, CancellationToken ct = default) =>
        _db.IncidentComments
            .AsNoTracking()
            .Include(c => c.AuthorUser)
            .Where(c => c.IncidentReport!.CaseNo == caseNo)
            .OrderByDescending(c => c.CreatedUtc)
            .ToListAsync(ct);

    public Task<IncidentComment?> GetAsync(int id, CancellationToken ct = default) =>
        _db.IncidentComments.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<IncidentComment> AddAsync(IncidentComment entity, CancellationToken ct = default)
    {
        _db.IncidentComments.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public Task<IncidentComment?> GetByIdAsync(int id, CancellationToken ct = default) =>
        _db.IncidentComments.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var found = await _db.IncidentComments.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (found == null) return false;
        _db.IncidentComments.Remove(found);
        await _db.SaveChangesAsync(ct);
        return true;
    }
}