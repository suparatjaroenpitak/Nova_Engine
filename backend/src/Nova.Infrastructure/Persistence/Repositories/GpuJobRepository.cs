using Microsoft.EntityFrameworkCore;
using Nova.Application.Abstractions;
using Nova.Domain.Jobs;

namespace Nova.Infrastructure.Persistence.Repositories;

public sealed class GpuJobRepository : Repository<GpuJob>, IGpuJobRepository
{
    public GpuJobRepository(AppDbContext db) : base(db) { }

    public async Task<IReadOnlyList<GpuJob>> ListForProjectAsync(Guid projectId, CancellationToken ct = default) =>
        await Set.Where(j => j.ProjectId == projectId).OrderByDescending(j => j.CreatedAtUtc).ToListAsync(ct);
}
