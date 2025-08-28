using System.IO;

namespace MSUMALog.Server.Models;

public sealed class StoredFileResult
{
    public StoredFileResult(Stream? stream, string fileName, string? contentType, long length = 0, bool isExternal = false, string? externalUrl = null)
    {
        Stream = stream;
        FileName = fileName;
        ContentType = contentType;
        Length = length;
        IsExternal = isExternal;
        ExternalUrl = externalUrl;
    }

    public Stream? Stream { get; }
    public string FileName { get; }
    public string? ContentType { get; }
    public long Length { get; }
    public bool IsExternal { get; }
    public string? ExternalUrl { get; }
}