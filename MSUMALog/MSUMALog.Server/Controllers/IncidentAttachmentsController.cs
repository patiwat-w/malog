using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Services;
using System.Net.Http;

namespace MSUMALog.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IncidentAttachmentsController : ControllerBase
{
    private readonly IIncidentAttachmentService _service;
    private readonly IHttpClientFactory _httpFactory;

    public IncidentAttachmentsController(IIncidentAttachmentService service, IHttpClientFactory httpFactory)
    {
        _service = service;
        _httpFactory = httpFactory;
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<IncidentAttachmentDto>> Get(int id, CancellationToken ct = default)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpGet("by-incident/{incidentId:int}")]
    public async Task<ActionResult<IEnumerable<IncidentAttachmentDto>>> GetByIncident(int incidentId, CancellationToken ct = default)
        => Ok(await _service.GetByIncidentIdAsync(incidentId, ct));

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<IncidentAttachmentDto>> Create([FromBody] IncidentAttachmentDto dto, CancellationToken ct = default)
    {
        var created = await _service.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    // ✅ เมธอดใหม่: ใช้ DTO เดียว + [Consumes]
    //https://localhost:63950/api/IncidentAttachments/upload
    [Authorize]
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<IncidentAttachmentDto>> Upload(
        [FromForm] IncidentAttachmentUploadRequestDto req,
        CancellationToken ct = default)
    {
        if (req.File == null || req.File.Length == 0) return BadRequest("file required");

        int? userId = null;
        var userIdClaim = User.FindFirst("sub") ?? User.FindFirst("id");
        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var uid)) userId = uid;

        var created = await _service.UploadAsync(req.File, req.IncidentId, userId, req.Description, req.Kind, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpGet("file-info/{id:int}")]
    public async Task<ActionResult<StoredFileInfoDto>> FileInfo(int id, CancellationToken ct = default)
    {
        var info = await _service.GetFileInfoAsync(id, ct);
        return info is null ? NotFound() : Ok(info);
    }

    [HttpGet("download/{id:int}")]
    public async Task<IActionResult> Download(int id, [FromQuery] bool proxy = false, CancellationToken ct = default)
    {
        var fileResult = await _service.GetFileAsync(id, ct);
        if (fileResult == null) return NotFound();

        if (fileResult.IsExternal && !string.IsNullOrWhiteSpace(fileResult.ExternalUrl))
        {
            if (!proxy) return Redirect(fileResult.ExternalUrl);

            // proxy=true -> backend fetches external URL and streams to client
            var client = _httpFactory.CreateClient();
            using var resp = await client.GetAsync(fileResult.ExternalUrl, HttpCompletionOption.ResponseHeadersRead, ct);
            if (!resp.IsSuccessStatusCode) return StatusCode((int)resp.StatusCode);
            var stream = await resp.Content.ReadAsStreamAsync(ct);
            var contentType = resp.Content.Headers.ContentType?.ToString() ?? fileResult.ContentType ?? "application/octet-stream";
            var fileName = fileResult.FileName ?? "file";
            return File(stream, contentType, fileName);
        }

        return File(fileResult.Stream!, fileResult.ContentType ?? "application/octet-stream", fileResult.FileName);
    }

    [HttpGet("redirect/{id:int}")]
    public async Task<IActionResult> RedirectToExternal(int id, CancellationToken ct = default)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        if (dto == null) return NotFound();

        // assume dto.StorageKey holds the external absolute URL for external files
        if (string.IsNullOrWhiteSpace(dto.StorageKey) || !Uri.IsWellFormedUriString(dto.StorageKey, UriKind.Absolute))
            return BadRequest();

        // optional: validate whitelist hosts here

        return Redirect(dto.StorageKey);
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
        => await _service.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
