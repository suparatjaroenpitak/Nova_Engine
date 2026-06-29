using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Nova.Api.Hubs;
using Nova.Application.Abstractions;
using Nova.Application.Dtos;
using Nova.Domain;
using Nova.Domain.Jobs;
using Nova.Infrastructure.Ai;

namespace Nova.Api.Controllers;

[ApiController]
[Route("api/v1/ai-generation")]
[Authorize]
public sealed class AIGenerationController : ControllerBase
{
    private readonly IGpuJobRepository _jobs;
    private readonly IGpuComputeService _gpu;
    private readonly ICurrentUserService _currentUser;
    private readonly IObjectStorage _storage;
    private readonly IHubContext<GenerationHub> _hub;
    private readonly ILogger<AIGenerationController> _logger;
    private readonly ColabGpuComputeService? _colab;

    public AIGenerationController(
        IGpuJobRepository jobs,
        IGpuComputeService gpu,
        ICurrentUserService currentUser,
        IObjectStorage storage,
        IHubContext<GenerationHub> hub,
        ILogger<AIGenerationController> logger,
        ColabGpuComputeService? colab = null)
    {
        _jobs = jobs;
        _gpu = gpu;
        _currentUser = currentUser;
        _storage = storage;
        _hub = hub;
        _logger = logger;
        _colab = colab;
    }

    [HttpGet("models")]
    public ActionResult<AIModelInfoDto[]> Models()
    {
        return Ok(new[]
        {
            new AIModelInfoDto("trellis", "TRELLIS", "Structured Latent 3D — high-quality textured meshes", "🧊",
                ["text-to-3d", "image-to-3d"], ["glb", "obj", "stl"], 2048),
            new AIModelInfoDto("hunyuan3d", "Hunyuan3D", "Tencent's open-source 3D with PBR materials", "🎯",
                ["text-to-3d", "image-to-3d"], ["glb", "obj"], 2048),
            new AIModelInfoDto("stable-fast-3d", "Stable Fast 3D", "Stability AI — fast single-image-to-3D", "⚡",
                ["image-to-3d"], ["glb", "obj", "usdz"], 1024),
            new AIModelInfoDto("triposr", "TripoSR", "Fast image-to-3D from Stability AI / Tripo", "🚀",
                ["image-to-3d"], ["glb", "obj"], 1024),
            new AIModelInfoDto("instantmesh", "InstantMesh", "Efficient image-to-3D multi-view diffusion", "🔄",
                ["image-to-3d"], ["glb", "obj", "stl"], 1024),
        });
    }

    [HttpGet("colab-status")]
    public async Task<ActionResult<ColabStatusDto>> ColabStatus(CancellationToken ct)
    {
        if (_colab is null)
            return Ok(new ColabStatusDto(false, false, "N/A", 0, 0));

        var health = await _colab.GetHealthAsync(ct);
        if (health is null)
            return Ok(new ColabStatusDto(false, false, "N/A", 0, 0));

        return Ok(new ColabStatusDto(health.Connected, health.ModelLoaded, health.Gpu, health.MemoryUsage, health.Uptime));
    }

    [HttpPost("jobs")]
    public async Task<ActionResult<AIGenerationJobDto>> Submit(
        [FromBody] SubmitAIGenerationRequest request, CancellationToken ct)
    {
        var payloadJson = System.Text.Json.JsonSerializer.Serialize(request.Request);

        var gpuRequest = new GpuJobRequest(
            GpuJobType.ModelGeneration,
            "Auto",
            payloadJson,
            request.ProjectId,
            _currentUser.UserId);

        var handle = await _gpu.SubmitAsync(gpuRequest, ct);

        var job = new GpuJob
        {
            Id = handle.JobId,
            Type = nameof(GpuJobType.ModelGeneration),
            Gpu = "Auto",
            PayloadJson = payloadJson,
            UserId = _currentUser.UserId,
            Status = Domain.JobStatus.Queued,
            Provider = "Colab",
        };

        await _jobs.AddAsync(job, ct);
        await _jobs.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetJob), new { jobId = job.Id }, MapJob(job));
    }

    [HttpGet("jobs/{jobId:guid}")]
    public async Task<ActionResult<AIGenerationJobDto>> GetJob(Guid jobId, CancellationToken ct)
    {
        var job = await _jobs.GetAsync(jobId, ct);
        if (job is null) return NotFound();
        return Ok(MapJob(job));
    }

    [HttpGet("jobs/project/{projectId:guid}")]
    public async Task<ActionResult<AIGenerationJobDto[]>> ListJobs(Guid projectId, CancellationToken ct)
    {
        var list = await _jobs.ListForProjectAsync(projectId, ct);
        return Ok(list.Select(MapJob).ToArray());
    }

    [HttpPost("jobs/{jobId:guid}/cancel")]
    public async Task<IActionResult> CancelJob(Guid jobId, CancellationToken ct)
    {
        var job = await _jobs.GetAsync(jobId, ct);
        if (job is null) return NotFound();

        await _gpu.CancelAsync(jobId, ct);
        job.Status = Domain.JobStatus.Cancelled;
        await _jobs.SaveChangesAsync(ct);

        await _hub.Clients.Group($"project-{job.ProjectId}")
            .SendAsync("JobFailed", jobId.ToString(), "Cancelled by user", ct);

        return Ok();
    }

    [HttpPost("jobs/{jobId:guid}/retry")]
    public async Task<ActionResult<AIGenerationJobDto>> RetryJob(Guid jobId, CancellationToken ct)
    {
        var job = await _jobs.GetAsync(jobId, ct);
        if (job is null) return NotFound();

        job.Status = Domain.JobStatus.Queued;
        job.Error = null;
        job.ProgressPct = 0;
        await _jobs.SaveChangesAsync(ct);

        _logger.LogInformation("Retrying job {JobId}", jobId);
        return Ok(MapJob(job));
    }

    [HttpGet("jobs/{jobId:guid}/download")]
    public async Task<IActionResult> DownloadResult(Guid jobId, CancellationToken ct)
    {
        var job = await _jobs.GetAsync(jobId, ct);
        if (job is null) return NotFound();
        if (job.Status != Domain.JobStatus.Succeeded || job.ResultJson is null)
            return BadRequest(new { error = "Job not completed or no result available" });

        try
        {
            var result = System.Text.Json.JsonSerializer.Deserialize<AIGenerationResultDto>(job.ResultJson);
            if (result is null) return NotFound();

            var stream = await _storage.DownloadAsync(result.ModelUrl, ct);
            return File(stream, "application/octet-stream", $"model_{jobId}.glb");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to download result for job {JobId}", jobId);
            return NotFound();
        }
    }

    private static AIGenerationJobDto MapJob(GpuJob j)
    {
        AIGenerationResultDto? result = null;
        if (j.ResultJson is not null)
        {
            try { result = System.Text.Json.JsonSerializer.Deserialize<AIGenerationResultDto>(j.ResultJson); }
            catch { }
        }

        AIGenerationRequestDto? req = null;
        if (j.PayloadJson is not null)
        {
            try { req = System.Text.Json.JsonSerializer.Deserialize<AIGenerationRequestDto>(j.PayloadJson); }
            catch { }
        }

        return new AIGenerationJobDto(
            j.Id, j.ProjectId ?? Guid.Empty,
            req?.Mode ?? "unknown",
            req?.Model ?? "unknown",
            j.Status.ToString(),
            j.ProgressPct,
            req?.Prompt,
            req?.ImageUrl,
            j.Error,
            result,
            j.CreatedAtUtc,
            j.UpdatedAtUtc);
    }
}
