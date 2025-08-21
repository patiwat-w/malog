public async Task<PagedResultDto<IncidentReportDto>> SearchAsync(
    int page, int limit,
    IDictionary<string, string> filters,
    string? order,
    IEnumerable<string> selectFields,
    int? userId = null,
    CancellationToken ct = default)
{
    var query = _db.IncidentReports.AsQueryable();

    if (userId.HasValue)
        query = query.Where(x => x.CreatedUserId == userId.Value);

    foreach (var kv in filters)
    {
        var field = kv.Key;
        var value = kv.Value;
        var prop = typeof(IncidentReport).GetProperty(field);
        if (prop == null) continue;

        if (value.Contains('*'))
        {
            var likeValue = value.Replace("*", "");
            query = query.Where(x =>
                EF.Functions.Like(EF.Property<string>(x, field), $"%{likeValue}%"));
        }
        else
        {
            query = query.Where(x =>
                EF.Property<string>(x, field) == value);
        }
    }

    if (!string.IsNullOrWhiteSpace(order))
        query = query.OrderBy(order);
    else
        query = query.OrderByDescending(x => x.CreatedUtc);

    var total = await query.CountAsync(ct);

    var items = await query
        .Skip((page - 1) * limit)
        .Take(limit)
        .ToListAsync(ct);

    // Map เป็น IncidentReportDto
    var result = items.Select(_mapper.Map<IncidentReportDto>).ToList();

    return new PagedResultDto<IncidentReportDto>
    {
        TotalCount = total,
        Page = page,
        PageSize = limit,
        Items = result
    };
}