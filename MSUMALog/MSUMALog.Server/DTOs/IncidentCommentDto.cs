using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace MSUMALog.Server.DTOs;

public class IncidentCommentDto
{
    public int Id { get; set; }
    public int IncidentReportId { get; set; }
    public string? CaseNo { get; set; }          // อ่านจาก navigation (optional)

    // Author: store user id (server-managed) and provide read-only name for UI
    [BindNever]
    public int? AuthorUserId { get; internal set; }

    [BindNever]
    public string? AuthorUserName { get; internal set; }

    [Required, MaxLength(8000)]
    public string Body { get; set; } = string.Empty;

    // server-managed audit fields: do not accept from UI
    [BindNever]
    public int? CreatedUserId { get; internal set; }

    [BindNever]
    public int? UpdatedUserId { get; internal set; }

    [BindNever]
    public string? CreatedUserName { get; internal set; }

    [BindNever]
    public string? UpdatedUserName { get; internal set; }

    [BindNever]
    public DateTime? CreatedUtc { get; internal set; }

    [BindNever]
    public DateTime? UpdatedUtc { get; internal set; }
}