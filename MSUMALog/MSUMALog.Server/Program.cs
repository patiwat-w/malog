using Microsoft.EntityFrameworkCore;
using MSUMALog.Server.Data;
using MSUMALog.Server.Repositories;
using MSUMALog.Server.Services;
using MSUMALog.Server.Mappings;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OAuth;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.DataProtection;
using System.Security.Claims;
using MSUMALog.Server.Mapping;
using MSUMALog.Server.Models;
using System.Globalization;

var builder = WebApplication.CreateBuilder(args);

// ตั้งค่า CultureInfo เป็น InvariantCulture
CultureInfo.DefaultThreadCurrentCulture = CultureInfo.InvariantCulture;
CultureInfo.DefaultThreadCurrentUICulture = CultureInfo.InvariantCulture;

// make IHttpContextAccessor available for services
builder.Services.AddHttpContextAccessor();

// เพิ่ม logging สำหรับ debug
builder.Logging.AddFilter("Microsoft.AspNetCore.Authentication", LogLevel.Debug);
//builder.Logging.AddConsole();
//builder.Logging.AddDebug();
// Add services
builder.Services.AddControllers()

    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new UtcDateTimeConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// DbContext (SQL Server)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("SqlServer"))
           .LogTo(Console.WriteLine, LogLevel.Information));

// AutoMapper
builder.Services.AddAutoMapper(typeof(IncidentReportProfile).Assembly);

// DI
builder.Services.AddScoped<IIncidentReportRepository, IncidentReportRepository>();
builder.Services.AddScoped<IIncidentCommentRepository, IncidentCommentRepository>();
builder.Services.AddScoped<IIncidentReportService, IncidentReportService>();
builder.Services.AddScoped<IIncidentCommentService, IncidentCommentService>();
builder.Services.AddScoped<IAuditService, AuditService>();



// Data Protection สำหรับ Production (ย้ายขึ้นมา)
if (!builder.Environment.IsDevelopment())
{
    var keysPath = builder.Configuration["DataProtection:KeysPath"];
    builder.Services.AddDataProtection()
        .PersistKeysToFileSystem(new DirectoryInfo(keysPath))
        .SetApplicationName("MSUMALog");
}

// Cookie Policy
builder.Services.Configure<CookiePolicyOptions>(options =>
{
    options.MinimumSameSitePolicy = SameSiteMode.Unspecified;
    options.Secure = CookieSecurePolicy.Always;
    options.HttpOnly = HttpOnlyPolicy.Always;
});

// Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = GoogleDefaults.AuthenticationScheme;
})
.AddCookie(options =>
{
    options.Cookie.Name = "auth";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Events = new CookieAuthenticationEvents
    {
        OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        }
    };
})
.AddGoogle(options =>
{
    options.ClientId = builder.Configuration["Authentication:Google:ClientId"]!;
    options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"]!;
    options.CallbackPath = "/auth/signin-google";
    options.SaveTokens = true;

    options.CorrelationCookie.SameSite = SameSiteMode.Lax;
    options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;
    options.CorrelationCookie.HttpOnly = true;

    options.Scope.Add("email");
    options.Scope.Add("profile");

    options.AccessType = "offline";
    //options.Prompt = "consent";

    options.ClaimActions.MapJsonKey("picture", "picture");
    options.ClaimActions.MapJsonKey(ClaimTypes.GivenName, "given_name");
    options.ClaimActions.MapJsonKey(ClaimTypes.Surname, "family_name");
    options.ClaimActions.MapJsonKey(ClaimTypes.Email, "email");

    options.Events = new OAuthEvents
    {
        OnCreatingTicket = async context =>
        {
            Console.WriteLine("OnCreatingTicket called");
            var email = context.Identity.FindFirst(ClaimTypes.Email)?.Value;
            var firstName = context.Identity.FindFirst(ClaimTypes.GivenName)?.Value;
            var lastName = context.Identity.FindFirst(ClaimTypes.Surname)?.Value;
            var profilePicture = context.Identity.FindFirst("picture")?.Value;
            Console.WriteLine($"profilePicture: {profilePicture}");

            // สร้างหรืออัปเดต user ใน database
            var db = context.HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
            var user = db.Users.FirstOrDefault(u => u.Email == email);
            if (user == null)
            {
                Console.WriteLine("Creating new user");
                user = new User
                {
                    Email = email,
                    Role = "User",
                    LoginCount = 1,
                    LastLoginDate = DateTime.UtcNow,
                    FirstName = firstName,
                    LastName = lastName,
                    ProfilePicture = profilePicture,
                    Logs = "Creating new user"
                };
                db.Users.Add(user);
                try
                {
                    await db.SaveChangesAsync();
                }
                catch
                {
                    Console.WriteLine("Error saving user to database");
                    context.Response.Redirect("/login-fail");
                    return;
                }
            }
            else
            {
                Console.WriteLine("Updating existing user");
                user.LoginCount++;
                user.LastLoginDate = DateTime.UtcNow;
                user.FirstName = firstName ?? user.FirstName;
                user.LastName = lastName ?? user.LastName;
                user.ProfilePicture = profilePicture ?? user.ProfilePicture;
                user.Logs = "Updating existing user";
                await db.SaveChangesAsync();
            }

            // publish user id and role into claims so downstream services can read current user's DB id
            if (user != null)
            {
                // Add NameIdentifier claim (DB user id)
                // Remove existing NameIdentifier claim if it exists
                var nameIdClaim = context.Identity.FindFirst(ClaimTypes.NameIdentifier);
                if (nameIdClaim != null)
                    context.Identity.RemoveClaim(nameIdClaim);
                context.Identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()));

                // Remove existing Email claim if it exists
                var emailClaim = context.Identity.FindFirst(ClaimTypes.Email);
                if (emailClaim != null)
                    context.Identity.RemoveClaim(emailClaim);
                context.Identity.AddClaim(new Claim(ClaimTypes.Email, user.Email ?? ""));

                // Remove existing Name claim if it exists
                var nameClaim = context.Identity.FindFirst(ClaimTypes.Name);
                if (nameClaim != null)
                    context.Identity.RemoveClaim(nameClaim);
                context.Identity.AddClaim(new Claim(ClaimTypes.Name, user.FirstName ?? user.Email ?? ""));

                // Remove existing GivenName claim if it exists
                var givenNameClaim = context.Identity.FindFirst(ClaimTypes.GivenName);
                if (givenNameClaim != null)
                    context.Identity.RemoveClaim(givenNameClaim);
                context.Identity.AddClaim(new Claim(ClaimTypes.GivenName, user.FirstName ?? ""));

                // Remove existing Surname claim if it exists
                var surnameClaim = context.Identity.FindFirst(ClaimTypes.Surname);
                if (surnameClaim != null)
                    context.Identity.RemoveClaim(surnameClaim);
                context.Identity.AddClaim(new Claim(ClaimTypes.Surname, user.LastName ?? ""));

                // Remove existing Picture claim if it exists
                var pictureClaim = context.Identity.FindFirst("picture");
                if (pictureClaim != null)
                    context.Identity.RemoveClaim(pictureClaim);
                context.Identity.AddClaim(new Claim("picture", user.ProfilePicture ?? ""));
            }
        }
    };
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy.WithOrigins(
            "https://localhost:63950",
            "https://msu-malog.egmu-research.org"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
        .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
    });
});

// ใน Program.cs หรือ Startup.cs
builder.Services.Configure<AuditConfig>(builder.Configuration.GetSection("Audit"));

var app = builder.Build();

// Middleware Pipeline
app.UseCookiePolicy();
app.UseHttpsRedirection();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Global hardening middleware
app.Use(async (context, next) =>
{
    if (context.Request.ContentLength > 5 * 1024 * 1024)
    {
        context.Response.StatusCode = StatusCodes.Status413PayloadTooLarge;
        return;
    }

    var method = context.Request.Method;
    bool mustHaveJson = HttpMethods.IsPost(method) ||
                        HttpMethods.IsPut(method) ||
                        HttpMethods.IsPatch(method) ||
                        (HttpMethods.IsDelete(method) && (context.Request.ContentLength ?? 0) > 0);

    if (mustHaveJson)
    {
        var contentType = context.Request.ContentType ?? "";
        if (!contentType.StartsWith("application/json", StringComparison.OrdinalIgnoreCase))
        {
            context.Response.StatusCode = StatusCodes.Status415UnsupportedMediaType;
            await context.Response.WriteAsync("Unsupported Media Type");
            return;
        }
    }

    await next();
});

