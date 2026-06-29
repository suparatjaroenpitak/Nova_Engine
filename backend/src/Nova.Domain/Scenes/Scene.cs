using Nova.Domain.Common;

namespace Nova.Domain.Scenes;

/// <summary>
/// A scene: a tree of GameObjects. The canonical source of truth lives in Postgres;
/// SignalR pushes deltas to editors for realtime collaboration.
/// </summary>
public sealed class Scene : Entity, ISoftDeletable
{
    public string Name { get; set; } = "Untitled";
    public Guid ProjectId { get; set; }
    public Projects.Project? Project { get; set; }

    public bool IsMain { get; set; }

    /// <summary>
    /// Ambient scene settings serialized as JSONB (fog, skybox, ambient color, gravity, …).
    /// Kept schemaless deliberately so we can evolve the editor without a migration per field.
    /// </summary>
    public string SettingsJson { get; set; } = "{}";

    public List<GameObject> GameObjects { get; set; } = new();

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
}

/// <summary>
/// A node in the scene hierarchy. Has a local Transform and zero or more Components.
/// </summary>
public sealed class GameObject : Entity
{
    public string Name { get; set; } = "GameObject";
    public Guid SceneId { get; set; }
    public Scene? Scene { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>Self-referential hierarchy. Root objects have a null ParentId.</summary>
    public Guid? ParentId { get; set; }
    public GameObject? Parent { get; set; }
    public List<GameObject> Children { get; set; } = new();

    /// <summary>Sibling order within the parent.</summary>
    public int SiblingIndex { get; set; }

    public Transform Transform { get; set; } = new();

    /// <summary>
    /// Static layer (0..31) matching Unity's layer mask system.
    /// </summary>
    public int Layer { get; set; }

    public string? Tag { get; set; }

    public List<GameObjects.GameComponent> Components { get; set; } = new();

    /// <summary>If true, this GameObject is an instance of a prefab root.</summary>
    public Guid? PrefabSourceId { get; set; }
}
