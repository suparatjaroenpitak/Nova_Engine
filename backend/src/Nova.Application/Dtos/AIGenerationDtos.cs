namespace Nova.Application.Dtos;

public sealed record AIGenerationRequestDto(
    string Mode,          // "text-to-3d" | "image-to-3d"
    string Model,         // "trellis" | "hunyuan3d" | "stable-fast-3d" | "triposr" | "instantmesh"
    string? Prompt,
    string? ImageUrl,
    string? ReferenceModelUrl,
    AIGenerationOptionsDto Options);

public sealed record AIGenerationOptionsDto(
    int Resolution = 1024,
    int PolyCount = 50000,
    bool GenerateTexture = true,
    bool GenerateMaterial = true,
    bool GenerateLOD = true,
    bool UvUnwrap = true,
    bool OptimizeMesh = true,
    bool Symmetric = false,
    string? StylePreset = null);

public sealed record AIGenerationJobDto(
    Guid Id,
    Guid ProjectId,
    string Mode,
    string Model,
    string Status,
    int Progress,
    string? Prompt,
    string? ImageUrl,
    string? Error,
    AIGenerationResultDto? Result,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record AIGenerationResultDto(
    string ModelUrl,
    string ThumbnailUrl,
    string MeshUrl,
    string? TextureUrl,
    string? MaterialUrl,
    AIGenerationMetadataDto Metadata);

public sealed record AIGenerationMetadataDto(
    int VertexCount,
    int FaceCount,
    int TextureCount,
    int LodCount,
    string Format,
    long GenerationTimeMs,
    string ModelUsed);

public sealed record SubmitAIGenerationRequest(
    Guid ProjectId,
    AIGenerationRequestDto Request);

public sealed record AIModelInfoDto(
    string Id,
    string Name,
    string Description,
    string Icon,
    string[] Capabilities,
    string[] SupportedFormats,
    int MaxResolution);

public sealed record ColabStatusDto(
    bool Connected,
    bool ModelLoaded,
    string Gpu,
    double MemoryUsage,
    double Uptime);
