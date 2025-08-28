using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;

namespace MSUMALog.Server.DTOs
{
    // Base class for shared properties, supporting patch updates
    // All properties nullable to allow partial updates
    public class IncidentReportDtoBase
    {
        public int? Id { get; set; }
        public string? Title { get; set; }
        public string? Status { get; set; }
        public string? Asset { get; set; }
        public string? Center { get; set; }
        public string? Domain { get; set; }
        public string? SubDomain { get; set; }
        public string? Vendor { get; set; }
        public string? Manufacturer { get; set; }
        public string? PartNumber { get; set; }

        public string? AdditionalInfo { get; set; }
        public string? InterimAction { get; set; }
        public string? IntermediateAction { get; set; }
        public string? LongTermAction { get; set; }

        public int? Severity { get; set; }
        public string? Symptoms { get; set; }
        public string? Impact { get; set; }
        public string? ResponsibleName { get; set; }
        public string? ResponsibleLineId { get; set; }
        public string? ResponsibleEmail { get; set; }
        public string? ResponsiblePhone { get; set; }
        // Estimated cost (amount + currency)
        public decimal? EstimateCostOfMa { get; set; }
        public string? EstimateCostOfMaCurrency { get; set; }
        public DateTime? IncidentDate { get; set; }
        public string? Description { get; set; }
        public DateTime? CreatedUtc { get; set; }
        public DateTime? UpdatedUtc { get; set; }


        public int? CreatedUserId { get;  set; }
        public int? UpdatedUserId { get;  set; }
    }

    // shared metadata for create DTO
    public class IncidentReportCreateMetadata
    {
        [Required, StringLength(200)]
        public string? Title { get; set; }

        [StringLength(4000)]
        public string? Description { get; set; }

        [Required]
        public string? Asset { get; set; }

        [Required]
        public string? Center { get; set; }

        [Required]
        public string? Domain { get; set; }

        [Required, Range(0, 5)]
        public int? Severity { get; set; }

        [Required, StringLength(3)]
        public string? EstimateCostOfMaCurrency { get; set; }

        [DataType(DataType.Currency)]
        public decimal? EstimateCostOfMa { get; set; }


        

        // add more validation metadata here as needed
    }

    // Get Result DTO for IncidentReport
    // [ModelMetadataType(typeof(IncidentReportCreateMetadata))]
    // public class IncidentReportDto : IncidentReportDtoBase
    // {
    //     [BindNever]          // ไม่ให้ client bind
    //     public string? CaseNo { get; internal set; } // UI cannot set CaseNo

    //     [Required, StringLength(200)]
    //     public new string Title { get; set; } = string.Empty;

    //     [StringLength(4000)]
    //     public new string? Description { get; set; }

    //     public new DateTime? IncidentDate { get; set; }

    //     [Range(0, 5)]
    //     public new int Severity { get; set; }

    //     public new string Asset { get; set; } = string.Empty;
    //     public new string Center { get; set; } = string.Empty;
    //     public new string Domain { get; set; } = string.Empty;


    //     [Required]
    //     public new string Status { get; set; } = string.Empty;

    //     // server-managed audit fields: do not accept from UI
    //     [BindNever]
    //     public int? CreatedUserId { get; internal set; }

    //     [BindNever]
    //     public int? UpdatedUserId { get; internal set; }

    //     // populated from related User (read-only -> do not allow client to set)
    //     [BindNever]
    //     public string? CreatedUserName { get; internal set; }

    //     [BindNever]
    //     public string? CreatedUserRole { get; internal set; }

    //     [BindNever]
    //     public string? UpdatedUserName { get; internal set; }

    //     [BindNever]
    //     public string? UpdatedUserRole { get; internal set; }



    //     [DataType(DataType.Currency)]
    //     public new decimal? EstimateCostOfMa { get; set; } = 0m;

    //     [Required, StringLength(3)]
    //     public new string? EstimateCostOfMaCurrency { get; set; } = "THB";

    //     [BindNever]
    //     public new DateTime? CreatedUtc { get; internal set; }

    //     [BindNever]
    //     public new DateTime? UpdatedUtc { get; internal set; }


    // }

    public class IncidentReportPatchDto : IncidentReportDtoBase
    {
        [Required]
        public new int Id { get; set; }

        // Keep same nullable string type as DTO
    }

    //IncidentReportCreateDto
    // add  required fields for create as non-nullable / default
    [ModelMetadataType(typeof(IncidentReportCreateMetadata))]
    public class IncidentReportCreateDto : IncidentReportDtoBase
    {
        // no redeclared properties here — metadata supplies validation
    }

    // Get Result DTO for IncidentReport
    public class IncidentReportDto : IncidentReportDtoBase
    {
        // server-managed read-only fields: keep BindNever + internal setter
        [BindNever]
        public string? CaseNo { get; internal set; }

        [BindNever]
        public new int? CreatedUserId { get; internal set; }

        [BindNever]
        public new int? UpdatedUserId { get; internal set; }

        [BindNever]
        public string? CreatedUserName { get; internal set; }

        [BindNever]
        public string? CreatedUserRole { get; internal set; }

        [BindNever]
        public string? UpdatedUserName { get; internal set; }

        [BindNever]
        public string? UpdatedUserRole { get; internal set; }

        [BindNever]
        public new DateTime? CreatedUtc { get; internal set; }

        [BindNever]
        public new DateTime? UpdatedUtc { get; internal set; }

        // Optionally, keep any small presentation-only helpers (readonly)
        // public string DisplayTitle => Title ?? string.Empty;
    }

    public class IncidentReportUpdateDto : IncidentReportCreateDto
    {
        [Required]
        public new int Id { get; set; }   // บังคับส่ง Id ใน PUT
        // ถ้าต้องการ ให้ redeclare required fields as non-nullable (same as CreateDto)
    }
}