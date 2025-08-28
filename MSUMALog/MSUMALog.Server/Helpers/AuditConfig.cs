public class AuditConfig
{
    public string[] IncidentReportFields { get; set; } = Array.Empty<string>();
    public string[] IncidentCommentFields { get; set; } = Array.Empty<string>();

    // NEW: fields สำหรับ attachment
    public string[] IncidentAttachmentFields { get; set; } = Array.Empty<string>();
}