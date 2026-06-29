using Nova.Domain.Common;

namespace Nova.Domain.Jobs;

/// <summary>
/// A GPU compute job submitted to <c>IGpuComputeService</c> (texture generation,
/// mesh optimization, light baking, etc.). State is durable so progress can be polled
/// or pushed over SignalR.
/// </summary>
public sealed class GpuJob : Entity
{
    public Guid? ProjectId { get; set; }
    public Guid? UserId { get; set; }

    public GpuJobType Type { get; set; }
    public JobStatus Status { get; set; } = JobStatus.Queued;

    /// <summary>Requested accelerator: "T4" | "L4" | "A100" | "V100" | "H100" | "Auto".</summary>
    public string Gpu { get; set; } = "Auto";

    /// <summary>Provider that picked the job up: "LocalStub" | "Colab" | ...</summary>
    public string Provider { get; set; } = "LocalStub";

    public string PayloadJson { get; set; } = "{}";
    public string? ResultJson { get; set; }
    public string? ResultStorageKey { get; set; }
    public string? Error { get; set; }

    public double ProgressPct { get; set; }
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? FinishedAtUtc { get; set; }
}
