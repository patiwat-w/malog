using AutoMapper;
using AutoMapper.QueryableExtensions;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Models;
using MSUMALog.Server.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Threading;

namespace MSUMALog.Server.Services;

public class IncidentReportService(IIncidentReportRepository repo, IMapper mapper) : IIncidentReportService
{
    private readonly IIncidentReportRepository _repo = repo;
    private readonly IMapper _mapper = mapper;

    public async Task<IncidentReportDto> CreateAsync(IncidentReportDto dto, CancellationToken ct = default)
    {
        var entity = _mapper.Map<IncidentReport>(dto);
        // If CaseNo empty, generate
        if (string.IsNullOrWhiteSpace(entity.CaseNo))
        {
            var now = DateTime.UtcNow;
            entity.CaseNo = $"{now:yyyy-MM}-{Random.Shared.Next(1000, 9999)}";
        }
        await _repo.AddAsync(entity, ct);
        return _mapper.Map<IncidentReportDto>(entity);
    }

    public async Task<IEnumerable<IncidentReportDto>> GetAllAsync(CancellationToken ct = default)
    {
        var list = await _repo.GetAllAsync(ct);
        return list.Select(_mapper.Map<IncidentReportDto>);
    }

    public async Task<IncidentReportDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var entity = await _repo.GetByIdAsync(id, ct);
        return entity is null ? null : _mapper.Map<IncidentReportDto>(entity);
    }

    public async Task<IncidentReportDto?> GetByCaseNoAsync(string caseNo, CancellationToken ct = default)
    {
        var entity = await _repo.GetByCaseNoAsync(caseNo, ct);
        return entity is null ? null : _mapper.Map<IncidentReportDto>(entity);
    }

    public async Task<bool> UpdateAsync(int id, IncidentReportDto dto, CancellationToken ct = default)
    {
        var existing = await _repo.GetByIdAsync(id, ct);
        if (existing is null) return false;

        // Map incoming dto to existing (keep Id)
        var updated = _mapper.Map(dto, existing);
        updated.Id = id;
        updated.UpdatedUtc = DateTime.UtcNow;
        await _repo.UpdateAsync(updated, ct);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var existing = await _repo.GetByIdAsync(id, ct);
        if (existing is null) return false;
        await _repo.DeleteAsync(existing, ct);
        return true;
    }
}