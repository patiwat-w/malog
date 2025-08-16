using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.Text.Json.Serialization;

namespace MSUMALog.Server.DTOs
{
    public class IncidentReportDto
    {
        public int Id { get; set; }

        [BindNever]          // ไม่ให้ client bind
        public string? CaseNo { get; internal set; } // UI cannot set CaseNo

        [Required, StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [StringLength(4000)]
        public string? Description { get; set; }

        public DateTime? IncidentDate { get; set; }

        [Range(0,5)]
        public int Severity { get; set; }

        public string Asset { get; set; } = string.Empty;
        public string Center { get; set; } = string.Empty;
        public string? Symptoms { get; set; }
        public string? Impact { get; set; }
        public string Domain { get; set; } = string.Empty;
        public string? SubDomain { get; set; }
        public string? Vendor { get; set; }
        public string? Manufacturer { get; set; }
        public string? PartNumber { get; set; }
        public string? AdditionalInfo { get; set; }
        public string? InterimAction { get; set; }
        public string? IntermediateAction { get; set; }
        public string? LongTermAction { get; set; }
        public string Status { get; set; } = string.Empty;

        // server-managed audit fields: do not accept from UI
        [BindNever]
        public int? CreatedUserId { get; internal set; }

        [BindNever]
        public int? UpdatedUserId { get; internal set; }

        // populated from related User (read-only -> do not allow client to set)
        [BindNever]
        public string? CreatedUserName { get; internal set; }

        [BindNever]
        public string? CreatedUserRole { get; internal set; }

        [BindNever]
        public string? UpdatedUserName { get; internal set; }

        [BindNever]
        public string? UpdatedUserRole { get; internal set; }

        public string? ResponsibleName { get; set; }
        public string? ResponsibleLineId { get; set; }
        public string? ResponsibleEmail { get; set; }
        public string? ResponsiblePhone { get; set; }

        [BindNever]
        public DateTime? CreatedUtc { get; internal set; }

        [BindNever]
        public DateTime? UpdatedUtc { get; internal set; }
    }
}