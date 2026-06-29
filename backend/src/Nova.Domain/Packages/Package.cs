using Nova.Domain.Common;

namespace Nova.Domain.Packages;

/// <summary>
/// A package dependency declared by a project (think Unity Package Manager entry).
/// </summary>
public sealed class Package : Entity
{
    public Guid ProjectId { get; set; }
    public Projects.Project? Project { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;

    /// <summary>"registry" | "git" | "local" | "embedded".</summary>
    public string Source { get; set; } = "registry";

    public string? RegistryUrl { get; set; }
    public string? GitUrl { get; set; }
    public string? LocalPath { get; set; }

    public string? Description { get; set; }
    public bool IsEnabled { get; set; } = true;
}

/// <summary>
/// A published package in Nova's registry (the "Asset Store" side).
/// </summary>
public sealed class RegistryPackage : Entity, ISoftDeletable
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string LatestVersion { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? AuthorId { get; set; }
    public string? StorageKey { get; set; }
    public string? Readme { get; set; }
    public List<string> Tags { get; set; } = new();

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
}
