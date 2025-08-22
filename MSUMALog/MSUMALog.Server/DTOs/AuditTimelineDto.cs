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

        public required AuditEntityType EntityType { get; set; } 
        public int EntityId { get; set; } // PK ของ entity หลักที่เปลี่ยนแปลง
        public DateTime ChangedUtc { get; set; }
        public string ChangedByUser { get; set; } = "";
        public string ChangedByUserId { get; set; } = "";


        public AuditActionType ActionType { get; set; }
        public List<AuditFieldChangeDto> Changes { get; set; } = [];
    }
}