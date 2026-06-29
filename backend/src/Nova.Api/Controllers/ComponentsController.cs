using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nova.Application.Abstractions;
using Nova.Application.Dtos;
using Nova.Domain.GameObjects;
using Nova.Infrastructure.Persistence;

namespace Nova.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public sealed class ComponentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ISceneBroadcaster _broadcaster;

    public ComponentsController(AppDbContext db, ISceneBroadcaster broadcaster)
    {
        _db = db;
        _broadcaster = broadcaster;
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ComponentDto>> Get(Guid id, CancellationToken ct)
    {
        var c = await _db.Components.FindAsync([id], ct);
        if (c is null) return NotFound();
        return Ok(MapDto(c));
    }

    [HttpPost]
    public async Task<ActionResult<ComponentDto>> Add([FromBody] AddComponentRequest request, CancellationToken ct)
    {
        var maxOrder = await _db.Components.Where(c => c.GameObjectId == request.GameObjectId)
            .MaxAsync(c => (int?)c.Order, ct) ?? 0;

        var component = new GameComponent
        {
            GameObjectId = request.GameObjectId,
            Kind = request.Kind,
            PropertiesJson = request.PropertiesJson,
            Order = maxOrder + 1
        };

        _db.Components.Add(component);
        await _db.SaveChangesAsync(ct);

        var go = await _db.GameObjects.FindAsync([request.GameObjectId], ct);
        if (go is not null)
            await _broadcaster.BroadcastAsync(go.SceneId, "ComponentAdded", MapDto(component), ct);

        return CreatedAtAction(nameof(Get), new { id = component.Id }, MapDto(component));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ComponentDto>> Update(Guid id, [FromBody] UpdateComponentRequest request, CancellationToken ct)
    {
        var c = await _db.Components.FindAsync([id], ct);
        if (c is null) return NotFound();

        c.Kind = request.Kind;
        c.PropertiesJson = request.PropertiesJson;
        await _db.SaveChangesAsync(ct);

        var go = await _db.GameObjects.FindAsync([c.GameObjectId], ct);
        if (go is not null)
            await _broadcaster.BroadcastAsync(go.SceneId, "ComponentUpdated", MapDto(c), ct);

        return Ok(MapDto(c));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var c = await _db.Components.FindAsync([id], ct);
        if (c is null) return NotFound();

        _db.Components.Remove(c);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static ComponentDto MapDto(GameComponent c) =>
        new(c.Id, c.GameObjectId, c.Kind, c.Enabled, c.PropertiesJson, c.Order);
}

