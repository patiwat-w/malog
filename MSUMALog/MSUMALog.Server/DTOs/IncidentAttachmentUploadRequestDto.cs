using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace MSUMALog.Server.DTOs;

public class IncidentAttachmentUploadRequestDto
{
    [Required]
    public IFormFile File { get; set; } = default!;

    [Required]
    public int IncidentId { get; set; }

    [StringLength(1000)]
    public string? Description { get; set; }

    [StringLength(100)]
    public string? Kind { get; set; }
}
