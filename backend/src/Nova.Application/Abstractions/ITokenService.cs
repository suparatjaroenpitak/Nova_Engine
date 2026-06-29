using Nova.Domain;
using Nova.Domain.Accounts;

namespace Nova.Application.Abstractions;

/// <summary>
/// Issues and validates JWT access tokens and rotating refresh tokens.
/// </summary>
public interface ITokenService
{
    Task<(string accessToken, RefreshTokenIssue refreshToken)> IssueAsync(User user, CancellationToken ct = default);
    Task<(string accessToken, RefreshTokenIssue refreshToken, Guid userId)?> RefreshAsync(string refreshToken, CancellationToken ct = default);
    Task RevokeAsync(string refreshToken, CancellationToken ct = default);
}

public sealed record RefreshTokenIssue(string Token, DateTime ExpiresAtUtc);

public interface IAuditLogger
{
    Task LogAsync(Guid? userId, string action, string? entityType = null, string? entityId = null, string? detail = null, string? ip = null, CancellationToken ct = default);
}
