using Nova.Domain.Common;

namespace Nova.Domain.Accounts;

/// <summary>
/// A Nova Engine account. Owns projects and is the actor behind audit logs.
/// </summary>
public sealed class User : Entity, ISoftDeletable
{
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>BCrypt hash. Null for pure-OAuth users that always log in via Google/GitHub.</summary>
    public string? PasswordHash { get; set; }

    public UserRole Role { get; set; } = UserRole.User;
    public string? AvatarUrl { get; set; }

    /// <summary>OAuth linkages. Empty for password-only users.</summary>
    public List<ExternalLogin> ExternalLogins { get; set; } = new();

    /// <summary>Long-lived refresh tokens (hashed) issued to this user.</summary>
    public List<RefreshToken> RefreshTokens { get; set; } = new();

    public bool EmailVerified { get; set; }
    public bool IsActive { get; set; } = true;

    // ISoftDeletable
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
}

public sealed class ExternalLogin : Entity
{
    public Guid UserId { get; set; }
    public User? User { get; set; }

    /// <summary>"Google" | "GitHub".</summary>
    public string Provider { get; set; } = string.Empty;

    /// <summary>Stable id returned by the provider.</summary>
    public string ProviderUserId { get; set; } = string.Empty;

    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
}

public sealed class RefreshToken : Entity
{
    public Guid UserId { get; set; }
    public User? User { get; set; }

    /// <summary>SHA-256 hash of the token presented by the client.</summary>
    public string TokenHash { get; set; } = string.Empty;

    public DateTime ExpiresAtUtc { get; set; }
    public DateTime? RevokedAtUtc { get; set; }
    public string? ReplacedByTokenHash { get; set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAtUtc;
    public bool IsRevoked => RevokedAtUtc is not null;
    public bool IsActive => !IsExpired && !IsRevoked;
}

public sealed class AuditLog : Entity
{
    public Guid? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? Detail { get; set; }
    public string? IpAddress { get; set; }
}
