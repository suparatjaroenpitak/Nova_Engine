using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Nova.Application.Abstractions;

namespace Nova.Infrastructure.Cache;

public sealed class RedisCache : ICache
{
    private readonly IDistributedCache _cache;

    public RedisCache(IDistributedCache cache) => _cache = cache;

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        var bytes = await _cache.GetAsync(key, ct);
        return bytes is null ? default : JsonSerializer.Deserialize<T>(bytes);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? ttl = null, CancellationToken ct = default)
    {
        var bytes = JsonSerializer.SerializeToUtf8Bytes(value);
        if (ttl.HasValue)
            await _cache.SetAsync(key, bytes, new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = ttl }, ct);
        else
            await _cache.SetAsync(key, bytes, ct);
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default) =>
        await _cache.RemoveAsync(key, ct);
}
