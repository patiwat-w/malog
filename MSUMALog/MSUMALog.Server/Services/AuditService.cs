using MSUMALog.Server.Data;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

using System.Diagnostics;
using System.Text.Json;
using System.Diagnostics;
namespace MSUMALog.Server.Services;

public interface IAuditService
{
    Task LogChangeAsync(string entityType, int entityId, string field, string? oldValue, string? newValue, int userId, CancellationToken ct = default);
    Task LogEntityChangesAsync(
        AuditEntityType entityType,
        int entityId,
        object? oldEntity,
        object? newEntity,
        IEnumerable<string> fields,
        int userId,
        AuditActionType actionType,
        CancellationToken ct = default,
        Guid? batchId = null,
        int referenceId = 0,
        string referenceEntityName = ""
    );
    Task<PagedResultDto<AuditTimelineDto>> GetIncidentTimelinePagedAsync(
        int incidentId, int page, int limit, CancellationToken ct = default);
    Task<List<AuditFieldChangeDto>> GetAuditBatchDetailAsync(Guid batchId, CancellationToken ct = default);
    Task<PagedResultDto<AuditTimelineDto>> GetTimelinePagedByReferenceAsync(
        string referenceEntityName, int referenceId, int page, int limit, CancellationToken ct = default);
}

public class AuditService(ApplicationDbContext db) : IAuditService
{
    public async Task LogChangeAsync(string entityType, int entityId, string field, string? oldValue, string? newValue, int userId, CancellationToken ct = default)
    {
        var log = new AuditLog
        {
            EntityType = Enum.Parse<AuditEntityType>(entityType),
            EntityId = entityId,
            FieldName = field,
            OldValue = oldValue,
            NewValue = newValue,
            ChangedUtc = DateTime.UtcNow,
            ChangedByUserId = userId,
            ActionType = AuditActionType.Update, // default เป็น Update
            ReferenceId = entityId, // Assuming ReferenceId is the same as EntityId
            ReferenceEntityName = entityType // Assuming ReferenceEntityName is the string representation of entityType
        };
        db.AuditLogs.Add(log);
        await db.SaveChangesAsync(ct);
    }

    public async Task LogEntityChangesAsync(
        AuditEntityType entityType,
        int entityId,
        object? oldEntity,
        object? newEntity,
        IEnumerable<string> fields,
        int userId,
        AuditActionType actionType, // เพิ่ม parameter นี้
        CancellationToken ct = default,
        Guid? batchId = null,
        int referenceId = 0, // เพิ่ม parameter นี้
        string referenceEntityName = "" // เพิ่ม parameter นี้
    )
    {
        foreach (var field in fields)
        {
            var oldValue = oldEntity?.GetType().GetProperty(field)?.GetValue(oldEntity)?.ToString();
            var newValue = newEntity?.GetType().GetProperty(field)?.GetValue(newEntity)?.ToString();

            // กรณี Create: oldValue == null, กรณี Delete: newValue == null, กรณี Update: oldValue != newValue
            if (actionType == AuditActionType.Create && newValue != null ||
                actionType == AuditActionType.Delete && oldValue != null ||
                actionType == AuditActionType.Update && oldValue != newValue) //&& newValue != null
            {
                var log = new AuditLog
                {
                    EntityType = entityType,
                    EntityId = entityId,
                    FieldName = field,
                    OldValue = oldValue,
                    NewValue = newValue,
                    ChangedUtc = DateTime.UtcNow,
                    ChangedByUserId = userId,
                    BatchId = batchId ?? Guid.NewGuid(),
                    ActionType = actionType,
                    ReferenceId = referenceId, // Assuming ReferenceId is the same as EntityId
                    ReferenceEntityName = referenceEntityName // Assuming ReferenceEntityName is the string representation of entityType
                };
                db.AuditLogs.Add(log);
            }
        }
        await db.SaveChangesAsync(ct);

    }







