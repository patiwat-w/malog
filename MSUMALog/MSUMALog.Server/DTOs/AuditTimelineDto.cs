using System;
using MSUMALog.Server.Models;
namespace MSUMALog.Server.DTOs
{
    public class AuditFieldChangeDto
    {
        public string FieldName { get; set; } = "";
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public bool IsImportant { get; set; }
    }

    public class AuditTimelineDto
    {
        public Guid BatchId { get; set; }
        public DateTime ChangedUtc { get; set; }
        public string ChangedByUser { get; set; } = "";
        public AuditActionType ActionType { get; set; }
        public List<AuditFieldChangeDto> Changes { get; set; } = [];
    }
}