using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MSUMALog.Server.Models;

public class IncidentComment
{
    public int Id { get; set; }

    [Required]
    public int IncidentReportId { get; set; }

    public IncidentReport? IncidentReport { get; set; }

    public int? AuthorUserId { get; set; }
    [ForeignKey(nameof(AuthorUserId))]
    public User? AuthorUser { get; set; }

    // เก็บเป็น Markdown / อนุญาต raw <img> (sanitize ฝั่ง client หรือเพิ่มขั้นตอนภายหลัง)
    [Required, MaxLength(8000)]
    public string Body { get; set; } = string.Empty;

    public int? CreatedUserId { get; set; }
    [ForeignKey(nameof(CreatedUserId))]
    public User? CreatedUser { get; set; }

    public int? UpdatedUserId { get; set; }
    [ForeignKey(nameof(UpdatedUserId))]
    public User? UpdatedUser { get; set; }

    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedUtc { get; set; }
}