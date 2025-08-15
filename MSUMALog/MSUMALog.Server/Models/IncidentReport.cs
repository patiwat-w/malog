using System.ComponentModel.DataAnnotations;

namespace MSUMALog.Server.Models;

public class IncidentReport
{
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(50)]
    public string CaseNo { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Asset { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Center { get; set; } = string.Empty;

    public DateTime IncidentDate { get; set; } = DateTime.UtcNow;

    [MaxLength(1000)]
    public string? Symptoms { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Severity { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Impact { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Domain { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? SubDomain { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Vendor { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Manufacturer { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? PartNumber { get; set; } = string.Empty;

    [MaxLength(4000)]
    public string? AdditionalInfo { get; set; } = string.Empty;

    [MaxLength(4000)]
    public string? InterimAction { get; set; } = string.Empty;

    [MaxLength(4000)]
    public string? IntermediateAction { get; set; } = string.Empty;

    [MaxLength(4000)]
    public string? LongTermAction { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Status { get; set; } = string.Empty;

    [MaxLength(100)]
    public string CreatedBy { get; set; } = string.Empty;

    // Responsible person
    [MaxLength(150)]
    public string? ResponsibleName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? ResponsibleLineId { get; set; } = string.Empty;

    [MaxLength(254)] // typical max email length
    public string? ResponsibleEmail { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? ResponsiblePhone { get; set; } = string.Empty;

    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedUtc { get; set; }
}