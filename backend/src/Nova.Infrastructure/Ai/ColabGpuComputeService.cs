using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Nova.Application;
using Nova.Application.Abstractions;
using Nova.Domain;

namespace Nova.Infrastructure.Ai;

public sealed class ColabGpuComputeService : IGpuComputeService, IDisposable
{
    private readonly HttpClient _http;
    private readonly ILogger<ColabGpuComputeService> _logger;

    public ColabGpuComputeService(IOptions<GpuOptions> opts, ILogger<ColabGpuComputeService> logger)
    {
        _logger = logger;
        _http = new HttpClient
        {
            BaseAddress = new Uri(opts.Value.ServiceUrl.TrimEnd('/') + "/"),
            Timeout = TimeSpan.FromMinutes(30),
        };
    }

    public async Task<GpuJobHandle> SubmitAsync(GpuJobRequest request, CancellationToken ct = default)
    {
        var payload = new
        {
            type = request.Type.ToString(),
            gpu = request.Gpu,
            project_id = request.ProjectId?.ToString(),
            user_id = request.UserId?.ToString(),
            payload = request.PayloadJson,
        };

        var response = await _http.PostAsJsonAsync("api/jobs", payload, ct);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<JsonElement>(ct);
        var jobId = result.GetProperty("job_id").GetGuid();

        return new GpuJobHandle(jobId);
    }

    public async Task<GpuJobStatus> GetStatusAsync(Guid jobId, CancellationToken ct = default)
    {
        try
        {
            var response = await _http.GetAsync($"api/jobs/{jobId}", ct);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<JsonElement>(ct);
            var status = result.GetProperty("status").GetString() switch
            {
                "queued" => JobStatus.Queued,
                "running" or "processing" => JobStatus.Running,
                "completed" => JobStatus.Succeeded,
                "failed" => JobStatus.Failed,
                "cancelled" => JobStatus.Cancelled,
                _ => JobStatus.Queued,
            };

            return new GpuJobStatus(
                status,
                result.TryGetProperty("progress", out var p) ? p.GetDouble() : 0,
                result.TryGetProperty("result", out var r) ? r.GetRawText() : null,
                result.TryGetProperty("storage_key", out var sk) ? sk.GetString() : null,
                result.TryGetProperty("error", out var e) ? e.GetString() : null);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Failed to contact Colab for job {JobId}", jobId);
            return new GpuJobStatus(JobStatus.Running, 0, Error: "Colab unavailable");
        }
    }

    public async Task CancelAsync(Guid jobId, CancellationToken ct = default)
    {
        try
        {
            var response = await _http.PostAsync($"api/jobs/{jobId}/cancel", null, ct);
            response.EnsureSuccessStatusCode();
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Failed to cancel job {JobId} on Colab", jobId);
        }
    }

    public async Task<ColabHealthDto?> GetHealthAsync(CancellationToken ct = default)
    {
        try
        {
            var response = await _http.GetAsync("api/health", ct);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<ColabHealthDto>(ct);
        }
        catch
        {
            return null;
        }
    }

    public void Dispose() => _http.Dispose();
}

public sealed record ColabHealthDto(
    bool Connected,
    bool ModelLoaded,
    string Gpu,
    double MemoryUsage,
    double Uptime);
