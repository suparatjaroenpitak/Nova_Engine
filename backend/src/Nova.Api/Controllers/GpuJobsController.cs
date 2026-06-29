using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nova.Application.Abstractions;
using Nova.Application.Dtos;
using Nova.Domain.Jobs;

namespace Nova.Api.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/gpu-jobs")]
[Authorize]
public sealed class GpuJobsController : ControllerBase
{
    private readonly IGpuJobRepository _jobs;
    private readonly IGpuComputeService _gpu;
    private readonly ICurrentUserService _currentUser;

    public GpuJobsController(IGpuJobRepository jobs, IGpuComputeService gpu, ICurrentUserService currentUser)
    {
        _jobs = jobs;
        _gpu = gpu;
        _currentUser = currentUser;
    }

    [HttpGet("project/{projectId:guid}")]
    public async Task<ActionResult<IReadOnlyList<GpuJobDto>>> List(Guid projectId, CancellationToken ct)
    {
        var list = await _jobs.ListForProjectAsync(projectId, ct);
        return Ok(list.Select(MapJob).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<GpuJobDto>> Submit([FromBody] SubmitGpuJobRequest request, CancellationToken ct)
    {
        var gpuRequest = new GpuJobRequest(request.Type, request.Gpu, request.PayloadJson, UserId: _currentUser.UserId);
        var handle = await _gpu.SubmitAsync(gpuRequest, ct);

        var job = new GpuJob
        {
            Id = handle.JobId,
            Type = request.Type,
            Gpu = request.Gpu,
            PayloadJson = request.PayloadJson,
            UserId = _currentUser.UserId,
            Status = Domain.JobStatus.Queued,
            Provider = "LocalStub"
        };

        await _jobs.AddAsync(job, ct);
        await _jobs.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(Get), new { id = job.Id }, MapJob(job));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<GpuJobDto>> Get(Guid id, CancellationToken ct)
    {
        var job = await _jobs.GetAsync(id, ct);
        if (job is null) return NotFound();
        return Ok(MapJob(job));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken ct)
    {
        var job = await _jobs.GetAsync(id, ct);
        if (job is null) return NotFound();
        await _gpu.CancelAsync(id, ct);
        job.Status = Domain.JobStatus.Cancelled;
        await _jobs.SaveChangesAsync(ct);
        return NoContent();
    }

    private static GpuJobDto MapJob(GpuJob j) =>
        new(j.Id, j.Type, j.Status.ToString(), j.Provider, j.Gpu, j.ProgressPct, j.Error, j.ResultJson, j.CreatedAtUtc);
}
