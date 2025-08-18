using AutoMapper;
using AutoMapper.QueryableExtensions;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Models;
using MSUMALog.Server.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Threading;
using Microsoft.EntityFrameworkCore;
using MSUMALog.Server.Data;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using MSUMALog.Server.Helpers;

namespace MSUMALog.Server.Services;

public class IncidentReportService(IIncidentReportRepository repo, IMapper mapper, ApplicationDbContext db, IHttpContextAccessor httpAccessor) : IIncidentReportService
{
    private readonly IIncidentReportRepository _repo = repo;
    private readonly IMapper _mapper = mapper;
    private readonly ApplicationDbContext _db = db;
    private readonly IHttpContextAccessor _httpAccessor = httpAccessor;

    private async Task<string> GenerateCaseNoAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var ym = now.ToString("yyyy-MM");
        var prefix = ym + "-";

        var last = await _db.IncidentReports
            .Where(r => r.CaseNo != null && r.CaseNo.StartsWith(prefix))
            .OrderByDescending(r => r.CaseNo)
            .Select(r => r.CaseNo!)
            .FirstOrDefaultAsync(ct);

        int next = 1;
        if (last is not null)
        {
            var parts = last.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[2], out var seq))
                next = seq + 1;
        }
        return $"{ym}-{next:0000}";
    }

    public async Task<IncidentReportDto> CreateAsync(IncidentReportDto dto, CancellationToken ct = default)
    {
        var entity = _mapper.Map<IncidentReport>(dto);

        if (string.IsNullOrWhiteSpace(entity.CaseNo))
            entity.CaseNo = await GenerateCaseNoAsync(ct);

        // record creator and created time (from logged-in user)  
        entity.CreatedUtc = DateTime.UtcNow;
        var user = _httpAccessor.HttpContext?.User;
        var uid = user is not null ? UserClaimsHelper.GetUserId(user) : null;
        entity.CreatedUserId = uid;

        await _repo.AddAsync(entity, ct);
        return _mapper.Map<IncidentReportDto>(entity);
    }

    public async Task<IEnumerable<IncidentReportDto>> GetAllAsync(CancellationToken ct = default, int? userId = null)
    {
        if (userId.HasValue)
        {
            var list = await _repo.GetAllAsync(ct);
            return list
                .Where(r => r.CreatedUserId == userId)
                .Select(_mapper.Map<IncidentReportDto>);
        }

        // ถ้าไม่มี userId ให้ดึงทั้งหมด
        var allList = await _repo.GetAllAsync(ct);
        return allList.Select(_mapper.Map<IncidentReportDto>);
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
        // record updater and updated time (from logged-in user)
        updated.UpdatedUtc = DateTime.UtcNow;
        var user = _httpAccessor.HttpContext?.User;
        var uid = user is not null ? UserClaimsHelper.GetUserId(user) : null;
        updated.UpdatedUserId = uid;

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