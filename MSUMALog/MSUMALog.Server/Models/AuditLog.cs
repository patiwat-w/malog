using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace MSUMALog.Server.Models;

public enum AuditEntityType
{
    IncidentReport,
    IncidentComment
}

public enum AuditActionType
{
    Create,
    Update,
    Delete
}

public class AuditLog
{
    public int Id { get; set; }

    [Column(TypeName = "nvarchar(50)")]
    public required AuditEntityType EntityType { get; set; } // ใช้ string เพื่อรองรับ entity ทุกประเภท

    public required int EntityId { get; set; } // PK ของ entity หลักที่เปลี่ยนแปลง

    public required int ReferenceId { get; set; } // อ้างอิง entity อื่น เช่น IncidentId ของ Comment

    [Column(TypeName = "nvarchar(100)")]
    public required string ReferenceEntityName { get; set; } // ชื่อ entity หลัก เช่น

    [MaxLength(100)]
    public string? FieldName { get; set; } // ชื่อ field ที่เปลี่ยนแปลง

    [MaxLength(500)]
    public string? OldValue { get; set; }

    [MaxLength(500)]
    public string? NewValue { get; set; }

    public DateTime ChangedUtc { get; set; }
    public int ChangedByUserId { get; set; }

    public Guid BatchId { get; set; }

    [Column(TypeName = "nvarchar(50)")]
    public required AuditActionType ActionType { get; set; } // ใช้ string เพื่อรองรับ action ทุกประเภท
}
