using Microsoft.AspNetCore.Http;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Models;
using System.Threading;
using System.Threading.Tasks;

namespace MSUMALog.Server.Services;

public interface IIncidentAttachmentService
{
    Task<IncidentAttachmentDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<List<IncidentAttachmentDto>> GetByIncidentIdAsync(int incidentId, CancellationToken ct = default);
    Task<IncidentAttachmentDto> CreateAsync(IncidentAttachmentDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);

    Task<IncidentAttachmentDto> UploadAsync(
        IFormFile file,
        int incidentId,
        int? createdUserId,
        string? description,
        string? kind,
        CancellationToken ct = default);

    // service-side result (may contain Stream for local files OR ExternalUrl for external)
    Task<StoredFileResult?> GetFileAsync(int id, CancellationToken ct = default);

    // return metadata safe to serialize for clients (no Stream)
    Task<StoredFileInfoDto?> GetFileInfoAsync(int id, CancellationToken ct = default);
}