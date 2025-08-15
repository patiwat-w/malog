using Microsoft.EntityFrameworkCore;
using MSUMALog.Server.Data;
using MSUMALog.Server.Repositories;
using MSUMALog.Server.Services;
using MSUMALog.Server.Mappings;
using MSUMALog.Server.Mapping;
using Microsoft.AspNetCore.CookiePolicy;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// DbContext (SQL Server)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("SqlServer")));

// AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile).Assembly);
builder.Services.AddAutoMapper(typeof(IncidentReportProfile).Assembly);

// DI
builder.Services.AddScoped<IIncidentReportRepository, IncidentReportRepository>();
builder.Services.AddScoped<IIncidentReportService, IncidentReportService>();

// Enforce strict cookie policy (สำหรับทุกคุกกี้ที่ออกจากแอป)
builder.Services.Configure<CookiePolicyOptions>(o =>
{
    o.MinimumSameSitePolicy = SameSiteMode.Strict;
    o.Secure = CookieSecurePolicy.Always;
    o.HttpOnly = HttpOnlyPolicy.Always;
});

var app = builder.Build();

app.UseCookiePolicy(); // ต้องมาก่อนเขียนคุกกี้

app.UseDefaultFiles();
app.UseStaticFiles();

// EXTRA: Global hardening (ก่อน Origin/Referer middleware)
app.Use(async (ctx, next) =>
{
    // Block large bodies (ปรับได้)
    if (ctx.Request.ContentLength > 5 * 1024 * 1024)
    {
        ctx.Response.StatusCode = StatusCodes.Status413PayloadTooLarge;
        return;
    }

    // Accept only JSON for unsafe methods
    if (HttpMethods.IsPost(ctx.Request.Method) ||
        HttpMethods.IsPut(ctx.Request.Method) ||
        HttpMethods.IsPatch(ctx.Request.Method) ||
        HttpMethods.IsDelete(ctx.Request.Method))
    {
        var ct = ctx.Request.ContentType ?? "";
        if (!ct.StartsWith("application/json", StringComparison.OrdinalIgnoreCase))
        {
            ctx.Response.StatusCode = StatusCodes.Status415UnsupportedMediaType;
            await ctx.Response.WriteAsync("Unsupported Media Type");
            return;
        }
    }

    await next();
});

// ใน Production ตรวจ Origin/Referer (มีอยู่แล้ว เพิ่ม normalize/allow loopback)
if (!app.Environment.IsDevelopment())
{
    app.Use(async (context, next) =>
    {
        var req = context.Request;
        var host = req.Host.Host;

        bool HostMatch(string url)
        {
            if (!Uri.TryCreate(url, UriKind.Absolute, out var u)) return false;
            // อนุญาต localhost/127.0.0.1 (กรณี deploy ภายใน)
            if (u.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
                u.Host.StartsWith("127.0.0.", StringComparison.OrdinalIgnoreCase))
                return true;
            return string.Equals(u.Host, host, StringComparison.OrdinalIgnoreCase);
        }

        var origin = req.Headers["Origin"].ToString();
        if (!string.IsNullOrEmpty(origin) && !HostMatch(origin))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsync("Forbidden (Origin)");
            return;
        }

        var referer = req.Headers["Referer"].ToString();
        if (!string.IsNullOrEmpty(referer) && !HostMatch(referer))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsync("Forbidden (Referer)");
            return;
        }

        await next();
    });
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("/index.html");

// Apply migrations + seed
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        db.Database.Migrate();
        SeedData.Initialize(db);
    }
}

app.Run();
