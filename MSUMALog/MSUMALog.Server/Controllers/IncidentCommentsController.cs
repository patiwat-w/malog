using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Services;

namespace MSUMALog.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IncidentCommentsController(IIncidentCommentService service) : ControllerBase
{
    private readonly IIncidentCommentService _service = service;

    [HttpGet("by-case/{caseNo}")]
    [ProducesResponseType(typeof(IEnumerable<IncidentCommentDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<IncidentCommentDto>>> GetByCase(string caseNo, CancellationToken ct = default)
        => Ok(await _service.GetByCaseNoAsync(caseNo, ct));

    [HttpGet("by-incident/{incidentId:int}")]
    [ProducesResponseType(typeof(IEnumerable<IncidentCommentDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<IncidentCommentDto>>> GetByIncident(int incidentId, CancellationToken ct = default)
        => Ok(await _service.GetByIncidentIdAsync(incidentId, ct));

    [Authorize]
    [HttpPost]
    [ProducesResponseType(typeof(IncidentCommentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IncidentCommentDto>> Create([FromBody] IncidentCommentDto dto, CancellationToken ct = default)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim is null || !int.TryParse(userIdClaim, out var userId))
            return Unauthorized("User not authenticated");

        // server sets author and audit fields
        dto.AuthorUserId = userId;
        dto.CreatedUserId = userId;
        dto.UpdatedUserId = userId;
        dto.UpdatedUtc = DateTime.UtcNow;

        var created = await _service.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetByIncident), new { incidentId = created.IncidentReportId }, created);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var ok = await _service.DeleteAsync(id, ct);
        return ok ? NoContent() : NotFound();
    }
}