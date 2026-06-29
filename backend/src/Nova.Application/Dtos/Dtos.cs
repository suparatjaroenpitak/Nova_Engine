using Nova.Domain;

namespace Nova.Application.Dtos;

// ---- Auth ----
public sealed record RegisterRequest(string Email, string Password, string? DisplayName);
public sealed record LoginRequest(string Email, string Password);
public sealed record AuthResponse(string AccessToken, string RefreshToken, UserDto User);
public sealed record RefreshRequest(string RefreshToken);

public sealed record UserDto(Guid Id, string Email, string DisplayName, string Role, string? AvatarUrl);

// ---- Projects ----
public sealed record CreateProjectRequest(string Name, string? Description, bool Is3D = true, string RenderPipeline = "URP");
public sealed record UpdateProjectRequest(string Name, string? Description);
public sealed record ProjectDto(Guid Id, string Name, string? Description, Guid OwnerId, string Visibility, string RenderPipeline, bool Is3D, DateTime CreatedAtUtc, int SceneCount);

// ---- Scenes ----
public sealed record CreateSceneRequest(Guid ProjectId, string Name);
public sealed record UpdateSceneRequest(string Name, string? SettingsJson);
public sealed record SceneDto(Guid Id, Guid ProjectId, string Name, bool IsMain, string SettingsJson, int GameObjectCount);

// ---- GameObjects ----
public sealed record CreateGameObjectRequest(Guid SceneId, string Name, Guid? ParentId = null);
public sealed record UpdateTransformDto(double Px, double Py, double Pz, double Rx, double Ry, double Rz, double Rw, double Sx, double Sy, double Sz);
public sealed record GameObjectDto(Guid Id, Guid SceneId, Guid? ParentId, string Name, bool IsActive, int Layer, string? Tag, int SiblingIndex, UpdateTransformDto Transform, List<ComponentDto> Components, List<GameObjectDto> Children);

// ---- Components ----
public sealed record AddComponentRequest(Guid GameObjectId, string Kind, string PropertiesJson = "{}");
public sealed record UpdateComponentRequest(string Kind, string PropertiesJson);
public sealed record ComponentDto(Guid Id, Guid GameObjectId, string Kind, bool Enabled, string PropertiesJson, int Order);

// ---- Assets ----
public sealed record AssetDto(Guid Id, Guid ProjectId, string Name, string Path, string Kind, string ContentType, long SizeBytes, string? PreviewUrl, DateTime CreatedAtUtc);

// ---- Scripts ----
public sealed record CreateScriptRequest(Guid ProjectId, string Name, string? ClassName, string? Source = null);
public sealed record UpdateScriptSourceRequest(string Source);
public sealed record CompileScriptRequest(string Source, string? ClassName);
public sealed record ScriptDto(Guid Id, Guid ProjectId, string Name, string ClassName, string CurrentSource, int CurrentVersion, bool Compiles, int ErrorCount, int WarningCount, DateTime UpdatedAtUtc);
public sealed record CompileResultDto(bool Success, List<CompileDiagnosticDto> Diagnostics);
public sealed record CompileDiagnosticDto(string Severity, string Code, string Message, int StartLine, int StartColumn, int EndLine, int EndColumn);

// ---- GPU ----
public sealed record SubmitGpuJobRequest(GpuJobType Type, string Gpu, string PayloadJson);
public sealed record GpuJobDto(Guid Id, GpuJobType Type, string Status, string Provider, string Gpu, double ProgressPct, string? Error, string? ResultJson, DateTime CreatedAtUtc);

// ---- Packages ----
public sealed record AddPackageRequest(string Name, string Version, string Source = "registry", string? RegistryUrl = null);
public sealed record PackageDto(Guid Id, string Name, string Version, string Source, bool IsEnabled);
