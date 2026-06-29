using Microsoft.EntityFrameworkCore;

using Nova.Domain;
using Nova.Domain.Accounts;
using Nova.Domain.Assets;
using Nova.Domain.Common;
using Nova.Domain.GameObjects;
using Nova.Domain.Jobs;
using Nova.Domain.Packages;
using Nova.Domain.Projects;
using Nova.Domain.Scenes;
using Nova.Domain.Scripts;

namespace Nova.Infrastructure.Persistence;

/// <summary>
/// EF Core DbContext for Nova Engine. Owns all aggregate roots and applies
/// audit + soft-delete conventions centrally.
/// </summary>
public sealed class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<ExternalLogin> ExternalLogins => Set<ExternalLogin>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();

    public DbSet<Scene> Scenes => Set<Scene>();
    public DbSet<GameObject> GameObjects => Set<GameObject>();
    public DbSet<GameComponent> Components => Set<GameComponent>();

    public DbSet<Asset> Assets => Set<Asset>();
    public DbSet<AssetImportJob> AssetImportJobs => Set<AssetImportJob>();

    public DbSet<Script> Scripts => Set<Script>();
    public DbSet<ScriptVersion> ScriptVersions => Set<ScriptVersion>();

    public DbSet<Package> Packages => Set<Package>();
    public DbSet<RegistryPackage> RegistryPackages => Set<RegistryPackage>();

    public DbSet<GpuJob> GpuJobs => Set<GpuJob>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        // PostgreSQL-specific conventions: store vectors as jsonb, enums as text.
        b.HasPostgresExtension("citext");

        // ---- Users / identity ----
        b.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Email).HasColumnType("citext");
            e.Property(u => u.Role).HasConversion<string>();
            e.HasQueryFilter(u => !u.IsDeleted);
        });
        b.Entity<ExternalLogin>(e =>
        {
            e.HasIndex(x => new { x.Provider, x.ProviderUserId }).IsUnique();
            e.HasOne(x => x.User).WithMany(u => u.ExternalLogins)
             .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });
        b.Entity<RefreshToken>(e =>
        {
            e.HasIndex(x => x.TokenHash).IsUnique();
            e.HasOne(x => x.User).WithMany(u => u.RefreshTokens)
             .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });
        b.Entity<AuditLog>().Property(x => x.CreatedAtUtc).HasDefaultValueSql("now() at time zone 'utc'");

        // ---- Projects ----
        b.Entity<Project>(e =>
        {
            e.HasIndex(p => new { p.OwnerId, p.Name });
            e.HasQueryFilter(p => !p.IsDeleted);
            e.HasOne(p => p.Owner).WithMany().HasForeignKey(p => p.OwnerId).OnDelete(DeleteBehavior.Restrict);
        });
        b.Entity<ProjectMember>(e =>
        {
            e.HasIndex(x => new { x.ProjectId, x.UserId }).IsUnique();
            e.HasOne(x => x.Project).WithMany(p => p.Members).HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Cascade);
        });

        // ---- Scenes / GameObjects / Components ----
        b.Entity<Scene>(e =>
        {
            e.HasOne(s => s.Project).WithMany(p => p.Scenes).HasForeignKey(s => s.ProjectId).OnDelete(DeleteBehavior.Cascade);
            e.HasQueryFilter(s => !s.IsDeleted);
            e.Property(s => s.SettingsJson).HasColumnType("jsonb");
        });
        b.Entity<GameObject>(e =>
        {
            e.HasOne(g => g.Scene).WithMany(s => s.GameObjects).HasForeignKey(g => g.SceneId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(g => g.Parent).WithMany(g => g.Children).HasForeignKey(g => g.ParentId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(g => new { g.SceneId, g.ParentId, g.SiblingIndex });
            e.OwnsOne(g => g.Transform, t =>
            {
                t.OwnsOne(tr => tr.Position).Property("X").HasColumnName("PosX");
                t.OwnsOne(tr => tr.Position).Property("Y").HasColumnName("PosY");
                t.OwnsOne(tr => tr.Position).Property("Z").HasColumnName("PosZ");
                t.OwnsOne(tr => tr.Rotation).Property("X").HasColumnName("RotX");
                t.OwnsOne(tr => tr.Rotation).Property("Y").HasColumnName("RotY");
                t.OwnsOne(tr => tr.Rotation).Property("Z").HasColumnName("RotZ");
                t.OwnsOne(tr => tr.Rotation).Property("W").HasColumnName("RotW");
                t.OwnsOne(tr => tr.Scale).Property("X").HasColumnName("SclX");
                t.OwnsOne(tr => tr.Scale).Property("Y").HasColumnName("SclY");
                t.OwnsOne(tr => tr.Scale).Property("Z").HasColumnName("SclZ");
            });
        });
        b.Entity<GameComponent>(e =>
        {
            e.HasOne(c => c.GameObject).WithMany(g => g.Components).HasForeignKey(c => c.GameObjectId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(c => new { c.GameObjectId, c.Order });
            e.Property(c => c.Kind).HasMaxLength(64);
            e.Property(c => c.PropertiesJson).HasColumnType("jsonb");
        });

        // ---- Assets ----
        b.Entity<Asset>(e =>
        {
            e.HasOne(a => a.Project).WithMany(p => p.Assets).HasForeignKey(a => a.ProjectId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(a => new { a.ProjectId, a.Path }).IsUnique();
            e.HasQueryFilter(a => !a.IsDeleted);
            e.Property(a => a.Kind).HasConversion<string>();
            e.Property(a => a.ImportMetaJson).HasColumnType("jsonb");
        });
        b.Entity<AssetImportJob>(e =>
        {
            e.HasOne(j => j.Asset).WithMany().HasForeignKey(j => j.AssetId).OnDelete(DeleteBehavior.Cascade);
            e.Property(j => j.Status).HasConversion<string>();
        });

        // ---- Scripts ----
        b.Entity<Script>(e =>
        {
            e.HasOne(s => s.Project).WithMany(p => p.Scripts).HasForeignKey(s => s.ProjectId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(s => new { s.ProjectId, s.Name }).IsUnique();
            e.HasQueryFilter(s => !s.IsDeleted);
            e.Property(s => s.Language).HasConversion<string>();
        });
        b.Entity<ScriptVersion>(e =>
        {
            e.HasOne(v => v.Script).WithMany(s => s.Versions).HasForeignKey(v => v.ScriptId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(v => new { v.ScriptId, v.Version }).IsUnique();
            e.Property(v => v.DiagnosticsJson).HasColumnType("jsonb");
        });

        // ---- Packages ----
        b.Entity<Package>(e =>
        {
            e.HasOne(p => p.Project).WithMany(p => p.Packages).HasForeignKey(p => p.ProjectId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(p => new { p.ProjectId, p.Name }).IsUnique();
        });
        b.Entity<RegistryPackage>(e =>
        {
            e.HasIndex(r => r.Slug).IsUnique();
            e.Property(r => r.Tags).HasColumnType("jsonb");
            ConfigureTags(e);
            e.HasQueryFilter(r => !r.IsDeleted);
        });

        // ---- GPU jobs ----
        b.Entity<GpuJob>(e =>
        {
            e.HasIndex(j => new { j.ProjectId, j.Status });
            e.HasIndex(j => j.Status);
            e.Property(j => j.Type).HasConversion<string>();
            e.Property(j => j.Status).HasConversion<string>();
            e.Property(j => j.PayloadJson).HasColumnType("jsonb");
            e.Property(j => j.ResultJson).HasColumnType("jsonb");
        });

        // Central audit timestamp convention.
        foreach (var entityType in b.Model.GetEntityTypes())
        {
            if (typeof(Entity).IsAssignableFrom(entityType.ClrType))
            {
                var updated = entityType.FindProperty(nameof(Entity.UpdatedAtUtc));
                updated?.SetAfterSaveBehavior(Microsoft.EntityFrameworkCore.Metadata.PropertySaveBehavior.Save);
            }
        }

        static void ConfigureTags(Microsoft.EntityFrameworkCore.Metadata.Builders.EntityTypeBuilder<RegistryPackage> e) =>
            e.Property(r => r.Tags).HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Type?)null!),
                v => System.Text.Json.JsonSerializer.Deserialize<List<string>>(v) ?? new());
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        UpdateAudit();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken ct = default)
    {
        UpdateAudit();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, ct);
    }

    /// <summary>Stamps UpdatedAtUtc and soft-delete DeletedAtUtc automatically.</summary>
    private void UpdateAudit()
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is Entity e && entry.State is EntityState.Modified or EntityState.Added)
                e.UpdatedAtUtc = DateTime.UtcNow;

            if (entry.Entity is ISoftDeletable sd && entry.State == EntityState.Deleted)
            {
                entry.State = EntityState.Modified;
                sd.IsDeleted = true;
                sd.DeletedAtUtc = DateTime.UtcNow;
            }
        }
    }
}
