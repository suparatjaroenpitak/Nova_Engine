using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Nova.Application;
using Nova.Application.Abstractions;
using Nova.Domain;
using Nova.Domain.Accounts;
using Nova.Domain.Projects;
using Nova.Domain.Scenes;
using Nova.Infrastructure.Persistence;

namespace Nova.Api;

public sealed class DataSeeder
{
    private readonly AppDbContext _db;
    private readonly SeedOptions _seed;
    private readonly IPasswordHasher _hasher;
    private readonly ILogger<DataSeeder> _logger;

    public DataSeeder(AppDbContext db, IOptions<SeedOptions> seed, IPasswordHasher hasher, ILogger<DataSeeder> logger)
    {
        _db = db;
        _seed = seed.Value;
        _hasher = hasher;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        await _db.Database.MigrateAsync();

        if (_seed.CreateAdmin)
        {
            if (!await _db.Users.AnyAsync(u => u.Email == _seed.AdminEmail))
            {
                var admin = new User
                {
                    Email = _seed.AdminEmail,
                    DisplayName = "Admin",
                    PasswordHash = _hasher.Hash(_seed.AdminPassword),
                    Role = UserRole.Admin,
                    EmailVerified = true
                };
                _db.Users.Add(admin);

                var sampleProject = new Project
                {
                    Name = "Sample Project",
                    Description = "Auto-generated sample project",
                    OwnerId = admin.Id,
                    Is3D = true,
                    RenderPipeline = "URP"
                };
                _db.Projects.Add(sampleProject);

                var sampleScene = new Scene
                {
                    Name = "Main Scene",
                    ProjectId = sampleProject.Id,
                    IsMain = true,
                    SettingsJson = "{\"ambientColor\":{\"r\":0.2,\"g\":0.2,\"b\":0.3,\"a\":1},\"fog\":{\"enabled\":false}}"
                };
                _db.Scenes.Add(sampleScene);

                await _db.SaveChangesAsync();
                _logger.LogInformation("Seeded admin user ({Email}) and sample project", _seed.AdminEmail);
            }
        }
    }
}
