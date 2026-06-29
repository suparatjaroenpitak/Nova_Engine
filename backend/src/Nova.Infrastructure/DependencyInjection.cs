using Amazon.S3;
using Hangfire;
using Hangfire.PostgreSql;
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
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(config.GetConnectionString("Postgres")!,
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
}
