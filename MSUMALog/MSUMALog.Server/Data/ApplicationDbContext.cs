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
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
        public DbSet<IncidentAttachment> IncidentAttachments { get; set; } = null!;

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

                // AuthorUser FK -> User.Id (restrict delete)
                b.HasOne(c => c.AuthorUser)
                    .WithMany()
                    .HasForeignKey(c => c.AuthorUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                // CreatedUser FK -> User.Id (restrict delete)
                b.HasOne(c => c.CreatedUser)
                    .WithMany()
                    .HasForeignKey(c => c.CreatedUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                // UpdatedUser FK -> User.Id (restrict delete)
                b.HasOne(c => c.UpdatedUser)
                    .WithMany()
                    .HasForeignKey(c => c.UpdatedUserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure CreatedUserId and UpdatedUserId as FKs to User.Id for IncidentReport
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

            // Configure IncidentAttachment
            modelBuilder.Entity<IncidentAttachment>(b =>
            {
                b.HasIndex(a => a.IncidentId);

                b.Property(a => a.Kind)
                 .HasConversion<string>()
                 .HasMaxLength(50)
                 .IsRequired();

                b.Property(a => a.StorageKey).HasMaxLength(512);
                b.Property(a => a.RelativePath).HasMaxLength(512);
                b.Property(a => a.PhysicalPath).HasMaxLength(1024);
                b.Property(a => a.FileName).HasMaxLength(260);
                b.Property(a => a.ContentType).HasMaxLength(100);
                b.Property(a => a.ExternalUrl).HasMaxLength(2048);
                b.Property(a => a.Description).HasMaxLength(1000);

                b.Property(a => a.SizeBytes).HasColumnType("bigint");
                b.Property(a => a.IsExternal).HasColumnType("bit");
                b.Property(a => a.CreatedUtc).HasColumnType("datetime2");
                b.Property(a => a.UpdatedUtc).HasColumnType("datetime2");
                b.Property(a => a.RowVersion).IsRowVersion();
            });

            // New User configuration
            modelBuilder.Entity<User>(b =>
            {
                b.Property(u => u.FirstName).HasMaxLength(100);
                b.Property(u => u.LastName).HasMaxLength(100);
                b.Property(u => u.Email).HasMaxLength(256).IsRequired();
                b.Property(u => u.Role).IsRequired();
                b.Property(u => u.PhoneNumber).HasMaxLength(15);
                b.Property(u => u.LineID).HasMaxLength(100);
                b.Property(u => u.OrganizationInfo).HasMaxLength(500);
                b.Property(u => u.ReceiveNotifications).HasDefaultValue(false);
            });
        }
    }
}