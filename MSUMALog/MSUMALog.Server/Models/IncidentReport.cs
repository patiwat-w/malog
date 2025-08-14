using System.ComponentModel.DataAnnotations;

namespace MSUMALog.Server.Models;

public class IncidentReport
{
    public int Id { get; set; }

 
    public string CaseNo { get; set; } = string.Empty;

   
    public string Asset { get; set; } = string.Empty;

  
    public string Center { get; set; } = string.Empty;

    public DateTime IncidentDate { get; set; }

    public string Symptoms { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Impact { get; set; } = string.Empty;

  
    public string Domain { get; set; } = string.Empty;

    public string SubDomain { get; set; } = string.Empty;
    public string Vendor { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public string PartNumber { get; set; } = string.Empty;
    public string AdditionalInfo { get; set; } = string.Empty;
    public string InterimAction { get; set; } = string.Empty;
    public string IntermediateAction { get; set; } = string.Empty;
    public string LongTermAction { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;

    // Responsible person
    public string ResponsibleName { get; set; } = string.Empty;
    public string ResponsibleLineId { get; set; } = string.Empty;
    public string ResponsibleEmail { get; set; } = string.Empty;
    public string ResponsiblePhone { get; set; } = string.Empty;

    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedUtc { get; set; }
}