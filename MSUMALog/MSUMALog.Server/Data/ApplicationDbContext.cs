using Microsoft.EntityFrameworkCore;
using MSUMALog.Server.Models;

namespace MSUMALog.Server.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<IncidentReport> IncidentReports => Set<IncidentReport>();
}