using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Services;
using System;

namespace MSUMALog.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IncidentReportsController(IIncidentReportService service) : ControllerBase
{
    private readonly IIncidentReportService _service = service;

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<IncidentReportDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<IncidentReportDto>>> GetAll(CancellationToken ct = default)
        => Ok(await _service.GetAllAsync(ct));

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(IncidentReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IncidentReportDto>> GetById(int id, CancellationToken ct = default)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpGet("by-case/{caseNo}")]
    [ProducesResponseType(typeof(IncidentReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IncidentReportDto>> GetByCaseNo(string caseNo, CancellationToken ct = default)
    {
        var dto = await _service.GetByCaseNoAsync(caseNo, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [Authorize]
    [HttpPost]
    [ProducesResponseType(typeof(IncidentReportDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IncidentReportDto>> Create([FromBody] IncidentReportDto dto, CancellationToken ct = default)
    {
     
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim is null || !int.TryParse(userIdClaim, out var userId))
            return Unauthorized("User not authenticated");
        
        dto.CreatedUserId = userId;
        dto.UpdatedUserId = userId;
        dto.UpdatedUtc = DateTime.UtcNow;

        var created = await _service.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [Authorize]
    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] IncidentReportDto dto, CancellationToken ct = default)
    {
        if (dto.Id != 0 && dto.Id != id)
            return BadRequest("Mismatched id.");

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim is null || !int.TryParse(userIdClaim, out var userId))
            return Unauthorized("User not authenticated");

        dto.UpdatedUserId = userId;
        dto.UpdatedUtc = DateTime.UtcNow;

        var ok = await _service.UpdateAsync(id, dto, ct);
        return ok ? NoContent() : NotFound();
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        if (!User.Identity?.IsAuthenticated ?? true)
            return Unauthorized();

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim is null || !int.TryParse(userIdClaim, out var userId))
            return Unauthorized("User not authenticated");

        var now = DateTime.UtcNow;
        var metaDto = new IncidentReportDto
        {
            Id = id,
            UpdatedUserId = userId,
            UpdatedUtc = now
        };
        await _service.UpdateAsync(id, metaDto, ct);

        var ok = await _service.DeleteAsync(id, ct);
        return ok ? NoContent() : NotFound();
    }
}