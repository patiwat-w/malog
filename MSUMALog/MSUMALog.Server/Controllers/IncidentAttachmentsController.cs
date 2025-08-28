using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Helpers;
using MSUMALog.Server.Services;
using System.Net.Http;
using System;

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

        var userId = UserClaimsHelper.GetUserId(User);

        if (userId == null) return Unauthorized("User not found");
       

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
    {
        // get current user id
        var userId = UserClaimsHelper.GetUserId(User);
        if (userId == null) return Unauthorized("User not found");

        // ensure resource exists
        var dto = await _service.GetByIdAsync(id, ct);
        if (dto == null) return NotFound();

        // only the creator can delete
        // normalize both IDs to strings to avoid type mismatch (int? vs string?)
        var creatorIdStr = dto.CreatedUserId?.ToString();
        var currentUserIdStr = userId?.ToString();
        if (!string.Equals(creatorIdStr, currentUserIdStr, StringComparison.OrdinalIgnoreCase))
            return Forbid();

        // proceed with delete
        return await _service.DeleteAsync(id, ct) ? NoContent() : NotFound();
    }
}
