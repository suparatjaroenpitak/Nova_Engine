using Microsoft.Extensions.Logging;
using Nova.Application.Abstractions;
using Nova.Domain.Assets;
using Nova.Infrastructure.Persistence;

namespace Nova.Infrastructure.Jobs;

public sealed class AssetImportJobHandler
{
    private readonly AppDbContext _db;
    private readonly IObjectStorage _storage;
    private readonly ILogger<AssetImportJobHandler> _logger;

    public AssetImportJobHandler(AppDbContext db, IObjectStorage storage, ILogger<AssetImportJobHandler> logger)
    {
        _db = db;
        _storage = storage;
        _logger = logger;
    }

    public async Task ProcessAsync(Guid assetId, CancellationToken ct = default)
    {
        var asset = await _db.Assets.FindAsync([assetId], ct);
        if (asset is null)
        {
            _logger.LogWarning("Asset import job: asset {AssetId} not found", assetId);
            return;
        }

        _logger.LogInformation("Processing asset {Name} ({Kind})", asset.Name, asset.Kind);
        asset.ImportMetaJson = "{\"processed\":true,\"timestamp\":\"" + DateTime.UtcNow.ToString("O") + "\"}";
        await _db.SaveChangesAsync(ct);
    }
}
