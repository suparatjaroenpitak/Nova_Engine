using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nova.Application.Abstractions;
using Nova.Application.Dtos;
using Nova.Domain.Scenes;
using Nova.Infrastructure.Persistence;

namespace Nova.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public sealed class GameObjectsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ISceneBroadcaster _broadcaster;

    public GameObjectsController(AppDbContext db, ISceneBroadcaster broadcaster)
    {
        _db = db;
        _broadcaster = broadcaster;
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<GameObjectDto>> Get(Guid id, CancellationToken ct)
    {
        var go = await _db.GameObjects
            .Include(g => g.Components)
            .Include(g => g.Children)
            .FirstOrDefaultAsync(g => g.Id == id, ct);
        if (go is null) return NotFound();
        return Ok(MapDto(go));
    }

    [HttpPost]
    public async Task<ActionResult<GameObjectDto>> Create([FromBody] CreateGameObjectRequest request, CancellationToken ct)
    {
        var scene = await _db.Scenes.FindAsync([request.SceneId], ct);
        if (scene is null) return NotFound(new { error = "Scene not found" });

        var go = new GameObject
        {
            Name = request.Name,
            SceneId = request.SceneId,
            ParentId = request.ParentId,
            SiblingIndex = await _db.GameObjects.Where(g => g.SceneId == request.SceneId && g.ParentId == request.ParentId).CountAsync(ct)
        };

        _db.GameObjects.Add(go);
        await _db.SaveChangesAsync(ct);

        await _broadcaster.BroadcastAsync(request.SceneId, "GameObjectCreated", MapDto(go), ct);
        return CreatedAtAction(nameof(Get), new { id = go.Id }, MapDto(go));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<GameObjectDto>> Update(Guid id, [FromBody] GameObjectDto dto, CancellationToken ct)
    {
        var go = await _db.GameObjects.Include(g => g.Components).FirstOrDefaultAsync(g => g.Id == id, ct);
        if (go is null) return NotFound();

        go.Name = dto.Name;
        go.IsActive = dto.IsActive;
        go.Layer = dto.Layer;
        go.Tag = dto.Tag;
        go.Transform.Position = new(dto.Transform.Px, dto.Transform.Py, dto.Transform.Pz);
        go.Transform.Rotation = new(dto.Transform.Rx, dto.Transform.Ry, dto.Transform.Rz, dto.Transform.Rw);
        go.Transform.Scale = new(dto.Transform.Sx, dto.Transform.Sy, dto.Transform.Sz);

        await _db.SaveChangesAsync(ct);
        await _broadcaster.BroadcastAsync(go.SceneId, "GameObjectUpdated", MapDto(go), ct);
        return Ok(MapDto(go));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var go = await _db.GameObjects.FindAsync([id], ct);
        if (go is null) return NotFound();

        _db.GameObjects.Remove(go);
        await _db.SaveChangesAsync(ct);
        await _broadcaster.BroadcastAsync(go.SceneId, "GameObjectDeleted", new { id }, ct);
        return NoContent();
    }

    [HttpPut("{id:guid}/parent")]
    public async Task<IActionResult> Reparent(Guid id, [FromQuery] Guid? newParentId, [FromQuery] int siblingIndex, CancellationToken ct)
    {
        var go = await _db.GameObjects.FindAsync([id], ct);
        if (go is null) return NotFound();
        go.ParentId = newParentId;
        go.SiblingIndex = siblingIndex;
        await _db.SaveChangesAsync(ct);
        return Ok();
    }

    private static GameObjectDto MapDto(GameObject g)
    {
        return new GameObjectDto(
            g.Id, g.SceneId, g.ParentId, g.Name, g.IsActive, g.Layer, g.Tag, g.SiblingIndex,
            new UpdateTransformDto(
                g.Transform.Position.X, g.Transform.Position.Y, g.Transform.Position.Z,
                g.Transform.Rotation.X, g.Transform.Rotation.Y, g.Transform.Rotation.Z, g.Transform.Rotation.W,
                g.Transform.Scale.X, g.Transform.Scale.Y, g.Transform.Scale.Z),
            g.Components?.OrderBy(c => c.Order).Select(c => new ComponentDto(c.Id, c.GameObjectId, c.Kind, c.Enabled, c.PropertiesJson, c.Order)).ToList() ?? [],
            []
        );
    }
}

