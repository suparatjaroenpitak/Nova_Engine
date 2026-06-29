namespace Nova.Domain;

public enum UserRole
{
    User = 0,
    Developer = 10,
    Admin = 100,
}

public enum ProjectVisibility
{
    Private = 0,
    Unlisted = 1,
    Public = 2,
}

public enum AssetKind
{
    Unknown = 0,
    Texture2D,
    Texture3D,
    Cubemap,
    Material,
    Shader,
    Model,
    Mesh,
    AnimationClip,
    AnimatorController,
    Audio,
    Prefab,
    Scene,
    Script,
    Font,
    Json,
    Csv,
    Tilemap,
    Terrain,
    Package,
}

public enum PrimitiveType
{
    Cube,
    Sphere,
    Plane,
    Capsule,
    Cylinder,
    Quad,
}

public enum LightType
{
    Directional,
    Point,
    Spot,
    Area,
}

public enum PhysicsBodyType
{
    Static,
    Kinematic,
    Dynamic,
}

public enum ColliderShape
{
    Box,
    Sphere,
    Capsule,
    Mesh,
    ConvexHull,
}

public enum ScriptLanguage
{
    CSharp,
}

public enum JobStatus
{
    Queued,
    Running,
    Succeeded,
    Failed,
    Cancelled,
}

public enum GpuJobType
{
    TextureGeneration,
    AiMaterial,
    ModelGeneration,
    MeshOptimization,
    TextureUpscaling,
    AnimationGeneration,
    Rigging,
    MotionCapture,
    LightBaking,
    ShadowBaking,
    PathTracing,
    NavMeshBaking,
    PhysicsBaking,
    VoxelGeneration,
    TerrainGeneration,
    WorldGeneration,
    NpcGeneration,
    VoiceGeneration,
    Speech,
    ImageGeneration,
    VideoGeneration,
}

public enum ExportTarget
{
    Web,
    Windows,
    Linux,
    Android,
    iOS,
    MacOS,
}
