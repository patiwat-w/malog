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
using Microsoft.Extensions.Options;
// Add the necessary NuGet package reference to your project for System.Linq.Dynamic.Core.
// You can do this by running the following command in the Package Manager Console:
// Install-Package System.Linq.Dynamic.Core

using System.Linq.Dynamic.Core; // Ensure this namespace is included after installing the package.


namespace MSUMALog.Server.Services;

public class IncidentReportService(IIncidentReportRepository repo, IMapper mapper, ApplicationDbContext db, IHttpContextAccessor httpAccessor, IAuditService auditService, IOptions<AuditConfig> auditOptions) : IIncidentReportService
{
    private readonly IIncidentReportRepository _repo = repo;
    private readonly IMapper _mapper = mapper;
    private readonly ApplicationDbContext _db = db;
    private readonly IHttpContextAccessor _httpAccessor = httpAccessor;
    private readonly IAuditService _auditService = auditService;
    private readonly AuditConfig _auditConfig = auditOptions.Value;

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

        entity.CreatedUtc = DateTime.UtcNow;
        var user = _httpAccessor.HttpContext?.User;
        var uid = user is not null ? UserClaimsHelper.GetUserId(user) : null;
        entity.CreatedUserId = uid;

        await _repo.AddAsync(entity, ct);

        // Audit สำหรับการสร้าง IncidentReport
        await _auditService.LogEntityChangesAsync(
            AuditEntityType.IncidentReport,
            entity.Id,
            null,
            entity,
            _auditConfig.IncidentReportFields,
            uid ?? 0,
            AuditActionType.Create, // ระบุ ActionType
            ct,
            Guid.NewGuid(),
            entity.Id,
            nameof(IncidentReport));

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
        using var transaction = await _db.Database.BeginTransactionAsync(ct);

        try
        {
            var batchId = Guid.NewGuid();
            var incidentReport = await _repo.GetByIdAsync(id, ct);
            if (incidentReport is null) return false;

            var user = _httpAccessor.HttpContext?.User;
            var userId = user is not null ? UserClaimsHelper.GetUserId(user) : null;
            var beforeUpdate = incidentReport.Clone(); // Clone ก่อน map

            // Apply updates
            _mapper.Map(dto, incidentReport);
            incidentReport.UpdatedUtc = DateTime.UtcNow;
            incidentReport.UpdatedUserId = userId;

            // Log audit
            await _auditService.LogEntityChangesAsync(
                AuditEntityType.IncidentReport,
                id,
                beforeUpdate,
                incidentReport,
                _auditConfig.IncidentReportFields,
                userId ?? 0,
                AuditActionType.Update,
                ct,
                batchId,
                id,
                nameof(IncidentReport)
            );

            await _repo.UpdateAsync(incidentReport, ct);
            await transaction.CommitAsync(ct);
            return true;
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<IncidentReportDto?> UpdatePartialAsync(int id, IncidentReportPatchDto dto, int userId, CancellationToken ct = default)
    {
        using var transaction = await _db.Database.BeginTransactionAsync(ct);

        try
        {
            var batchId = Guid.NewGuid();
            var entity = await _repo.GetByIdAsync(id, ct);
            if (entity == null) return null;

            var beforeUpdate = entity.Clone();

            // อัปเดตเฉพาะ field ที่ไม่เป็น null
            if (dto.Status != null)
                entity.Status = dto.Status;
            if (dto.Title != null)
                entity.Title = dto.Title;
            // ... เพิ่ม field อื่น ๆ ตามต้องการ ...

            entity.UpdatedUserId = userId;
            entity.UpdatedUtc = DateTime.UtcNow;

            // Log audit เฉพาะ fieldที่เปลี่ยน
            await _auditService.LogEntityChangesAsync(
                AuditEntityType.IncidentReport,
                id,
                beforeUpdate,
                entity,
                _auditConfig.IncidentReportFields,
                userId,
                AuditActionType.Update,
                ct,
                batchId,
                id,
                nameof(IncidentReport)
            );

            await _repo.UpdateAsync(entity, ct);
            await transaction.CommitAsync(ct);

            return _mapper.Map<IncidentReportDto>(entity);
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var existing = await _repo.GetByIdAsync(id, ct);
        if (existing is null) return false;

        var user = _httpAccessor.HttpContext?.User;
        var uid = user is not null ? UserClaimsHelper.GetUserId(user) : null;

        // Audit: บันทึกสถานะการลบ ไม่ต้องเก็บรายละเอียด field
        var log = new AuditLog
        {
            EntityType = AuditEntityType.IncidentReport,
            EntityId = id,
            FieldName = null,
            OldValue = null,
            NewValue = "Deleted",
            ChangedUtc = DateTime.UtcNow,
            ChangedByUserId = uid ?? 0,
            BatchId = Guid.NewGuid(),
            ActionType = AuditActionType.Delete,
            ReferenceId = id, // Set the required ReferenceId
            ReferenceEntityName = nameof(IncidentReport) // Set the required ReferenceEntityName
        };
        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync(ct);

        await _repo.DeleteAsync(existing, ct);
        return true;
    }

    public async Task<PagedResultDto<IncidentReportDto>> SearchAsync(
    int page, int limit,
    IDictionary<string, string> filters,
    string? order,
    IEnumerable<string> selectFields,
    int? userId = null,
    CancellationToken ct = default)
    {
        var query = _db.IncidentReports.AsQueryable();



        foreach (var kv in filters)
        {
            var field = kv.Key;
            var value = kv.Value;
            var prop = typeof(IncidentReport).GetProperty(field);
            if (prop == null) continue;

            if (value.Contains('*'))
            {
                var likeValue = value.Replace("*", "");
                query = query.Where(x =>
                    EF.Functions.Like(EF.Property<string>(x, field), $"%{likeValue}%"));
            }
            else
            {
                query = query.Where(x =>
                    EF.Property<string>(x, field) == value);
            }
        }

        if (!string.IsNullOrWhiteSpace(order))
            query = query.OrderBy(order);
        else
            query = query.OrderByDescending(x => x.CreatedUtc);

        var total = await query.CountAsync(ct);

        var items = await query
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(ct);

        // Map เป็น IncidentReportDto
        var result = items.Select(_mapper.Map<IncidentReportDto>).ToList();

        return new PagedResultDto<IncidentReportDto>
        {
            TotalCount = total,
            Page = page,
            PageSize = limit,
            Items = result
        };
    }
}