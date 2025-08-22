using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MSUMALog.Server.DTOs;
using MSUMALog.Server.Services;

[ApiController]
[Route("api/[controller]")]
public class AuditController(IAuditService auditService) : ControllerBase
{
    private readonly IAuditService _auditService = auditService;

    [Authorize]
    [HttpGet("timeline")]
    [ProducesResponseType(typeof(PagedResultDto<AuditTimelineDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResultDto<AuditTimelineDto>>> GetTimeline(
        [FromQuery] int incidentId,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 10,
        CancellationToken ct = default)
    {
        var result = await _auditService.GetIncidentTimelinePagedAsync(incidentId, page, limit, ct);
        return Ok(result);
    }

    [Authorize]
    [HttpGet("batch/{batchId:guid}")]
    [ProducesResponseType(typeof(List<AuditFieldChangeDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AuditFieldChangeDto>>> GetAuditBatchDetail(Guid batchId, CancellationToken ct = default)
    {
        var logs = await _auditService.GetAuditBatchDetailAsync(batchId, ct);
        return Ok(logs);
    }

    [Authorize]
    [HttpGet("{referenceEntityName}/{referenceId}/timeline")]
    [ProducesResponseType(typeof(PagedResultDto<AuditTimelineDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResultDto<AuditTimelineDto>>> GetTimelineByReference(
        string referenceEntityName,
        int referenceId,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 10,
        CancellationToken ct = default)
    {
        var result = await _auditService.GetTimelinePagedByReferenceAsync(referenceEntityName, referenceId, page, limit, ct);
        return Ok(result);
    }
}