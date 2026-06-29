namespace Nova.Domain.Common;

/// <summary>
/// A GameObject's local transform (TRS). World transforms are derived at runtime
/// by walking the hierarchy.
/// </summary>
public sealed class Transform
{
    public Vec3 Position { get; set; } = Vec3.Zero;
    public Quat Rotation { get; set; } = Quat.Identity;
    public Vec3 Scale { get; set; } = Vec3.One;
}
