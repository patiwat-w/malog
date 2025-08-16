using Microsoft.EntityFrameworkCore;
using MSUMALog.Server.Models;

namespace MSUMALog.Server.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<IncidentReport> IncidentReports => Set<IncidentReport>();
        public DbSet<IncidentComment> IncidentComments => Set<IncidentComment>();
        public DbSet<User> Users { get; set; }

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

            // Configure CreatedUserId and UpdatedUserId as FKs to User.Id
            modelBuilder.Entity<IncidentReport>(b =>
            {
                b.HasOne(ir => ir.CreatedUser)
                 .WithMany()
                 .HasForeignKey(ir => ir.CreatedUserId)
                 .OnDelete(DeleteBehavior.Restrict);

                b.HasOne(ir => ir.UpdatedUser)
                 .WithMany()
                 .HasForeignKey(ir => ir.UpdatedUserId)
                 .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}