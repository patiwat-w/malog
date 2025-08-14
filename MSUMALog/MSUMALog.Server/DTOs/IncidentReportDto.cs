using System;

namespace MSUMALog.Server.DTOs
{
    public class IncidentReportDto
    {
        public int Id { get; set; }
        public string Case_no { get; set; } = string.Empty;
        public string Asset { get; set; } = string.Empty;
        public string Center { get; set; } = string.Empty;
        public string Incident_date { get; set; } = string.Empty; // ISO yyyy-MM-dd
        public string Symptoms { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public string Impact { get; set; } = string.Empty;
        public string Domain { get; set; } = string.Empty;
        public string Sub_domain { get; set; } = string.Empty;
        public string Vendor { get; set; } = string.Empty;
        public string Manufacturer { get; set; } = string.Empty;
        public string Part_number { get; set; } = string.Empty;
        public string Additional_info { get; set; } = string.Empty;
        public string Interim_action { get; set; } = string.Empty;
        public string Intermediate_action { get; set; } = string.Empty;
        public string Long_term_action { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Created_by { get; set; } = string.Empty;
        public string Responsible_name { get; set; } = string.Empty;
        public string Responsible_lineid { get; set; } = string.Empty;
        public string Responsible_email { get; set; } = string.Empty;
        public string Responsible_phone { get; set; } = string.Empty;
    }
}