// Request logging middleware
app.Use(async (context, next) =>
{
    // Log basic request information
    Console.WriteLine($"Request: {context.Request.Method} {context.Request.Path} {context.Request.QueryString}");

    // Log Controller and Action (if available)
    var endpoint = context.GetEndpoint();
    if (endpoint != null)
    {
        var controller = endpoint.Metadata.GetMetadata<Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor>();
        if (controller != null)
        {
            Console.WriteLine($"Controller: {controller.ControllerName}, Action: {controller.ActionName}");
        }
    }

    await next();
});

// 📌 ตำแหน่งที่ถูกต้องสำหรับ Middleware ที่เกี่ยวกับการตรวจสอบความปลอดภัย
// middleware เหล่านี้ควรอยู่ก่อน UseAuthentication() และ UseAuthorization()
app.UseCors("frontend");

// 🎯 แก้ไข Origin/Referer check for production
// ย้ายมาไว้ก่อน UseAuthentication และแก้ไขเงื่อนไขให้ยอมรับ Referer จาก Google
if (!app.Environment.IsDevelopment())
{
    app.Use(async (context, next) =>
    {
        var request = context.Request;
        var host = request.Host.Host;

        bool IsAllowedHost(string url)
        {
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)) return false;

            // ยอมรับ host ของตัวเอง, localhost, และ Google
            return string.Equals(uri.Host, host, StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(uri.Host, "localhost", StringComparison.OrdinalIgnoreCase) ||
                   uri.Host.StartsWith("127.0.0.", StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(uri.Host, "accounts.google.com", StringComparison.OrdinalIgnoreCase);
        }

        var origin = request.Headers["Origin"].ToString();
        if (!string.IsNullOrEmpty(origin) && !IsAllowedHost(origin))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsync("Forbidden (Origin)");
            return;
        }

        var referer = request.Headers["Referer"].ToString();
        if (!string.IsNullOrEmpty(referer) && !IsAllowedHost(referer))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsync("Forbidden (Referer)");
            return;
        }

        await next();
    });
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Run migrations & seed once at startup. Use SQL Server application lock to ensure only one instance performs this.
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var conn = db.Database.GetDbConnection();
        await conn.OpenAsync();
        try
        {
            // Try to acquire an exclusive application lock. Timeout = 10000 ms (10s).
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "DECLARE @result int; EXEC @result = sp_getapplock @Resource = 'MSUMALog_Migrations', @LockMode = 'Exclusive', @LockOwner = 'Session', @LockTimeout = 10000; SELECT @result;";
            var scalar = await cmd.ExecuteScalarAsync();
            var result = scalar != null ? Convert.ToInt32(scalar) : -999;

            // sp_getapplock returns >=0 on success, negative on failure
            if (result >= 0)
            {
                logger.LogInformation("Acquired migration lock (sp_getapplock={Result}). Applying migrations and seeding...", result);
                db.Database.Migrate();
                SeedData.Initialize(db);
                logger.LogInformation("Database migration and seeding completed.");
            }
            else
            {
                logger.LogWarning("Could not acquire migration lock (sp_getapplock={Result}). Skipping migrations/seed on this instance.", result);
            }
        }
        finally
        {
            // Release lock explicitly and close connection if open.
            if (conn.State == System.Data.ConnectionState.Open)
            {
                try
                {
                    using var relCmd = conn.CreateCommand();
                    relCmd.CommandText = "EXEC sp_releaseapplock @Resource = 'MSUMALog_Migrations', @LockOwner = 'Session';";
                    await relCmd.ExecuteNonQueryAsync();
                }
                catch
                {
                    // ignore release errors
                }
                finally
                {
                    await conn.CloseAsync();
                }
            }
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Database migration/seed failed at startup.");
        // Rethrow to stop startup if you want fail-fast; otherwise comment the next line.
        throw;
    }
}

// Error handling middleware
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Exception: {ex.Message}");
        Console.WriteLine($"StackTrace: {ex.StackTrace}");
        throw;
    }
});

app.MapFallbackToFile("/index.html");

app.Run();