using System.ComponentModel.DataAnnotations;

namespace MSUMALog.Server.DTOs;

public class IncidentCommentDto
{
    public int Id { get; set; }
    public int IncidentReportId { get; set; }
    public string? CaseNo { get; set; }          // อ่านจาก navigation (optional)
    [Required, MaxLength(200)]
    public string Author { get; set; } = string.Empty;
    [Required, MaxLength(8000)]
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedUtc { get; set; }
}