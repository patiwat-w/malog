using System.ComponentModel.DataAnnotations;

namespace MSUMALog.Server.Models;

public class IncidentComment
{
    public int Id { get; set; }

    [Required]
    public int IncidentReportId { get; set; }

    public IncidentReport? IncidentReport { get; set; }

    [Required, MaxLength(200)]
    public string Author { get; set; } = string.Empty;

    // เก็บเป็น Markdown / อนุญาต raw <img> (sanitize ฝั่ง client หรือเพิ่มขั้นตอนภายหลัง)
    [Required, MaxLength(8000)]
    public string Body { get; set; } = string.Empty;

    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
}