using Microsoft.EntityFrameworkCore;
using MSUMALog.Server.Models;

namespace MSUMALog.Server.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<IncidentReport> IncidentReports => Set<IncidentReport>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<IncidentReport>()
            .HasIndex(e => e.CaseNo)
            .IsUnique();
    }
}