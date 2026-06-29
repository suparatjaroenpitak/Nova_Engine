using Nova.Domain;

namespace Nova.Application.Abstractions;

// ============================================================================
//  Cross-cutting service abstractions.
// ============================================================================

/// <summary>
/// Object storage (MinIO / S3) for asset binaries and generated artifacts.
/// </summary>
public interface IObjectStorage
{
    /// <summary>Uploads a stream and returns the generated storage key.</summary>
    Task<string> UploadAsync(string bucket, string objectName, Stream content, string contentType, CancellationToken ct = default);

    Task<Stream?> DownloadAsync(string bucket, string objectName, CancellationToken ct = default);
    Task DeleteAsync(string bucket, string objectName, CancellationToken ct = default);

    /// <summary>Creates the bucket if it does not exist.</summary>
    Task EnsureBucketAsync(string bucket, CancellationToken ct = default);

    /// <summary>Presigned GET url valid for <paramref name="ttl"/>.</summary>
    Task<string> PresignedGetAsync(string bucket, string objectName, TimeSpan ttl, CancellationToken ct = default);
}

/// <summary>
/// Abstraction over the SignalR scene hub so the Application layer can broadcast
/// realtime deltas without depending on Microsoft.AspNetCore.SignalR directly.
/// </summary>
public interface ISceneBroadcaster
{
    Task BroadcastAsync(Guid sceneId, string eventType, object payload, CancellationToken ct = default);
    Task NotifyUserAsync(Guid userId, string eventType, object payload, CancellationToken ct = default);
}

/// <summary>
/// Distributed cache wrapper (Redis in production, in-memory in tests).
/// </summary>
public interface ICache
{
    Task<T?> GetAsync<T>(string key, CancellationToken ct = default);
    Task SetAsync<T>(string key, T value, TimeSpan? ttl = null, CancellationToken ct = default);
    Task RemoveAsync(string key, CancellationToken ct = default);
}

/// <summary>
/// Password hashing abstraction (BCrypt by default).
/// </summary>
public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}

public interface ICurrentUserService
{
    Guid? UserId { get; }
    UserRole? Role { get; }
    bool IsAuthenticated { get; }
}
