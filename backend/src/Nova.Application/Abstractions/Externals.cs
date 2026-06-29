using Nova.Domain;

namespace Nova.Application.Abstractions;

// ============================================================================
//  Provider abstractions for the GPU / AI / Export subsystems.
//  The "deep slice" ships LocalStub implementations so the whole stack runs
//  today. Swap in Colab / OpenAI / native exporters later by registering a
//  different implementation in DI. See docs/ROADMAP.md (Phases 9-11).
// ============================================================================

/// <summary>
/// Submits GPU compute jobs (texture gen, mesh optimization, baking, …).
/// Implementations may execute locally (stub), on Colab, or on a self-hosted GPU node.
/// </summary>
public interface IGpuComputeService
{
    Task<GpuJobHandle> SubmitAsync(GpuJobRequest request, CancellationToken ct = default);
    Task<GpuJobStatus> GetStatusAsync(Guid jobId, CancellationToken ct = default);
    Task CancelAsync(Guid jobId, CancellationToken ct = default);
}

public sealed record GpuJobRequest(
    GpuJobType Type,
    string Gpu,                // "Auto" | "T4" | "L4" | "A100" | "V100" | "H100"
    string PayloadJson,
    Guid? ProjectId = null,
    Guid? UserId = null);

public sealed record GpuJobHandle(Guid JobId);

public sealed record GpuJobStatus(
    JobStatus Status,
    double ProgressPct,
    string? ResultJson = null,
    string? ResultStorageKey = null,
    string? Error = null);

/// <summary>
/// An AI agent. Agents are registered by capability; handlers resolve the right agent
/// for a given request kind (generate-scene, generate-script, generate-shader, …).
/// </summary>
public interface IAiAgent
{
    /// <summary>Capabilities this agent can serve, e.g. "generate-script".</summary>
    IReadOnlyCollection<string> Capabilities { get; }

    Task<AgentResponse> ExecuteAsync(AgentRequest request, CancellationToken ct = default);
}

public sealed record AgentRequest(string Capability, string Prompt, string? PayloadJson = null, Guid? ProjectId = null);
public sealed record AgentResponse(bool Success, string Content, string? Error = null);

public interface IAiAgentRegistry
{
    IAiAgent Resolve(string capability);
    IReadOnlyCollection<string> AvailableCapabilities { get; }
}

/// <summary>
/// Exports a project to a target platform. Web export is fully real (bundling the
/// runtime + scene into a static site). Native targets are documented extension points.
/// </summary>
public interface IExporter
{
    ExportTarget Target { get; }
    Task<ExportArtifact> ExportAsync(ExportRequest request, CancellationToken ct = default);
}

public sealed record ExportRequest(Guid ProjectId, ExportTarget Target, Guid? SceneId = null);
public sealed record ExportArtifact(string StorageKey, string ContentType, long SizeBytes, string? Readme);
