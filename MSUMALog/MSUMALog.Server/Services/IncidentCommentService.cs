using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using MSUMALog.Server.Data;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Models;
using MSUMALog.Server.Repositories;
using MSUMALog.Server.Services;

namespace MSUMALog.Server.Services;

public class IncidentCommentService(
    ApplicationDbContext db,
    IIncidentCommentRepository repo,
    IIncidentReportRepository reportRepo,
    IMapper mapper,
    IAuditService auditService
) : IIncidentCommentService
{
    private readonly ApplicationDbContext _db = db;
    private readonly IIncidentCommentRepository _repo = repo;
    private readonly IIncidentReportRepository _reportRepo = reportRepo;
    private readonly IMapper _mapper = mapper;
    private readonly IAuditService _auditService = auditService;

    public async Task<List<IncidentCommentDto>> GetByCaseNoAsync(string caseNo, CancellationToken ct)
    {
        // Project ผ่าน LINQ เพื่อลด entity load
        return await _db.IncidentComments
            .Where(c => c.IncidentReport!.CaseNo == caseNo)
            .Include(c => c.IncidentReport)
            .Include(c => c.AuthorUser)
            .Include(c => c.CreatedUser)
            .Include(c => c.UpdatedUser)
            .OrderByDescending(c => c.CreatedUtc)
            .ProjectTo<IncidentCommentDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);
    }

    public async Task<List<IncidentCommentDto>> GetByIncidentIdAsync(int incidentId, CancellationToken ct)
    {
        return await _db.IncidentComments
            .Where(c => c.IncidentReportId == incidentId)
            .Include(c => c.IncidentReport)
            .Include(c => c.AuthorUser)
            .Include(c => c.CreatedUser)
            .Include(c => c.UpdatedUser)
            .OrderByDescending(c => c.CreatedUtc)
            .ProjectTo<IncidentCommentDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);
    }

    public async Task<IncidentCommentDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.IncidentComments
            .Include(c => c.IncidentReport)
            .Include(c => c.AuthorUser)
            .Include(c => c.CreatedUser)
            .Include(c => c.UpdatedUser)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        return entity is null ? null : _mapper.Map<IncidentCommentDto>(entity);
    }

    public async Task<IncidentCommentDto> CreateAsync(IncidentCommentDto dto, CancellationToken ct)
    {
        // ตรวจสอบ incident
        var report = await _reportRepo.GetByIdAsync(dto.IncidentReportId, ct);
        if (report == null) throw new InvalidOperationException("Incident not found");

        var entity = _mapper.Map<IncidentComment>(dto);

        // apply server-managed / user fields from DTO (controller sets them)
        if (dto.AuthorUserId.HasValue) entity.AuthorUserId = dto.AuthorUserId;
        if (dto.CreatedUserId.HasValue) entity.CreatedUserId = dto.CreatedUserId;
        if (dto.UpdatedUserId.HasValue) entity.UpdatedUserId = dto.UpdatedUserId;
        entity.CreatedUtc = dto.CreatedUtc ?? DateTime.UtcNow;
        entity.UpdatedUtc = dto.UpdatedUtc;

        await _repo.AddAsync(entity, ct);

        // Audit: บันทึกการสร้าง comment
        await _auditService.LogEntityChangesAsync(
            AuditEntityType.IncidentComment,
            entity.Id,
            null,
            entity,
            new[] { "Body" },
            entity.CreatedUserId ?? entity.AuthorUserId ?? 0,
            AuditActionType.Create,
            ct,
            Guid.NewGuid(),
            entity.IncidentReportId,
            nameof(AuditEntityType.IncidentReport) // Set the required ReferenceEntityName;
          );

        // reload with navigation so mapping can populate CaseNo and user names
        var reloaded = await _db.IncidentComments
            .Include(c => c.IncidentReport)
            .Include(c => c.AuthorUser)
            .Include(c => c.CreatedUser)
            .Include(c => c.UpdatedUser)
            .FirstAsync(c => c.Id == entity.Id, ct);

        return _mapper.Map<IncidentCommentDto>(reloaded);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct)
    {
        var existing = await _repo.GetByIdAsync(id, ct);
        if (existing is null) return false;

        var referenceId = existing.IncidentReportId;

        // Audit: บันทึกสถานะการลบ ไม่ต้องเก็บรายละเอียด field
        var userId = existing.CreatedUserId ?? existing.AuthorUserId ?? 0;
        var log = new AuditLog
        {
            EntityType = AuditEntityType.IncidentComment,
            EntityId = id,
            FieldName = null,
            OldValue = null,
            NewValue = "Deleted",
            ChangedUtc = DateTime.UtcNow,
            ChangedByUserId = userId,
            BatchId = Guid.NewGuid(),
            ActionType = AuditActionType.Delete,
            ReferenceId = referenceId, // Set the required ReferenceId
            ReferenceEntityName = nameof(AuditEntityType.IncidentReport) // Set the required ReferenceEntityName
        };
        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync(ct);

        await _repo.DeleteAsync(id, ct); // ไม่ต้องใช้ var
        return true;
    }
}