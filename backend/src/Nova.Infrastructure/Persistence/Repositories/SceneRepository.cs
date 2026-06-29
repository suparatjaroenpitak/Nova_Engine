using Microsoft.EntityFrameworkCore;
using Nova.Application.Abstractions;
using Nova.Domain.Scenes;

namespace Nova.Infrastructure.Persistence.Repositories;

public sealed class SceneRepository : Repository<Scene>, ISceneRepository
{
    public SceneRepository(AppDbContext db) : base(db) { }

    public async Task<Scene?> GetWithGameObjectsAsync(Guid id, CancellationToken ct = default) =>
        await Set.Include(s => s.GameObjects).ThenInclude(g => g.Children)
                 .Include(s => s.GameObjects).ThenInclude(g => g.Components)
                 .FirstOrDefaultAsync(s => s.Id == id, ct);
}
