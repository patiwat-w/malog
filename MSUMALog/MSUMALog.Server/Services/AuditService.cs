using MSUMALog.Server.Data;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Models;
using Microsoft.EntityFrameworkCore;

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
                actionType == AuditActionType.Update && oldValue != newValue ) //&& newValue != null
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

    public async Task<PagedResultDto<AuditTimelineDto>> GetIncidentTimelinePagedAsync(
        int incidentId, int page, int limit, CancellationToken ct = default)
    {
        var importantFields = new[] { "Title", "Status", "ResponsibleName" };

        var logs = await db.AuditLogs
            .Where(x => x.EntityType == AuditEntityType.IncidentReport && x.EntityId == incidentId)
            .OrderByDescending(x => x.ChangedUtc)
            .ToListAsync(ct);

        var userDict = db.Users.ToDictionary(u => u.Id, u => u.Email ?? u.Id.ToString());

        var grouped = logs
            .GroupBy(x => x.BatchId)
            .Select(g => new AuditTimelineDto
            {
                BatchId = g.Key,
                ChangedUtc = g.Max(x => x.ChangedUtc),
                ChangedByUser = userDict.GetValueOrDefault(g.First().ChangedByUserId, ""),
                ActionType = g.First().ActionType,
                Changes = g.Select(log => new AuditFieldChangeDto
                {
                    FieldName = log.FieldName ?? "",
                    OldValue = log.OldValue,
                    NewValue = log.NewValue,
                    IsImportant = importantFields.Contains(log.FieldName ?? "")
                }).ToList()
            })
            .OrderByDescending(x => x.ChangedUtc)
            .ToList();

        var total = grouped.Count;
        var items = grouped.Skip((page - 1) * limit).Take(limit).ToList();

        return new PagedResultDto<AuditTimelineDto>
        {
            TotalCount = total,
            Page = page,
            PageSize = limit,
            Items = items
        };
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
        var importantFields = new[] { "Title", "Status", "ResponsibleName" };

        var logs = await db.AuditLogs
            .Where(x => x.ReferenceEntityName == referenceEntityName && x.ReferenceId == referenceId)
            .OrderByDescending(x => x.ChangedUtc)
            .ToListAsync(ct);

        var userDict = db.Users.ToDictionary(u => u.Id, u => u.Email ?? u.Id.ToString());

        var grouped = logs
            .GroupBy(x => x.BatchId)
            .Select(g => new AuditTimelineDto
            {
                BatchId = g.Key,
                ChangedUtc = g.Max(x => x.ChangedUtc),
                ChangedByUser = userDict.GetValueOrDefault(g.First().ChangedByUserId, ""),
                ActionType = g.First().ActionType,
                Changes = g.Select(log => new AuditFieldChangeDto
                {
                    FieldName = log.FieldName ?? "",
                    OldValue = log.OldValue,
                    NewValue = log.NewValue,
                    IsImportant = importantFields.Contains(log.FieldName ?? "")
                }).ToList()
            })
            .OrderByDescending(x => x.ChangedUtc)
            .ToList();

        var total = grouped.Count;
        var items = grouped.Skip((page - 1) * limit).Take(limit).ToList();

        return new PagedResultDto<AuditTimelineDto>
        {
            TotalCount = total,
            Page = page,
            PageSize = limit,
            Items = items
        };
    }
}