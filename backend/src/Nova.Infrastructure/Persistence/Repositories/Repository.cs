using Microsoft.EntityFrameworkCore;
using Nova.Application.Abstractions;
using Nova.Infrastructure.Persistence;

namespace Nova.Infrastructure.Persistence.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly AppDbContext Db;
    protected readonly DbSet<T> Set;

    public Repository(AppDbContext db)
    {
        Db = db;
        Set = db.Set<T>();
    }

    public virtual async Task<T?> GetAsync(Guid id, CancellationToken ct = default) =>
        await Set.FindAsync([id], ct);

    public virtual async Task<IReadOnlyList<T>> ListAsync(CancellationToken ct = default) =>
        await Set.ToListAsync(ct);

    public virtual async Task<T> AddAsync(T entity, CancellationToken ct = default)
    {
        var entry = await Set.AddAsync(entity, ct);
        return entry.Entity;
    }

    public virtual void Update(T entity) => Set.Update(entity);

    public virtual void Remove(T entity) => Set.Remove(entity);

    public virtual async Task<int> SaveChangesAsync(CancellationToken ct = default) =>
        await Db.SaveChangesAsync(ct);
}
