using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Services;

namespace MSUMALog.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IncidentAttachmentsController : ControllerBase
{
    private readonly IIncidentAttachmentService _service;

    public IncidentAttachmentsController(IIncidentAttachmentService service)
    {
        _service = service;
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

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
        => await _service.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
