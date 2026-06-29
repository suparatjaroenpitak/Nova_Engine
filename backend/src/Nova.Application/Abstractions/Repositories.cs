using Nova.Domain;
using Nova.Domain.Accounts;
using Nova.Domain.Assets;
using Nova.Domain.Jobs;
using Nova.Domain.Packages;
using Nova.Domain.Projects;
using Nova.Domain.Scenes;
using Nova.Domain.Scripts;

namespace Nova.Application.Abstractions;

/// <summary>
/// A read/write repository over an aggregate. Intentionally minimal — we use
/// specification-free LINQ at the handler layer to keep things transparent.
/// </summary>
public interface IRepository<T> where T : class
{
    Task<T?> GetAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<T>> ListAsync(CancellationToken ct = default);
    Task<T> AddAsync(T entity, CancellationToken ct = default);
    void Update(T entity);
    void Remove(T entity);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

public interface IUserRepository : IRepository<User> {
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<IReadOnlyList<User>> GetByProviderAsync(string provider, string providerUserId, CancellationToken ct = default);
}

public interface IProjectRepository : IRepository<Project> {
    Task<IReadOnlyList<Project>> ListForUserAsync(Guid userId, CancellationToken ct = default);
    Task<Project?> GetWithScenesAsync(Guid id, CancellationToken ct = default);
}

public interface ISceneRepository : IRepository<Scene> {
    Task<Scene?> GetWithGameObjectsAsync(Guid id, CancellationToken ct = default);
}

public interface IGameObjectRepository : IRepository<GameObject> { }

public interface IComponentRepository : IRepository<GameObjects.GameComponent> { }

public interface IAssetRepository : IRepository<Asset> {
    Task<IReadOnlyList<Asset>> ListForProjectAsync(Guid projectId, CancellationToken ct = default);
}

public interface IScriptRepository : IRepository<Script> {
    Task<IReadOnlyList<Script>> ListForProjectAsync(Guid projectId, CancellationToken ct = default);
}

public interface IPackageRepository : IRepository<Package> { }

public interface IGpuJobRepository : IRepository<GpuJob> {
    Task<IReadOnlyList<GpuJob>> ListForProjectAsync(Guid projectId, CancellationToken ct = default);
}
