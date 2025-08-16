using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Services;
using System;
using MSUMALog.Server.Helpers;

namespace MSUMALog.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IncidentReportsController(IIncidentReportService service) : ControllerBase
{
    private readonly IIncidentReportService _service = service;

    [Authorize]
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<IncidentReportDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<IncidentReportDto>>> GetAll(CancellationToken ct = default)
        => Ok(await _service.GetAllAsync(ct));

    [Authorize]
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(IncidentReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IncidentReportDto>> GetById(int id, CancellationToken ct = default)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

     [Authorize]
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
        if (!User.Identity?.IsAuthenticated ?? true)
            return Unauthorized("User not authenticated");

        var userId = UserClaimsHelper.GetUserId(User);
        if (userId == null)
            return Unauthorized("User not found");



        dto.CreatedUserId = userId.Value;
        dto.UpdatedUserId = userId.Value;
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

        if (!User.Identity?.IsAuthenticated ?? true)
            return Unauthorized("User not authenticated");

        var userId = UserClaimsHelper.GetUserId(User);
        if (userId == null)
            return Unauthorized("User not found");



        dto.UpdatedUserId = userId.Value;
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
            return Unauthorized("User not authenticated");

        var userId = UserClaimsHelper.GetUserId(User);
        if (userId == null)
            return Unauthorized("User not found");



        var now = DateTime.UtcNow;
        var metaDto = new IncidentReportDto
        {
            Id = id,
            UpdatedUserId = userId.Value,
            UpdatedUtc = now
        };
        await _service.UpdateAsync(id, metaDto, ct);

        var ok = await _service.DeleteAsync(id, ct);
        return ok ? NoContent() : NotFound();
    }
}