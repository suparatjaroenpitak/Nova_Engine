using Nova.Domain.Common;

namespace Nova.Domain.Projects;

/// <summary>
/// A game project. Aggregates scenes, assets, scripts, packages.
/// </summary>
public sealed class Project : Entity, ISoftDeletable
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid OwnerId { get; set; }
    public Accounts.User? Owner { get; set; }

    public ProjectVisibility Visibility { get; set; } = ProjectVisibility.Private;

    /// <summary>Current major.minor of the engine this project targets.</summary>
    public string EngineVersion { get; set; } = "1.0";

    /// <summary>Render pipeline: "BuiltIn" | "URP" | "HDRP" (Unity-like conventions).</summary>
    public string RenderPipeline { get; set; } = "URP";

    public bool Is3D { get; set; } = true;

    public string? ThumbnailAssetId { get; set; }

    public List<Scene> Scenes { get; set; } = new();
    public List<Assets.Asset> Assets { get; set; } = new();
    public List<Scripts.Script> Scripts { get; set; } = new();
    public List<Packages.Package> Packages { get; set; } = new();

    public List<ProjectMember> Members { get; set; } = new();

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
}

public sealed class ProjectMember : Entity
{
    public Guid ProjectId { get; set; }
    public Project? Project { get; set; }
    public Guid UserId { get; set; }
    public Accounts.User? User { get; set; }

    /// <summary>"Owner" | "Editor" | "Viewer".</summary>
    public string Role { get; set; } = "Editor";
}
