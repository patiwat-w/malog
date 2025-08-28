namespace MSUMALog.Server.DTOs;

public sealed class StoredFileInfoDto
{
    public string FileName { get; set; } = null!;
    public string? ContentType { get; set; }
    public long SizeBytes { get; set; }
    public bool IsExternal { get; set; }
    public string? ExternalUrl { get; set; }
}