using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nova.Application.Abstractions;
using Nova.Application.Dtos;
using Nova.Domain;
using Nova.Domain.Assets;
using Nova.Infrastructure.Persistence;

namespace Nova.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public sealed class AssetsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAssetRepository _assets;
    private readonly IObjectStorage _storage;

    public AssetsController(AppDbContext db, IAssetRepository assets, IObjectStorage storage)
    {
        _db = db;
        _assets = assets;
        _storage = storage;
    }

    [HttpGet("project/{projectId:guid}")]
    public async Task<ActionResult<IReadOnlyList<AssetDto>>> List(Guid projectId, CancellationToken ct)
    {
        var list = await _assets.ListForProjectAsync(projectId, ct);
        var result = new List<AssetDto>();
        foreach (var a in list)
        {
            var previewUrl = a.PreviewStorageKey is not null
                ? await _storage.PresignedGetAsync("nova-assets", a.PreviewStorageKey, TimeSpan.FromHours(1), ct)
                : null;
            result.Add(MapAsset(a, previewUrl));
        }
        return Ok(result);
    }

    [HttpPost("upload")]
    public async Task<ActionResult<AssetDto>> Upload([FromForm] Guid projectId, [FromForm] string name, [FromForm] string path, IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided" });

        var storageKey = $"{projectId}/{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
        using var stream = file.OpenReadStream();
        await _storage.UploadAsync("nova-assets", storageKey, stream, file.ContentType, ct);

        var asset = new Asset
        {
            ProjectId = projectId,
            Name = name,
            Path = path,
            Kind = InferAssetKind(file.FileName),
            ContentType = file.ContentType,
            SizeBytes = file.Length,
            StorageKey = storageKey
        };

        await _assets.AddAsync(asset, ct);
        await _assets.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(Get), new { id = asset.Id }, MapAsset(asset, null));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AssetDto>> Get(Guid id, CancellationToken ct)
    {
        var asset = await _assets.GetAsync(id, ct);
        if (asset is null) return NotFound();
        var previewUrl = asset.PreviewStorageKey is not null
            ? await _storage.PresignedGetAsync("nova-assets", asset.PreviewStorageKey, TimeSpan.FromHours(1), ct)
            : null;
        return Ok(MapAsset(asset, previewUrl));
    }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(Guid id, CancellationToken ct)
    {
        var asset = await _assets.GetAsync(id, ct);
        if (asset is null) return NotFound();
        var stream = await _storage.DownloadAsync("nova-assets", asset.StorageKey, ct);
        if (stream is null) return NotFound();
        return File(stream, asset.ContentType, asset.Name);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var asset = await _assets.GetAsync(id, ct);
        if (asset is null) return NotFound();
        await _storage.DeleteAsync("nova-assets", asset.StorageKey, ct);
        _assets.Remove(asset);
        await _assets.SaveChangesAsync(ct);
        return NoContent();
    }

    private static AssetDto MapAsset(Asset a, string? previewUrl) =>
        new(a.Id, a.ProjectId, a.Name, a.Path, a.Kind.ToString(), a.ContentType, a.SizeBytes, previewUrl, a.CreatedAtUtc);

    private static AssetKind InferAssetKind(string fileName)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        return ext switch
        {
            ".png" or ".jpg" or ".jpeg" or ".webp" or ".tga" or ".bmp" => AssetKind.Texture2D,
            ".fbx" or ".obj" or ".gltf" or ".glb" or ".blend" => AssetKind.Model,
            ".mp3" or ".wav" or ".ogg" or ".aiff" => AssetKind.Audio,
            ".ttf" or ".otf" => AssetKind.Font,
            ".json" => AssetKind.Json,
            ".csv" => AssetKind.Csv,
            ".cs" => AssetKind.Script,
            ".shader" or ".hlsl" or ".glsl" => AssetKind.Shader,
            ".mat" => AssetKind.Material,
            ".anim" => AssetKind.AnimationClip,
            ".controller" => AssetKind.AnimatorController,
            ".prefab" => AssetKind.Prefab,
            ".unity" or ".scene" => AssetKind.Scene,
            ".asset" or ".package" => AssetKind.Package,
            _ => AssetKind.Unknown
        };
    }
}

