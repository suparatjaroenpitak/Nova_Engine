using Microsoft.EntityFrameworkCore;
using Nova.Application.Abstractions;
using Nova.Domain.Projects;

namespace Nova.Infrastructure.Persistence.Repositories;

public sealed class ProjectRepository : Repository<Project>, IProjectRepository
{
    public ProjectRepository(AppDbContext db) : base(db) { }

    public async Task<IReadOnlyList<Project>> ListForUserAsync(Guid userId, CancellationToken ct = default) =>
        await Set.Where(p => p.OwnerId == userId || p.Members.Any(m => m.UserId == userId)).ToListAsync(ct);

    public async Task<Project?> GetWithScenesAsync(Guid id, CancellationToken ct = default) =>
        await Set.Include(p => p.Scenes).FirstOrDefaultAsync(p => p.Id == id, ct);
}