    public async Task<List<AuditFieldChangeDto>> GetAuditBatchDetailAsync(Guid batchId, CancellationToken ct = default)
    {
        var importantFields = new[] { "Title", "Status", "ResponsibleName" };

        var logs = await db.AuditLogs
            .Where(x => x.BatchId == batchId)
            .OrderBy(x => x.FieldName)
            .ToListAsync(ct);

        return logs.Select(log => new AuditFieldChangeDto
        {
            FieldName = log.FieldName ?? "",
            OldValue = log.OldValue,
            NewValue = log.NewValue,
            IsImportant = importantFields.Contains(log.FieldName ?? "")
        }).ToList();
    }


















   public async Task<PagedResultDto<AuditTimelineDto>> GetTimelinePagedByReferenceAsync(
    string referenceEntityName, int referenceId, int page, int limit, CancellationToken ct = default)
{
    // ---------------- CONFIG / UTIL ----------------
    var importantFields = new HashSet<string>(new[] { "Title", "Status", "ResponsibleName" });
    const int MaxPreviewLen = 100; // ให้ตรงกับโค้ดเดิมของเมธอดนี้

    static string? Truncate(string? s, int max)
        => (s != null && s.Length > max) ? "Value is too long to display." : s;

    // ---------------- STEP 1: ฐานข้อมูล log ของ reference นี้ทั้งหมด ----------------
    // รวมทุก EntityType ที่ผูกอยู่กับ reference ที่ระบุ
    var baseFilter = db.AuditLogs.AsNoTracking()
        .Where(x => x.ReferenceEntityName == referenceEntityName && x.ReferenceId == referenceId);

    // ---------------- STEP 2: นับจำนวน batch ทั้งหมด (สำหรับ totalCount) ----------------
    var totalBatches = await baseFilter
        .GroupBy(x => x.BatchId)
        .Select(g => g.Key)
        .CountAsync(ct);

    if (totalBatches == 0)
    {
        return new PagedResultDto<AuditTimelineDto>
        {
            TotalCount = 0,
            Page = page,
            PageSize = limit,
            Items = Array.Empty<AuditTimelineDto>()
        };
    }

    // ---------------- STEP 3: เลือก Batch ของ "หน้านี้" (เพจจิ้งระดับ BatchId) ----------------
    // เรียงตาม Max(ChangedUtc) ของแต่ละแบตช์ → เอาหน้า page/limit มา
    var pageBatchRows = await baseFilter
        .GroupBy(x => x.BatchId)
        .Select(g => new { BatchId = g.Key, MaxChangedUtc = g.Max(x => x.ChangedUtc) })
        .OrderByDescending(x => x.MaxChangedUtc)
        .Skip((page - 1) * limit)
        .Take(limit)
        .ToListAsync(ct);

    var pageBatchIds = pageBatchRows.Select(b => b.BatchId).ToList();
    var maxUtcByBatch = pageBatchRows.ToDictionary(x => x.BatchId, x => x.MaxChangedUtc);

    // ---------------- STEP 4: โหลดทุก log ของแบตช์ในหน้านี้ ----------------
    var pageLogs = await db.AuditLogs.AsNoTracking()
        .Where(x => pageBatchIds.Contains(x.BatchId))
        .ToListAsync(ct);

    // กลุ่ม log ตาม BatchId
    var groups = pageLogs.GroupBy(l => l.BatchId).ToList();

    // ---------------- STEP 5: หา “เรคอร์ดแรกของแบตช์” (ChangedUtc เก่าสุด; กัน tie ด้วย Id) ----------------
    var firstPerBatch = groups.ToDictionary(
        g => g.Key,
        g => g.OrderBy(l => l.ChangedUtc).ThenBy(l => l.Id).First()
    );

    // ---------------- STEP 6: รวบ EntityId ตามชนิดจาก “เรคอร์ดแรก” เพื่อตรวจมีอยู่จริงใน DB ----------------
    var irIds = firstPerBatch.Values
        .Where(l => l.EntityType == AuditEntityType.IncidentReport)
        .Select(l => l.EntityId)
        .Distinct()
        .ToList();

    var icIds = firstPerBatch.Values
        .Where(l => l.EntityType == AuditEntityType.IncidentComment)
        .Select(l => l.EntityId)
        .Distinct()
        .ToList();

    var iaIds = firstPerBatch.Values
        .Where(l => l.EntityType == AuditEntityType.IncidentAttachment)
        .Select(l => l.EntityId)
        .Distinct()
        .ToList();

    // คิวรีสถานะปัจจุบัน “แบบรวบทีเดียว” (ลด N+1)
    var existsIR = irIds.Count == 0
        ? new HashSet<int>()
        : (await db.IncidentReports.AsNoTracking()
            .Where(i => irIds.Contains(i.Id))
            .Select(i => i.Id)
            .ToListAsync(ct)).ToHashSet();

    var existsIC = icIds.Count == 0
        ? new HashSet<int>()
        : (await db.IncidentComments.AsNoTracking()
            .Where(i => icIds.Contains(i.Id))
            .Select(i => i.Id)
            .ToListAsync(ct)).ToHashSet();

    var existsIA = iaIds.Count == 0
        ? new HashSet<int>()
        : (await db.IncidentAttachments.AsNoTracking()
            .Where(i => iaIds.Contains(i.Id))
            .Select(i => i.Id)
            .ToListAsync(ct)).ToHashSet();

    bool ExistsNow(AuditEntityType et, int id)
        => (et == AuditEntityType.IncidentReport && existsIR.Contains(id))
        || (et == AuditEntityType.IncidentComment && existsIC.Contains(id))
        || (et == AuditEntityType.IncidentAttachment && existsIA.Contains(id));

    // ---------------- STEP 7: เตรียมชื่อผู้ใช้เฉพาะที่จำเป็น (จากเรคอร์ดแรกของแต่ละแบตช์) ----------------
    var userIds = firstPerBatch.Values.Select(v => v.ChangedByUserId).Distinct().ToList();
    var userDict = await db.Users.AsNoTracking()
        .Where(u => userIds.Contains(u.Id))
        .Select(u => new
        {
            u.Id,
            Name = (((u.FirstName ?? "") + " " + (u.LastName ?? "")).Trim().Length > 0)
                ? ((u.FirstName ?? "") + " " + (u.LastName ?? "")).Trim()
                : (u.Email ?? u.Id.ToString())
        })
        .ToDictionaryAsync(x => x.Id, x => x.Name, ct);

    // ---------------- STEP 8: ประกอบ DTO ต่อแบตช์ ----------------
    var items = groups
        .Select(g =>
        {
            var first = firstPerBatch[g.Key];

            return new AuditTimelineDto
            {
                BatchId = g.Key,
                ChangedUtc = maxUtcByBatch[g.Key], // เวลา Max ของแบตช์ (metadata ของกลุ่ม)
                ChangedByUser = userDict.GetValueOrDefault(first.ChangedByUserId, ""),
                ChangedByUserId = first.ChangedByUserId.ToString(),
                ActionType = first.ActionType,     // ใช้แถวแรกของแบตช์เป็น metadata (เหมือนแนว SQL)
                EntityType = first.EntityType,
                EntityId = first.EntityId,
                EntityExists = ExistsNow(first.EntityType, first.EntityId),
                Changes = g.Select(log => new AuditFieldChangeDto
                {
                    FieldName = log.FieldName ?? "",
                    OldValue = Truncate(log.OldValue, MaxPreviewLen),
                    NewValue = Truncate(log.NewValue, MaxPreviewLen),
                    IsImportant = importantFields.Contains(log.FieldName ?? "")
                }).ToList()
            };
        })
        .OrderByDescending(x => x.ChangedUtc) // เรียงผลตาม MaxChangedUtc
        .ToList();

    // ---------------- STEP 9: ส่งผลแบบเพจจิ้ง ----------------
    return new PagedResultDto<AuditTimelineDto>
    {
        TotalCount = totalBatches,   // ใช้จำนวน batch ทั้งหมด (ไม่ใช่จำนวนของหน้า)
        Page = page,
        PageSize = limit,
        Items = items
    };
}





