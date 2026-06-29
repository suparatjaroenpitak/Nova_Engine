using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nova.Application.Abstractions;

namespace Nova.Api.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[Authorize]
public sealed class ExportController : ControllerBase
{
    private readonly IEnumerable<IExporter> _exporters;

    public ExportController(IEnumerable<IExporter> exporters) => _exporters = exporters;

    [HttpPost("{target}")]
    public async Task<ActionResult<ExportArtifact>> Export(string target, [FromBody] ExportRequest request, CancellationToken ct)
    {
        if (!Enum.TryParse<Domain.ExportTarget>(target, true, out var exportTarget))
            return BadRequest(new { error = $"Invalid target: {target}. Valid: Web, Windows, Linux, Android, iOS, MacOS" });

        var exporter = _exporters.FirstOrDefault(e => e.Target == exportTarget);
        if (exporter is null)
            return NotFound(new { error = $"No exporter registered for target '{target}'" });

        var artifact = await exporter.ExportAsync(request with { Target = exportTarget }, ct);
        return Ok(artifact);
    }
}
