using Nova.Domain.Common;

namespace Nova.Domain.GameObjects;

/// <summary>
/// Base type for all GameObject components (Transform is implicit on the GameObject).
/// Concrete components (MeshRenderer, Camera, Light, Rigidbody, etc.) are modeled as
/// a discriminated row whose <see cref="Kind"/> selects the schema stored in
/// <see cref="PropertiesJson"/>. This keeps the table compact and avoids one table per
/// component type while remaining strongly typed through DTOs in the Application layer.
/// </summary>
public sealed class GameComponent : Entity
{
    public Guid GameObjectId { get; set; }
    public Scenes.GameObject? GameObject { get; set; }

    /// <summary>
    /// Component discriminator, e.g. "MeshRenderer", "Camera", "Light",
    /// "Rigidbody", "BoxCollider", "AudioSource", "ParticleSystem", "ScriptBehaviour".
    /// </summary>
    public string Kind { get; set; } = string.Empty;

    public bool Enabled { get; set; } = true;

    /// <summary>
    /// JSONB blob of strongly-typed properties for this component, validated by the
    /// Application layer before persistence. For ScriptBehaviour this holds the bound
    /// script id + serialized field values.
    /// </summary>
    public string PropertiesJson { get; set; } = "{}";

    public int Order { get; set; }
}
