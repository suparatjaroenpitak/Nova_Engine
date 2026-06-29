using Amazon.S3;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Nova.Application;
using Nova.Application.Abstractions;
using Nova.Infrastructure.Ai;
using Nova.Infrastructure.Authentication;
using Nova.Infrastructure.Cache;
using Nova.Infrastructure.Export;
using Nova.Infrastructure.Gpu;
using Nova.Infrastructure.Jobs;
using Nova.Infrastructure.Persistence;
using Nova.Infrastructure.Persistence.Repositories;
using Nova.Infrastructure.Scripting;
using Nova.Infrastructure.Storage;

namespace Nova.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        // EF Core + PostgreSQL
        var connStr = SanitizeConnectionString(config.GetConnectionString("Postgres")!);
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connStr,
                npg => npg.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

        // Repositories
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IProjectRepository, ProjectRepository>();
        services.AddScoped<ISceneRepository, SceneRepository>();
        services.AddScoped<IAssetRepository, AssetRepository>();
        services.AddScoped<IScriptRepository, ScriptRepository>();
        services.AddScoped<IGpuJobRepository, GpuJobRepository>();
        services.AddScoped<IRepository<Domain.Scenes.GameObject>, Repository<Domain.Scenes.GameObject>>();
        services.AddScoped<IRepository<Domain.GameObjects.GameComponent>, Repository<Domain.GameObjects.GameComponent>>();

        // Auth
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IAuditLogger, AuditLogger>();

        // Cache
        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = config.GetConnectionString("Redis");
            options.InstanceName = "Nova";
        });
        services.AddScoped<ICache, RedisCache>();

        // Object storage (MinIO / S3)
        services.AddSingleton<IAmazonS3>(sp =>
        {
            var opts = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<MinioOptions>>().Value;
            var s3Config = new AmazonS3Config
            {
                ServiceURL = $"{(opts.Secure ? "https" : "http")}://{opts.Endpoint}",
                ForcePathStyle = true,
                UseHttp = !opts.Secure
            };
            return new AmazonS3Client(opts.AccessKey, opts.SecretKey, s3Config);
        });
        services.AddScoped<IObjectStorage, MinioObjectStorage>();

        // Scripting
        services.AddScoped<IScriptingService, RoslynScriptingService>();

        // GPU compute
        services.AddScoped<IGpuComputeService, LocalStubGpuComputeService>();

        // AI agents
        services.AddScoped<IAiAgent, LocalAiAgent>();
        services.AddScoped<IAiAgentRegistry, LocalAiAgentRegistry>();

        // Export
        services.AddScoped<IExporter, LocalWebExporter>();

        // Hangfire (InMemory for Render compatibility — swap to PostgreSQL for production VPS)
        services.AddHangfire(h => h.UseInMemoryStorage());
        services.AddHangfireServer();

        // Background job handlers
        services.AddScoped<AssetImportJobHandler>();

        return services;
    }

    private static string SanitizeConnectionString(string connStr)
    {
        // Convert URL format (postgresql://user:pass@host/db?sslmode=require)
        // to key=value format (Host=...;Database=...;Username=...) for Npgsql
        if (connStr.StartsWith("postgresql://") || connStr.StartsWith("postgres://"))
        {
            try
            {
                var uri = new Uri(connStr);
                var parts = new List<string>();
                parts.Add($"Host={uri.Host}");
                if (uri.Port > 0) parts.Add($"Port={uri.Port}");
                parts.Add($"Database={uri.AbsolutePath.TrimStart('/')}");
                if (!string.IsNullOrEmpty(uri.UserInfo))
                {
                    var ui = uri.UserInfo.Split(':');
                    parts.Add($"Username={ui[0]}");
                    if (ui.Length > 1) parts.Add($"Password={ui[1]}");
                }
                var query = uri.Query.TrimStart('?');
                if (!string.IsNullOrEmpty(query))
                {
                    foreach (var pair in query.Split('&', StringSplitOptions.RemoveEmptyEntries))
                    {
                        var kv = pair.Split('=', 2);
                        if (kv.Length == 2)
                            parts.Add($"{kv[0]}={kv[1]}");
                    }
                }
                if (!parts.Any(p => p.StartsWith("sslmode", StringComparison.OrdinalIgnoreCase)))
                    parts.Add("sslmode=require");
                return string.Join(';', parts);
            }
            catch
            {
                // fallback to original if parsing fails
            }
        }
        return connStr;
    }
}
