using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace MSUMALog.Server.DTOs;

public class IncidentAttachmentDto
{
    public int Id { get; set; }

    [Required]
    public int IncidentId { get; set; }

    // storage identifiers (expose StorageKey/RelativePath but NOT PhysicalPath)
    [StringLength(512)]
    public string? StorageKey { get; set; }

    [StringLength(512)]
    public string? RelativePath { get; set; }

    [StringLength(260)]
    public string? FileName { get; set; }

    [StringLength(100)]
    public string? ContentType { get; set; }

    public long? SizeBytes { get; set; }

    public bool IsExternal { get; set; }

    [StringLength(2048)]
    public string? ExternalUrl { get; set; }

    public string Kind { get; set; } = "File";

    [StringLength(1000)]
    public string? Description { get; set; }

    // server-managed
    [BindNever]
    public int? CreatedUserId { get; internal set; }

    [BindNever]
    public string? CreatedUserName { get; internal set; }

    [BindNever]
    public int? UpdatedUserId { get; internal set; }

    [BindNever]
    public string? UpdatedUserName { get; internal set; }

    [BindNever]
    public DateTime? CreatedUtc { get; internal set; }

    [BindNever]
    public DateTime? UpdatedUtc { get; internal set; }

    [BindNever]
    public byte[]? RowVersion { get; internal set; }
}