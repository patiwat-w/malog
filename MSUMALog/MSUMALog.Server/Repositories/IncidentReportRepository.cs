using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MSUMALog.Server.Data;
using MSUMALog.Server.Models;

namespace MSUMALog.Server.Repositories;

public class IncidentReportRepository(ApplicationDbContext context) : IIncidentReportRepository
{
    private readonly ApplicationDbContext _context = context;

    public async Task<IncidentReport> AddAsync(IncidentReport entity, CancellationToken ct = default)
    {
        await _context.IncidentReports.AddAsync(entity, ct);
        await _context.SaveChangesAsync(ct);
        return entity;
    }

    public async Task<IEnumerable<IncidentReport>> GetAllAsync(CancellationToken ct = default)
    {
        return await _context.IncidentReports
            .AsNoTracking()
            .OrderByDescending(i => i.CreatedUtc)
            .ToListAsync(ct);
    }

    public async Task<IncidentReport?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _context.IncidentReports.AsNoTracking().FirstOrDefaultAsync(i => i.Id == id, ct);
    }

    public async Task<IncidentReport?> GetByCaseNoAsync(string caseNo, CancellationToken ct = default)
    {
        return await _context.IncidentReports.AsNoTracking()
            .FirstOrDefaultAsync(i => i.CaseNo == caseNo, ct);
    }

    public async Task UpdateAsync(IncidentReport entity, CancellationToken ct = default)
    {
        _context.IncidentReports.Update(entity);
        await _context.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(IncidentReport entity, CancellationToken ct = default)
    {
        _context.IncidentReports.Remove(entity);
        await _context.SaveChangesAsync(ct);
    }
}