using Microsoft.EntityFrameworkCore;
using MSUMALog.Server.Data;
using MSUMALog.Server.Repositories;
using MSUMALog.Server.Services;
using MSUMALog.Server.Mappings;
using MSUMALog.Server.Mapping;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// DbContext (SQL Server)
builder.Services.AddDbContext<ApplicationDbContext>(opt =>
{
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// AutoMapper (scan assembly containing profiles)
builder.Services.AddAutoMapper(typeof(IncidentReportProfile).Assembly); // หากยังไม่มี
// ถ้าสร้าง IncidentCommentProfile อยู่ใน assembly เดียวกันก็เพียงพอ
// หรือใช้: builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// DI
builder.Services.AddScoped<IIncidentReportRepository, IncidentReportRepository>();
builder.Services.AddScoped<IIncidentCommentRepository, IncidentCommentRepository>();   // <--
builder.Services.AddScoped<IIncidentReportService, IncidentReportService>();
builder.Services.AddScoped<IIncidentCommentService, IncidentCommentService>();         // <--

// Enforce strict cookie policy (สำหรับทุกคุกกี้ที่ออกจากแอป)
builder.Services.Configure<CookiePolicyOptions>(o =>
{
    // ปล่อยให้แต่ละ cookie กำหนด SameSite เอง (ไม่ขัดกับ SameSite=None ของ auth cookie)
    o.MinimumSameSitePolicy = SameSiteMode.None;
    o.Secure = CookieSecurePolicy.Always;
    o.HttpOnly = HttpOnlyPolicy.Always;
});

// เพิ่ม Cookie Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = GoogleDefaults.AuthenticationScheme;
})
.AddCookie(opt =>
{
    opt.Cookie.Name = "auth";
    opt.Cookie.HttpOnly = true;
    opt.Cookie.SameSite = SameSiteMode.Lax; // เปลี่ยนจาก None เป็น Lax
    opt.Cookie.SecurePolicy = CookieSecurePolicy.Always;
})
.AddGoogle(opt =>
{
    opt.ClientId = builder.Configuration["Authentication:Google:ClientId"]!;
    opt.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"]!;
    opt.CallbackPath = "/auth/signin-google"; // ต้องตรงกับ Authorized redirect URIs
    opt.SaveTokens = true;
});

builder.Services.AddCors(opt =>
{
    opt.AddPolicy("frontend", p =>
    {
        p.WithOrigins("https://localhost:63950, https://msu-malog.egmu-research.org")
         .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCookiePolicy(); // ต้องมาก่อนเขียนคุกกี้

app.UseDefaultFiles();
app.UseStaticFiles();

// EXTRA: Global hardening (ก่อน Origin/Referer middleware)
app.Use(async (ctx, next) =>
{
    if (ctx.Request.ContentLength > 5 * 1024 * 1024)
    {
        ctx.Response.StatusCode = StatusCodes.Status413PayloadTooLarge;
        return;
    }

    var method = ctx.Request.Method;

    // บังคับ JSON เฉพาะเมื่อต้องมี body:
    // POST / PUT / PATCH หรือ DELETE ที่ส่ง body มา (ContentLength > 0)
    bool mustHaveJson =
        HttpMethods.IsPost(method) ||
        HttpMethods.IsPut(method) ||
        HttpMethods.IsPatch(method) ||
        (HttpMethods.IsDelete(method) && (ctx.Request.ContentLength ?? 0) > 0);

    if (mustHaveJson)
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

app.Use(async (ctx, next) =>
{
    Console.WriteLine($"Request: {ctx.Request.Method} {ctx.Request.Path} {ctx.Request.QueryString}");
    Console.WriteLine($"Headers: {string.Join(", ", ctx.Request.Headers.Select(h => $"{h.Key}: {h.Value}"))}");
    await next();
});

app.Use(async (context, next) =>
{
    // ตรวจสอบว่า Path ไม่ใช่ /auth
    if (context.Request.Path.StartsWithSegments("/auth"))
    {
        await next();
        return;
    }

    // Logic สำหรับ Static Files
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
            // อนุญาต Google Referer
            if (u.Host.Equals("accounts.google.com", StringComparison.OrdinalIgnoreCase))
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

app.UseCors("frontend"); // ต้องมาก่อน Auth สำหรับ preflight

app.UseAuthentication(); // <-- ก่อน Authorization
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
