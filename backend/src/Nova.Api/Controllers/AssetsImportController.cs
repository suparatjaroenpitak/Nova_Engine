using System.Collections.Concurrent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nova.Application.Abstractions;
using Nova.Application.Dtos;
using Nova.Domain;
using Nova.Domain.Assets;
using Nova.Domain.Jobs;
using Nova.Infrastructure.Persistence;

namespace Nova.Api.Controllers;

[ApiController]
[Route("api/v1/import")]
[Authorize]
public sealed class AssetsImportController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAssetRepository _assets;
    private readonly IObjectStorage _storage;
    private readonly IGpuJobRepository _jobs;
    private readonly ILogger<AssetsImportController> _logger;
    private static readonly ConcurrentDictionary<string, ChunkUploadState> Chunks = new();

    public AssetsImportController(
        AppDbContext db, IAssetRepository assets, IObjectStorage storage,
        IGpuJobRepository jobs, ILogger<AssetsImportController> logger)
    {
        _db = db;
        _assets = assets;
        _storage = storage;
        _jobs = jobs;
        _logger = logger;
    }

    [HttpPost("upload-chunk")]
    [DisableRequestSizeLimit]
    [RequestFormLimits(MultipartBodyLengthLimit = 10L * 1024 * 1024 * 1024)]
    public async Task<IActionResult> UploadChunk(
        [FromForm] Guid projectId, [FromForm] string fileId, [FromForm] int chunkIndex,
        [FromForm] int totalChunks, [FromForm] long fileSize, IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Empty chunk" });

        var state = Chunks.GetOrAdd(fileId, _ => new ChunkUploadState
        {
            FileId = fileId, ProjectId = projectId, TotalChunks = totalChunks, FileSize = fileSize
        });

        using var stream = file.OpenReadStream();
        var chunkKey = $"chunks/{fileId}/{chunkIndex:D6}";
        await _storage.UploadAsync(chunkKey, stream, file.ContentType, ct);
        Interlocked.Increment(ref state.ReceivedChunks);

        return Ok(new { received = state.ReceivedChunks, total = totalChunks });
    }

    [HttpPost("upload-chunk/resumable")]
    public IActionResult GetResumableInfo([FromQuery] string fileId)
    {
        if (Chunks.TryGetValue(fileId, out var state))
        {
            var received = new HashSet<int>();
            for (int i = 0; i < state.TotalChunks; i++)
            {
                var chunkKey = $"chunks/{fileId}/{i:D6}";
                received.Add(i);
            }
            return Ok(new { fileId, receivedChunks = Enumerable.Range(0, state.ReceivedChunks).ToArray(), totalChunks = state.TotalChunks });
        }
        return Ok(new { fileId, receivedChunks = Array.Empty<int>(), totalChunks = 0 });
    }

    [HttpPost("finalize")]
    public async Task<ActionResult<AssetDto>> FinalizeUpload(
        [FromBody] FinalizeRequest req, CancellationToken ct)
    {
        if (!Chunks.TryRemove(req.FileId, out var state))
            return BadRequest(new { error = "Upload state not found" });

        var ext = Path.GetExtension(req.FileName);
        var storageKey = $"{req.ProjectId}/{req.FileId:N}{ext}";

        using var combined = new MemoryStream();
        for (int i = 0; i < state.TotalChunks; i++)
        {
            var chunkKey = $"chunks/{req.FileId}/{i:D6}";
            using var chunkStream = await _storage.DownloadAsync(chunkKey, ct);
            await chunkStream.CopyToAsync(combined, ct);
            await _storage.DeleteAsync(chunkKey, ct);
        }
        combined.Position = 0;

        await _storage.UploadAsync(storageKey, combined, "application/octet-stream", ct);

        var asset = new Asset
        {
            ProjectId = req.ProjectId,
            Name = Path.GetFileNameWithoutExtension(req.FileName),
            StorageKey = storageKey,
            ContentType = "application/octet-stream",
            Kind = ResolveAssetKind(ext),
            SizeBytes = state.FileSize,
        };

        await _assets.AddAsync(asset, ct);
        await _assets.SaveChangesAsync(ct);

        _logger.LogInformation("Imported asset {Name} ({Size} bytes) into project {Project}",
            asset.Name, state.FileSize, req.ProjectId);

        return Ok(MapAsset(asset, null));
    }

    [HttpPost("start")]
    public async Task<ActionResult<ImportJobResponse>> StartImport(
        [FromBody] StartImportRequest req, CancellationToken ct)
    {
        var jobId = Guid.NewGuid();
        var job = new GpuJob
        {
            Id = jobId,
            ProjectId = req.ProjectId,
            Type = GpuJobType.ModelGeneration,
            Status = Domain.JobStatus.Queued,
            PayloadJson = System.Text.Json.JsonSerializer.Serialize(req),
            Provider = "ImportPipeline",
        };

        await _jobs.AddAsync(job, ct);
        await _jobs.SaveChangesAsync(ct);

        _ = ProcessImportJobAsync(jobId, req, ct);
        return Ok(new ImportJobResponse(jobId, "queued"));
    }

    [HttpGet("jobs/{jobId:guid}")]
    public async Task<ActionResult<ImportJobResponse>> GetJob(Guid jobId, CancellationToken ct)
    {
        var job = await _jobs.GetAsync(jobId, ct);
        if (job is null) return NotFound();
        return Ok(new ImportJobResponse(job.Id, job.Status.ToString().ToLower(), job.ProgressPct));
    }

    private async Task ProcessImportJobAsync(Guid jobId, StartImportRequest req, CancellationToken ct)
    {
        try
        {
            var job = await _jobs.GetAsync(jobId, ct);
            if (job is null) return;

            job.Status = Domain.JobStatus.Running;
            await _jobs.SaveChangesAsync(ct);

            int total = req.Files.Count;
            for (int i = 0; i < total; i++)
            {
                var f = req.Files[i];
                job.ProgressPct = (int)((i / (double)total) * 100);
                await _jobs.SaveChangesAsync(ct);

                using var fileStream = await _storage.DownloadAsync(f.StorageKey, ct);
                var asset = new Asset
                {
                    ProjectId = req.ProjectId,
                    Name = Path.GetFileNameWithoutExtension(f.FileName),
                    StorageKey = f.StorageKey,
                    ContentType = "application/octet-stream",
                    Kind = ResolveAssetKind(Path.GetExtension(f.FileName)),
                    SizeBytes = f.FileSize,
                };
                await _assets.AddAsync(asset, ct);
            }

            job.Status = Domain.JobStatus.Succeeded;
            job.ProgressPct = 100;
            await _jobs.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Import job {JobId} failed", jobId);
            var job = await _jobs.GetAsync(jobId, ct);
            if (job is not null)
            {
                job.Status = Domain.JobStatus.Failed;
                job.Error = ex.Message;
                await _jobs.SaveChangesAsync(ct);
            }
        }
    }

    private static string ResolveAssetKind(string extension) => extension.ToLower() switch
    {
        ".fbx" or ".obj" or ".gltf" or ".glb" or ".stl" or ".dae" or ".ply" => "Model",
        ".png" or ".jpg" or ".jpeg" or ".tga" or ".tiff" or ".bmp" or ".exr" or ".hdr" or ".webp" => "Texture2D",
        ".mp3" or ".wav" or ".ogg" or ".flac" => "Audio",
        ".mp4" or ".webm" or ".mov" => "Video",
        ".cs" => "Script",
        ".ttf" or ".otf" => "Font",
        ".mat" or ".sbsar" => "Material",
        ".zip" or ".tar" or ".gz" => "Package",
        _ => "Unknown",
    };

    private static AssetDto MapAsset(Asset a, string? previewUrl) => new(
        a.Id, a.ProjectId ?? Guid.Empty, a.Name, a.StorageKey ?? "", a.Kind,
        a.ContentType ?? "", a.SizeBytes, previewUrl, a.CreatedAtUtc);
}

public sealed record ChunkUploadState
{
    public string FileId { get; init; } = "";
    public Guid ProjectId { get; init; }
    public int TotalChunks { get; init; }
    public long FileSize { get; init; }
    public int ReceivedChunks;
}

public sealed record FinalizeRequest(Guid ProjectId, string FileId, string FileName, int TotalChunks);

public sealed record StartImportRequest(Guid ProjectId, List<ImportFileInfo> Files, ImportSettingsDto Settings);

public sealed record ImportFileInfo(string FileId, string FileName, string StorageKey, long FileSize, string Type, string Category);

public sealed record ImportSettingsDto(
    double Scale = 1, string UnitConversion = "auto", string MeshCompression = "medium",
    string TextureCompression = "medium", bool GenerateCollider = false, bool GenerateLOD = true,
    int LodCount = 3, bool GenerateLightmapUV = false, bool ImportAnimation = true,
    bool ImportMaterial = true, bool ImportTexture = true, bool OptimizeMesh = true,
    bool GeneratePreview = true);

public sealed record ImportJobResponse(Guid JobId, string Status, int Progress = 0);
