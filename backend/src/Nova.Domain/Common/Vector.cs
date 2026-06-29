namespace Nova.Domain.Common;

/// <summary>
/// Engine-space vectors. Stored as JSONB columns in Postgres so the schema stays
/// flexible as we add fields, while remaining queryable for transforms.
/// </summary>
public sealed record Vec3(double X, double Y, double Z)
{
    public static Vec3 Zero => new(0, 0, 0);
    public static Vec3 One => new(1, 1, 1);
    public static Vec3 Forward => new(0, 0, -1);
    public static Vec3 Up => new(0, 1, 0);
}

public sealed record Vec4(double X, double Y, double Z, double W);
public sealed record Quat(double X, double Y, double Z, double W)
{
    public static Quat Identity => new(0, 0, 0, 1);
}
public sealed record Color(double R, double G, double B, double A)
{
    public static Color White => new(1, 1, 1, 1);
    public static Color Black => new(0, 0, 0, 1);
}
