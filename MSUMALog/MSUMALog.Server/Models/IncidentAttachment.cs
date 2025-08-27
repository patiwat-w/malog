using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace MSUMALog.Server.Models;

// enum string
public enum AttachmentType
{
    File,
    Image,
    Audio,
    Video,
}

public class IncidentAttachment
{
    public int Id { get; set; }

    [Required]
    [Column(TypeName = "int")]
    public int IncidentId { get; set; }

    // navigation
    public IncidentReport? Incident { get; set; }

    // Storage for uploaded files
    [MaxLength(512)]
    [Column(TypeName = "nvarchar(512)")]
    public string? StorageKey { get; set; } // relative path or blob key

    // relative path under the application's upload root (e.g. "incident/2025/08/abc.jpg")
    [MaxLength(512)]
    [Column(TypeName = "nvarchar(512)")]
    public string? RelativePath { get; set; }

    // absolute physical path on the server (store only if required; consider security/privacy)
    [MaxLength(1024)]
    [Column(TypeName = "nvarchar(1024)")]
    public string? PhysicalPath { get; set; } // e.g. "C:\\wwwroot\\uploads\\incident\\2025\\08\\abc.jpg"

    [MaxLength(260)]
    [Column(TypeName = "nvarchar(260)")]
    public string? FileName { get; set; }

    [MaxLength(100)]
    [Column(TypeName = "nvarchar(100)")]
    public string? ContentType { get; set; }

    [Column(TypeName = "bigint")]
    public long? SizeBytes { get; set; }

    // External link
    [Column(TypeName = "bit")]
    public bool IsExternal { get; set; }

    [MaxLength(2048)]
    [Column(TypeName = "nvarchar(2048)")]
    public string? ExternalUrl { get; set; }

    // Derived kind for UI hints (store as string via DbContext configuration)
    [Column(TypeName = "nvarchar(50)")]
    public AttachmentType Kind { get; set; } = AttachmentType.File;

    [MaxLength(1000)]
    [Column(TypeName = "nvarchar(1000)")]
    public string? Description { get; set; }

    [Column(TypeName = "int")]
    public int? CreatedUserId { get; set; }
    [ForeignKey(nameof(CreatedUserId))]
    public User? CreatedUser { get; set; }

    [Column(TypeName = "int")]
    public int? UpdatedUserId { get; set; }
    [ForeignKey(nameof(UpdatedUserId))]
    public User? UpdatedUser { get; set; }

    [Column(TypeName = "datetime2")]
    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

    [Column(TypeName = "datetime2")]
    public DateTime? UpdatedUtc { get; set; }

    // Concurrency token
    [Timestamp]
    [Column(TypeName = "rowversion")]
    public byte[]? RowVersion { get; set; }

    // Helper properties (not mapped)
    [NotMapped]
    public bool IsImage => Kind == AttachmentType.Image || (ContentType?.StartsWith("image/") ?? false);

    [NotMapped]
    public bool IsVideo => Kind == AttachmentType.Video || (ContentType?.StartsWith("video/") ?? false);

    // Basic validation helper (do not replace server-side validation)
    public IEnumerable<ValidationResult> Validate(ValidationContext ctx)
    {
        if (SizeBytes < 0) yield return new ValidationResult("SizeBytes must be non-negative", new[] { nameof(SizeBytes) });

        if (IsExternal && string.IsNullOrWhiteSpace(ExternalUrl))
            yield return new ValidationResult("ExternalUrl required for external attachments", new[] { nameof(ExternalUrl) });

        // require storage key OR relative path when not external
        if (!IsExternal && string.IsNullOrWhiteSpace(StorageKey) && string.IsNullOrWhiteSpace(RelativePath))
            yield return new ValidationResult("StorageKey or RelativePath required for stored attachments", new[] { nameof(StorageKey), nameof(RelativePath) });
    }
}