using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

    public DateTime? IncidentDate { get; set; } = DateTime.UtcNow;

    [Column(TypeName = "nvarchar(max)")]
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

    [Column(TypeName = "nvarchar(max)")]
    public string? AdditionalInfo { get; set; } = string.Empty;

  [Column(TypeName = "nvarchar(max)")]
    public string? InterimAction { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string? IntermediateAction { get; set; } = string.Empty;

   [Column(TypeName = "nvarchar(max)")]
    public string? LongTermAction { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Status { get; set; } = string.Empty;

    // Id of the user who created the report
    public int? CreatedUserId { get; set; }
    [ForeignKey(nameof(CreatedUserId))]
    public User? CreatedUser { get; set; }

    // Id of the user who last updated the report
    public int? UpdatedUserId { get; set; }
    [ForeignKey(nameof(UpdatedUserId))]
    public User? UpdatedUser { get; set; }

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

    public IncidentReport Clone()
    {
        return new IncidentReport
        {
            Id = this.Id,
            Title = this.Title,
            CaseNo = this.CaseNo,
            Asset = this.Asset,
            Center = this.Center,
            IncidentDate = this.IncidentDate,
            Symptoms = this.Symptoms,
            Severity = this.Severity,
            Impact = this.Impact,
            Domain = this.Domain,
            SubDomain = this.SubDomain,
            Vendor = this.Vendor,
            Manufacturer = this.Manufacturer,
            PartNumber = this.PartNumber,
            AdditionalInfo = this.AdditionalInfo,
            InterimAction = this.InterimAction,
            IntermediateAction = this.IntermediateAction,
            LongTermAction = this.LongTermAction,
            Status = this.Status,
            CreatedUserId = this.CreatedUserId,
            UpdatedUserId = this.UpdatedUserId,
            ResponsibleName = this.ResponsibleName,
            ResponsibleLineId = this.ResponsibleLineId,
            ResponsibleEmail = this.ResponsibleEmail,
            ResponsiblePhone = this.ResponsiblePhone,
            CreatedUtc = this.CreatedUtc,
            UpdatedUtc = this.UpdatedUtc
            // เพิ่ม field อื่น ๆ ตามที่มีในคลาส
        };
    }
}