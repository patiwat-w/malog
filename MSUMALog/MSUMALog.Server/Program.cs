using Microsoft.EntityFrameworkCore;
using MSUMALog.Server.Data;
using MSUMALog.Server.Repositories;
using MSUMALog.Server.Services;
using MSUMALog.Server.Mappings;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// DbContext (InMemory for now)
builder.Services.AddDbContext<ApplicationDbContext>(opt =>
{
    opt.UseInMemoryDatabase("MSUMALogDb");
});

// AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile).Assembly);

// DI
builder.Services.AddScoped<IIncidentReportRepository, IncidentReportRepository>();
builder.Services.AddScoped<IIncidentReportService, IncidentReportService>();

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("/index.html");

app.Run();
