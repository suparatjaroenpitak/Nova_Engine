using Microsoft.Extensions.Logging;
using Nova.Application.Abstractions;
using Nova.Domain;

namespace Nova.Infrastructure.Gpu;

public sealed class LocalStubGpuComputeService : IGpuComputeService
{
    private readonly ILogger<LocalStubGpuComputeService> _logger;

    public LocalStubGpuComputeService(ILogger<LocalStubGpuComputeService> logger) => _logger = logger;

    public Task<GpuJobHandle> SubmitAsync(GpuJobRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation("GPU stub: submitted {Type} on {Gpu}", request.Type, request.Gpu);
        return Task.FromResult(new GpuJobHandle(Guid.NewGuid()));
    }

    public Task<GpuJobStatus> GetStatusAsync(Guid jobId, CancellationToken ct = default)
    {
        return Task.FromResult(new GpuJobStatus(JobStatus.Succeeded, 100));
    }

    public Task CancelAsync(Guid jobId, CancellationToken ct = default)
    {
        _logger.LogInformation("GPU stub: cancelled {JobId}", jobId);
        return Task.CompletedTask;
    }
}
