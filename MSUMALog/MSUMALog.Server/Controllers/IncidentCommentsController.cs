using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Services;
using MSUMALog.Server.Helpers;
using MSUMALog.Server.Data; // Ensure the namespace containing UserClaimsHelper is imported

namespace MSUMALog.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IncidentCommentsController : ControllerBase
{
    private readonly IIncidentCommentService _service;
    private readonly ApplicationDbContext _dbContext;

    public IncidentCommentsController(IIncidentCommentService service, ApplicationDbContext dbContext)
    {
        _service = service ?? throw new ArgumentNullException(nameof(service));
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    [Authorize]
    [HttpGet("by-case/{caseNo}")]
    [ProducesResponseType(typeof(IEnumerable<IncidentCommentDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<IncidentCommentDto>>> GetByCase(string caseNo, CancellationToken ct = default)
        => Ok(await _service.GetByCaseNoAsync(caseNo, ct));

    [Authorize]
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
        if (!User.Identity?.IsAuthenticated ?? true)
            return Unauthorized("User not authenticated");

        var userId = UserClaimsHelper.GetUserId(User);
        if (userId == null)
            return Unauthorized("User not found");



        // server sets author and audit fields
        dto.AuthorUserId = userId;
        dto.CreatedUserId = userId;
        dto.UpdatedUserId = userId;
        dto.UpdatedUtc = DateTime.UtcNow;

        var created = await _service.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetByIncident), new { incidentId = created.IncidentReportId }, created);
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var userData = UserClaimsHelper.GetUser(User, _dbContext);
        if (userData is null)
            return Unauthorized("User not found");

        var comment = await _service.GetByIdAsync(id, ct);
        if (comment is null)
            return NotFound();

        if (userData.Role == "User" && comment.AuthorUserId != userData.Id)
            return Forbid("No Permission");

        var ok = await _service.DeleteAsync(id, ct);
        return ok ? NoContent() : NotFound();
    }
}