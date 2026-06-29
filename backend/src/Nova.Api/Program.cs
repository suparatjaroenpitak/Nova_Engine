using System.Text;
using Hangfire;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Nova.Api;
using Nova.Api.Hubs;
using Nova.Api.Middleware;
using Nova.Application;
using Nova.Application.Abstractions;
using Nova.Infrastructure;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Configuration
builder.Configuration.AddEnvironmentVariables();

// Services
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.Section));
builder.Services.Configure<MinioOptions>(builder.Configuration.GetSection(MinioOptions.Section));
builder.Services.Configure<CorsOptions>(builder.Configuration.GetSection(CorsOptions.Section));
builder.Services.Configure<GpuOptions>(builder.Configuration.GetSection(GpuOptions.Section));
builder.Services.Configure<AiOptions>(builder.Configuration.GetSection(AiOptions.Section));
builder.Services.Configure<SeedOptions>(builder.Configuration.GetSection(SeedOptions.Section));
builder.Services.Configure<OAuthOptions>(builder.Configuration.GetSection(OAuthOptions.Section));

// JWT Auth
var jwtSection = builder.Configuration.GetSection(JwtOptions.Section);
var jwtKey = jwtSection["SigningKey"] ?? "dev-only-key-change-me-please-32+chars!!";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSection["Issuer"] ?? "NovaEngine",
        ValidAudience = jwtSection["Audience"] ?? "NovaEditor",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            if (!string.IsNullOrEmpty(accessToken))
                context.Token = accessToken;
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// CORS — support config, env var override, and dynamic Vercel preview domains
var corsSection = builder.Configuration.GetSection(CorsOptions.Section);
var configOrigins = corsSection.Get<CorsOptions>()?.AllowedOrigins ?? [];
var envOrigins = (builder.Configuration["ALLOWED_ORIGINS"] ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
var explicitOrigins = envOrigins.Length > 0 ? envOrigins
    : configOrigins.Length > 0 ? configOrigins
    : ["http://localhost:5173", "http://localhost:4173", "https://nova-engine.vercel.app"];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.SetIsOriginAllowed(origin =>
            explicitOrigins.Contains(origin) ||
            origin.EndsWith(".vercel.app") ||
            origin.EndsWith(".onrender.com") ||
            origin == "https://nova-engine.vercel.app")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

builder.Services.AddControllers();
builder.Services.AddSignalR().AddMessagePackProtocol();
builder.Services.AddHttpContextAccessor();
builder.Services.AddOpenApi();
builder.Services.AddScoped<DataSeeder>();
builder.Services.AddScoped<ISceneBroadcaster, SceneBroadcaster>();

var app = builder.Build();

// Middleware
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<AuditLoggingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.MapControllers();
app.MapHub<SceneHub>("/hubs/scene");
app.MapHub<EditorHub>("/hubs/editor");

// Hangfire dashboard
try { app.UseHangfireDashboard("/jobs"); } catch { }

// Seed admin user (allow app to start even if DB connection fails)
try
{
    using (var scope = app.Services.CreateScope())
    {
        var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
        await seeder.SeedAsync();
    }
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogWarning(ex, "Database seeding failed — app will start without DB. Fix connection string and restart.");
}

app.Run();
