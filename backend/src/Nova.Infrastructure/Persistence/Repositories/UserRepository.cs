using Microsoft.EntityFrameworkCore;
using Nova.Application.Abstractions;
using Nova.Domain.Accounts;

namespace Nova.Infrastructure.Persistence.Repositories;

public sealed class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(AppDbContext db) : base(db) { }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default) =>
        await Set.FirstOrDefaultAsync(u => u.Email == email, ct);

    public async Task<IReadOnlyList<User>> GetByProviderAsync(string provider, string providerUserId, CancellationToken ct = default) =>
        await Set.Where(u => u.ExternalLogins.Any(e => e.Provider == provider && e.ProviderUserId == providerUserId)).ToListAsync(ct);
}
