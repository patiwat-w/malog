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

var builder = WebApplication.CreateBuilder(args);

// เพิ่ม logging สำหรับ debug
builder.Logging.AddFilter("Microsoft.AspNetCore.Authentication", LogLevel.Debug);

// Add services
builder.Services.AddControllers();
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
                    Logs = "Creating new user" // เพิ่มบรรทัดนี้
                };
                db.Users.Add(user);
                try
                {
                    await db.SaveChangesAsync();
                }
                catch
                {
                    Console.WriteLine("Error saving user to database");
                    // ถ้าสร้าง user ไม่ได้ ให้ redirect ไป /login-fail
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
                user.Logs = "Updating existing user"; // เพิ่มบรรทัดนี้
                await db.SaveChangesAsync();
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

// Apply migrations + seed in development

{
	// Migration & seed with retry and fresh scope per attempt
	const int maxAttempts = 5;
	for (int attempt = 1; attempt <= maxAttempts; attempt++)
	{
		using var scope = app.Services.CreateScope();
		var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
		try
		{
			var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
			logger.LogInformation("Applying migrations (attempt {Attempt}/{MaxAttempts})...", attempt, maxAttempts);
			db.Database.Migrate();
			SeedData.Initialize(db);
			logger.LogInformation("Database migration and seeding completed.");
			break;
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Database migration/seed failed on attempt {Attempt}/{MaxAttempts}", attempt, maxAttempts);
			if (attempt == maxAttempts)
			{
				logger.LogCritical("Exceeded maximum migration attempts. Application will stop.");
				// Rethrow to stop startup (fail-fast). Remove throw if you prefer to continue without DB.
				throw;
			}
			// Exponential backoff before next attempt
			var delaySeconds = Math.Min(30, Math.Pow(2, attempt));
			logger.LogInformation("Waiting {DelaySeconds}s before retrying...", delaySeconds);
			await Task.Delay(TimeSpan.FromSeconds(delaySeconds));
		}
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