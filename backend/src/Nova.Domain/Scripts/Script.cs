using Nova.Domain.Common;

namespace Nova.Domain.Scripts;

/// <summary>
/// A user-authored script (C# MonoBehaviour-style). The current source is versioned;
/// every save creates a <see cref="ScriptVersion"/>.
/// </summary>
public sealed class Script : Entity, ISoftDeletable
{
    public Guid ProjectId { get; set; }
    public Projects.Project? Project { get; set; }

    public string Name { get; set; } = string.Empty;
    public string FullyQualifiedClassName { get; set; } = string.Empty;

    public ScriptLanguage Language { get; set; } = ScriptLanguage.CSharp;

    public string CurrentSource { get; set; } = string.Empty;
    public int CurrentVersion { get; set; } = 1;

    /// <summary>True if the last compile succeeded with zero errors.</summary>
    public bool Compiles { get; set; }
    public int ErrorCount { get; set; }
    public int WarningCount { get; set; }

    public List<ScriptVersion> Versions { get; set; } = new();

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
}

public sealed class ScriptVersion : Entity
{
    public Guid ScriptId { get; set; }
    public Script? Script { get; set; }

    public int Version { get; set; }
    public string Source { get; set; } = string.Empty;

    public bool Compiles { get; set; }
    public string? DiagnosticsJson { get; set; }

    /// <summary>Hash of the compiled assembly, if any, for hot-reload cache busting.</summary>
    public string? AssemblyHash { get; set; }
}
