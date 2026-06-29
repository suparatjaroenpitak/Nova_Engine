using Nova.Application.Abstractions;
using Nova.Domain.Accounts;
using Nova.Infrastructure.Persistence;

namespace Nova.Infrastructure.Authentication;

public sealed class AuditLogger : IAuditLogger
{
    private readonly AppDbContext _db;

    public AuditLogger(AppDbContext db) => _db = db;

    public async Task LogAsync(Guid? userId, string action, string? entityType = null, string? entityId = null, string? detail = null, string? ip = null, CancellationToken ct = default)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Detail = detail,
            IpAddress = ip
        });
        await _db.SaveChangesAsync(ct);
    }
}
