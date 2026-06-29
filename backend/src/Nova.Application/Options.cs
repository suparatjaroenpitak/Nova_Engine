namespace Nova.Application;

public sealed class JwtOptions
{
    public const string Section = "Jwt";
    public string Issuer { get; set; } = "NovaEngine";
    public string Audience { get; set; } = "NovaEditor";
    public string SigningKey { get; set; } = "dev-only-key-change-me-please-32+chars!!";
    public int AccessTokenMinutes { get; set; } = 60;
    public int RefreshTokenDays { get; set; } = 7;
}

public sealed class MinioOptions
{
    public const string Section = "MinIO";
    public string Endpoint { get; set; } = "localhost:9000";
    public string AccessKey { get; set; } = "minio";
    public string SecretKey { get; set; } = "minio12345";
    public string Bucket { get; set; } = "nova-assets";
    public bool Secure { get; set; }
}

public sealed class CorsOptions
{
    public const string Section = "Cors";
    public string[] AllowedOrigins { get; set; } = Array.Empty<string>();
}

public sealed class GpuOptions
{
    public const string Section = "Gpu";
    /// <summary>"LocalStub" | "Colab" | ...</summary>
    public string Provider { get; set; } = "LocalStub";
    public string ServiceUrl { get; set; } = "http://localhost:8000";
}

public sealed class AiOptions
{
    public const string Section = "Ai";
    /// <summary>"LocalStub" | "OpenAi" | ...</summary>
    public string Provider { get; set; } = "LocalStub";
    public string? OpenAiApiKey { get; set; }
}

public sealed class SeedOptions
{
    public const string Section = "Seed";
    public bool CreateAdmin { get; set; } = true;
    public string AdminEmail { get; set; } = "admin@nova.local";
    public string AdminPassword { get; set; } = "Admin#123";
}

public sealed class OAuthOptions
{
    public const string Section = "OAuth";
    public GoogleOAuth Google { get; set; } = new();
    public GitHubOAuth GitHub { get; set; } = new();
}

public sealed class GoogleOAuth
{
    public string? ClientId { get; set; }
    public string? ClientSecret { get; set; }
}

public sealed class GitHubOAuth
{
    public string? ClientId { get; set; }
    public string? ClientSecret { get; set; }
}
