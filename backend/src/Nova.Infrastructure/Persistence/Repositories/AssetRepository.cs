using Microsoft.EntityFrameworkCore;
using Nova.Application.Abstractions;
using Nova.Domain.Assets;

namespace Nova.Infrastructure.Persistence.Repositories;

public sealed class AssetRepository : Repository<Asset>, IAssetRepository
{
    public AssetRepository(AppDbContext db) : base(db) { }

    public async Task<IReadOnlyList<Asset>> ListForProjectAsync(Guid projectId, CancellationToken ct = default) =>
        await Set.Where(a => a.ProjectId == projectId).OrderBy(a => a.Path).ToListAsync(ct);
}