    public async Task<PagedResultDto<AuditTimelineDto>> GetIncidentTimelinePagedAsync(
        int incidentId, int page, int limit, CancellationToken ct = default)
    {
        const string ReferenceEntityName = "IncidentReport";
        const int MaxPreviewLen = 500;

        static string? Truncate(string? s, int max)
            => (s != null && s.Length > max) ? "Value is too long to display." : s;

        var importantFields = new HashSet<string>(new[] { "Title", "Status", "ResponsibleName" });

        // --- DEBUG SETUP ---
        var jsonOpt = new JsonSerializerOptions { WriteIndented = true };
        string dumpDir = AppContext.BaseDirectory; // ที่อยู่ไฟล์ผลลัพธ์
        void Dump(string name, object obj)
        {
            var path = Path.Combine(dumpDir, name);
            File.WriteAllText(path, JsonSerializer.Serialize(obj, jsonOpt));
            Debug.WriteLine($"[AUDIT DEBUG] wrote: {path}");
        }

        // STEP 1) base
        var baseFilter = db.AuditLogs.AsNoTracking()
            .Where(x => x.ReferenceEntityName == ReferenceEntityName && x.ReferenceId == incidentId);

        // STEP 2) total
        var totalBatches = await baseFilter
            .GroupBy(x => x.BatchId)
            .Select(g => g.Key)
            .CountAsync(ct);

        if (totalBatches == 0)
        {
            Dump($"audit_probe_{incidentId}_{page}_empty.json", new
            {
                incidentId,
                page,
                limit,
                totalBatches
            });

            return new PagedResultDto<AuditTimelineDto>
            {
                TotalCount = 0,
                Page = page,
                PageSize = limit,
                Items = Array.Empty<AuditTimelineDto>()
            };
        }

        // STEP 3) page batches
        var pageBatchRows = await baseFilter
            .GroupBy(x => x.BatchId)
            .Select(g => new { BatchId = g.Key, MaxChangedUtc = g.Max(x => x.ChangedUtc) })
            .OrderByDescending(x => x.MaxChangedUtc)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(ct);

        Dump($"audit_batches_{incidentId}_{page}.json",
            pageBatchRows.Select(b => new { b.BatchId, changedUtc = b.MaxChangedUtc.ToString("O") }));

        var pageBatchIds = pageBatchRows.Select(b => b.BatchId).ToList();
        var maxUtcByBatch = pageBatchRows.ToDictionary(x => x.BatchId, x => x.MaxChangedUtc);

        // Fix for the CS1061 error: Replace the incorrect usage of `ToListAsync` on an in-memory IEnumerable
        // with `ToList`, as `ToListAsync` is only available for IQueryable (e.g., database queries).

        var firstRows = (
            from p in pageBatchRows   // This is an in-memory list of Batch rows already fetched
            from first in db.AuditLogs.AsNoTracking()
                           .Where(l => l.BatchId == p.BatchId)
                           .OrderBy(l => l.ChangedUtc).ThenBy(l => l.Id)
                           .Take(1)
            select new
            {
                p.BatchId,
                p.MaxChangedUtc,
                first.EntityType,
                first.EntityId,
                first.ActionType,
                first.ChangedByUserId,
                ExistsIR = (first.EntityType == AuditEntityType.IncidentReport)
                           && db.IncidentReports.AsNoTracking().Any(r => r.Id == first.EntityId),
                ExistsIC = (first.EntityType == AuditEntityType.IncidentComment)
                           && db.IncidentComments.AsNoTracking().Any(c => c.Id == first.EntityId),
            }
        ).ToList(); // Use ToList() instead of ToListAsync() since this is an in-memory operation.

        Dump($"audit_firstrows_{incidentId}_{page}.json",
            firstRows.Select(x => new {
                x.BatchId,
                changedUtc = x.MaxChangedUtc.ToString("O"),
                entityType = (int)x.EntityType,
                x.EntityId,
                actionType = (int)x.ActionType,
                x.ChangedByUserId,
                entityExists_DB = x.ExistsIR || x.ExistsIC
            }));

        var existsByBatch = firstRows.ToDictionary(x => x.BatchId, x => x.ExistsIR || x.ExistsIC);
        var firstMetaByBatch = firstRows.ToDictionary(
            x => x.BatchId,
            x => new { x.EntityType, x.EntityId, x.ActionType, x.ChangedByUserId }
        );

        // STEP 5) logs ของแบตช์ในหน้านี้
        var pageLogs = await db.AuditLogs.AsNoTracking()
            .Where(x => pageBatchIds.Contains(x.BatchId))
            .Select(x => new
            {
                x.Id,
                x.BatchId,
                x.EntityType,
                x.EntityId,
                x.FieldName,
                x.OldValue,
                x.NewValue,
                x.ChangedUtc,
                x.ChangedByUserId,
                x.ActionType
            })
            .ToListAsync(ct);

        Dump($"audit_pagelogs_{incidentId}_{page}.json",
            pageLogs.GroupBy(g => g.BatchId).Select(g => new { g.Key, Count = g.Count() }));

        var groups = pageLogs.GroupBy(l => l.BatchId).ToList();

        // STEP 6) users
        var userIds = firstRows.Select(v => v.ChangedByUserId).Distinct().ToList();
        var userDict = await db.Users.AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new
            {
                u.Id,
                Name = (((u.FirstName ?? "") + " " + (u.LastName ?? "")).Trim().Length > 0)
                    ? ((u.FirstName ?? "") + " " + (u.LastName ?? "")).Trim()
                    : u.Email
            })
            .ToDictionaryAsync(x => x.Id, x => x.Name ?? x.Id.ToString(), ct);

