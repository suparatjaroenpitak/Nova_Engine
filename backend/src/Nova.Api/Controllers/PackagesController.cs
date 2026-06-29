using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nova.Application.Abstractions;
using Nova.Application.Dtos;
using Nova.Domain.Packages;

namespace Nova.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public sealed class PackagesController : ControllerBase
{
    private readonly IPackageRepository _packages;

    public PackagesController(IPackageRepository packages) => _packages = packages;

    [HttpGet("project/{projectId:guid}")]
    public async Task<ActionResult<IReadOnlyList<PackageDto>>> List(Guid projectId, CancellationToken ct)
    {
        var list = await _packages.ListAsync(ct);
        return Ok(list.Where(p => p.ProjectId == projectId).Select(MapPackage).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<PackageDto>> Add([FromBody] AddPackageRequest request, CancellationToken ct)
    {
        var package = new Package
        {
            Name = request.Name,
            Version = request.Version,
            Source = request.Source,
            RegistryUrl = request.RegistryUrl
        };
        await _packages.AddAsync(package, ct);
        await _packages.SaveChangesAsync(ct);
        return Ok(MapPackage(package));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Remove(Guid id, CancellationToken ct)
    {
        var pkg = await _packages.GetAsync(id, ct);
        if (pkg is null) return NotFound();
        _packages.Remove(pkg);
        await _packages.SaveChangesAsync(ct);
        return NoContent();
    }

    private static PackageDto MapPackage(Package p) =>
        new(p.Id, p.Name, p.Version, p.Source, p.IsEnabled);
}

