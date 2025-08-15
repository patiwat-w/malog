using Microsoft.EntityFrameworkCore;
using MSUMALog.Server.Models;

namespace MSUMALog.Server.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<IncidentReport> IncidentReports => Set<IncidentReport>();
    public DbSet<IncidentComment> IncidentComments => Set<IncidentComment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<IncidentReport>()
            .HasIndex(e => e.CaseNo)
            .IsUnique();

        modelBuilder.Entity<IncidentComment>(b =>
        {
            b.HasIndex(c => c.IncidentReportId);
            b.Property(c => c.Body).HasMaxLength(8000);
            b.HasOne(c => c.IncidentReport)
                .WithMany() // หรือ .WithMany("Comments") ถ้าจะเพิ่ม ICollection<IncidentComment> ใน IncidentReport
                .HasForeignKey(c => c.IncidentReportId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}