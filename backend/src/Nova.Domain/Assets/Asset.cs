using Nova.Domain.Common;

namespace Nova.Domain.Assets;

/// <summary>
/// A project asset: the metadata row. Binary content lives in MinIO; this row points at it.
/// </summary>
public sealed class Asset : Entity, ISoftDeletable
{
    public Guid ProjectId { get; set; }
    public Projects.Project? Project { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty; // virtual path within the project, e.g. "/Textures/hero.png"

    public AssetKind Kind { get; set; } = AssetKind.Unknown;

    /// <summary>MIME/content type of the source file.</summary>
    public string ContentType { get; set; } = "application/octet-stream";

    public long SizeBytes { get; set; }

    /// <summary>SHA-256 of the source bytes, for dedupe and cache keys.</summary>
    public string? Sha256 { get; set; }

    /// <summary>Object key in MinIO / S3.</summary>
    public string StorageKey { get; set; } = string.Empty;

    /// <summary>Imported/derived artifacts (previews, compressed variants) as JSONB.</summary>
    public string? ImportMetaJson { get; set; }

    /// <summary>Small thumbnail/preview object key (used by the Asset browser).</summary>
    public string? PreviewStorageKey { get; set; }

    public string? SourceImporter { get; set; }

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
}

/// <summary>
/// Tracks long-running import/processing pipelines on assets (model decimation,
/// texture compression, preview generation). Backed by Hangfire under the hood.
/// </summary>
public sealed class AssetImportJob : Entity
{
    public Guid AssetId { get; set; }
    public Asset? Asset { get; set; }

    public string Stage { get; set; } = string.Empty;
    public JobStatus Status { get; set; } = JobStatus.Queued;
    public string? HangfireJobId { get; set; }
    public string? Error { get; set; }
    public string? ResultJson { get; set; }
    public DateTime? FinishedAtUtc { get; set; }
}