        // STEP 7) DTO
        var items = groups
            .Select(g =>
            {
                var meta = firstMetaByBatch[g.Key];

                return new AuditTimelineDto
                {
                    BatchId = g.Key,
                    ChangedUtc = maxUtcByBatch[g.Key],
                    ChangedByUser = userDict.GetValueOrDefault(meta.ChangedByUserId, meta.ChangedByUserId.ToString()),
                    ChangedByUserId = meta.ChangedByUserId.ToString(),
                    ActionType = meta.ActionType,
                    EntityType = meta.EntityType,
                    EntityId = meta.EntityId,
                    EntityExists = existsByBatch[g.Key],
                    Changes = g.OrderBy(x => x.FieldName)
                               .Select(l => new AuditFieldChangeDto
                               {
                                   FieldName = l.FieldName ?? "",
                                   OldValue = Truncate(l.OldValue, MaxPreviewLen),
                                   NewValue = Truncate(l.NewValue, MaxPreviewLen),
                                   IsImportant = importantFields.Contains(l.FieldName ?? "")
                               }).ToList()
                };
            })
            .OrderByDescending(x => x.ChangedUtc)
            .ToList();

        // STEP 8) dump probe สุดท้าย (เหมือน shape JSON ที่คุณเทียบ)
        var probe = new
        {
            totalCount = totalBatches,
            page,
            pageSize = limit,
            items = items.Select(i => new
            {
                batchId = i.BatchId,
                entityType = (int)i.EntityType,
                entityId = i.EntityId,
                changedUtc = i.ChangedUtc.ToString("O"),
                changedByUser = i.ChangedByUser,
                changedByUserId = i.ChangedByUserId,
                actionType = (int)i.ActionType,
                changes = i.Changes.Select(c => new
                {
                    fieldName = c.FieldName,
                    oldValue = c.OldValue,
                    newValue = c.NewValue,
                    isImportant = c.IsImportant
                }),
                entityExists = i.EntityExists
            })
        };
        Dump($"audit_probe_{incidentId}_{page}.json", probe);

        return new PagedResultDto<AuditTimelineDto>
        {
            TotalCount = totalBatches,
            Page = page,
            PageSize = limit,
            Items = items
        };
    }







}