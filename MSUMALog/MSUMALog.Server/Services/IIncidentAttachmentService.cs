using Microsoft.AspNetCore.Http;
using MSUMALog.Server.DTOs;

namespace MSUMALog.Server.Services;

public interface IIncidentAttachmentService
{
    Task<IncidentAttachmentDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<List<IncidentAttachmentDto>> GetByIncidentIdAsync(int incidentId, CancellationToken ct = default);
    Task<IncidentAttachmentDto> CreateAsync(IncidentAttachmentDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);

    // added: upload helper for multipart/form-data
    Task<IncidentAttachmentDto> UploadAsync(IFormFile file, int incidentId, int? createdUserId, string? description, string? kind, CancellationToken ct = default);
}