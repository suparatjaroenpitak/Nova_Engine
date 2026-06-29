using Microsoft.EntityFrameworkCore;
using Nova.Application.Abstractions;
using Nova.Domain.Scripts;

namespace Nova.Infrastructure.Persistence.Repositories;

public sealed class ScriptRepository : Repository<Script>, IScriptRepository
{
    public ScriptRepository(AppDbContext db) : base(db) { }

    public async Task<IReadOnlyList<Script>> ListForProjectAsync(Guid projectId, CancellationToken ct = default) =>
        await Set.Where(s => s.ProjectId == projectId).OrderBy(s => s.Name).ToListAsync(ct);
}
