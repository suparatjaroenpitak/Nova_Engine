using Ardalis.GuardClauses;

namespace Nova.Domain.Common;

/// <summary>
/// Base for all entities. Uses GUID keys (good for distributed / offline-friendly ids)
/// and tracks audit timestamps.
/// </summary>
public abstract class Entity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Soft-delete mixin. Soft-deleted rows are filtered by the EF query filters
/// configured in <c>AppDbContext</c>.
/// </summary>
public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
    DateTime? DeletedAtUtc { get; set; }
}
