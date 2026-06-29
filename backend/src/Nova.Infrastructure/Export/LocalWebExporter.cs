using Microsoft.Extensions.Logging;
using Nova.Application.Abstractions;
using Nova.Domain;

namespace Nova.Infrastructure.Export;

public sealed class LocalWebExporter : IExporter
{
    private readonly ILogger<LocalWebExporter> _logger;

    public LocalWebExporter(ILogger<LocalWebExporter> logger) => _logger = logger;

    public ExportTarget Target => ExportTarget.Web;

    public Task<ExportArtifact> ExportAsync(ExportRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation("Web export stub: project {ProjectId}, scene {SceneId}", request.ProjectId, request.SceneId);
        return Task.FromResult(new ExportArtifact(
            $"exports/{request.ProjectId}/web.zip",
            "application/zip",
            0,
            "Web export stub — implement build pipeline."));
    }
}
