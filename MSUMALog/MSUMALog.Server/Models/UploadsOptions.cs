namespace MSUMALog.Server.Models;
public class UploadsOptions
{
    public string RootPath { get; set; } = "";
    public string? PublicBaseUrl { get; set; } // เช่น "/uploads" หรือ "https://cdn.example.com"
    public long MaxFileSizeBytes { get; set; } = 20L * 1024 * 1024; // 20MB
    public string[] AllowedMimePrefixes { get; set; } = new[] { "image/", "video/", "audio/", "application/pdf" };
}
