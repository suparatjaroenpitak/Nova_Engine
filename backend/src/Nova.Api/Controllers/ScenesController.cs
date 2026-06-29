using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nova.Application.Abstractions;
using Nova.Application.Dtos;
using Nova.Domain.Scenes;

namespace Nova.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public sealed class ScenesController : ControllerBase
{
    private readonly ISceneRepository _scenes;
    private readonly ISceneBroadcaster _broadcaster;

    public ScenesController(ISceneRepository scenes, ISceneBroadcaster broadcaster)
    {
        _scenes = scenes;
        _broadcaster = broadcaster;
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SceneDto>> Get(Guid id, CancellationToken ct)
    {
        var scene = await _scenes.GetAsync(id, ct);
        if (scene is null) return NotFound();
        return Ok(MapScene(scene));
    }

    [HttpPost]
    public async Task<ActionResult<SceneDto>> Create([FromBody] CreateSceneRequest request, CancellationToken ct)
    {
        var scene = new Scene
        {
            Name = request.Name,
            ProjectId = request.ProjectId
        };
        await _scenes.AddAsync(scene, ct);
        await _scenes.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = scene.Id }, MapScene(scene));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SceneDto>> Update(Guid id, [FromBody] UpdateSceneRequest request, CancellationToken ct)
    {
        var scene = await _scenes.GetAsync(id, ct);
        if (scene is null) return NotFound();
        scene.Name = request.Name;
        if (request.SettingsJson is not null)
            scene.SettingsJson = request.SettingsJson;
        _scenes.Update(scene);
        await _scenes.SaveChangesAsync(ct);

        await _broadcaster.BroadcastAsync(id, "SceneUpdated", MapScene(scene), ct);
        return Ok(MapScene(scene));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var scene = await _scenes.GetAsync(id, ct);
        if (scene is null) return NotFound();
        _scenes.Remove(scene);
        await _scenes.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("{id:guid}/gameobjects")]
    public async Task<ActionResult<List<GameObjectDto>>> GetGameObjects(Guid id, CancellationToken ct)
    {
        var scene = await _scenes.GetWithGameObjectsAsync(id, ct);
        if (scene is null) return NotFound();

        var roots = scene.GameObjects.Where(g => g.ParentId is null).OrderBy(g => g.SiblingIndex).ToList();
        return Ok(roots.Select(MapGameObject).ToList());
    }

    private static SceneDto MapScene(Scene s) =>
        new(s.Id, s.ProjectId, s.Name, s.IsMain, s.SettingsJson, s.GameObjects?.Count ?? 0);

    private static GameObjectDto MapGameObject(GameObject g)
    {
        return new GameObjectDto(
            g.Id, g.SceneId, g.ParentId, g.Name, g.IsActive, g.Layer, g.Tag, g.SiblingIndex,
            new UpdateTransformDto(
                g.Transform.Position.X, g.Transform.Position.Y, g.Transform.Position.Z,
                g.Transform.Rotation.X, g.Transform.Rotation.Y, g.Transform.Rotation.Z, g.Transform.Rotation.W,
                g.Transform.Scale.X, g.Transform.Scale.Y, g.Transform.Scale.Z),
            g.Components?.OrderBy(c => c.Order).Select(c => new ComponentDto(c.Id, c.GameObjectId, c.Kind, c.Enabled, c.PropertiesJson, c.Order)).ToList() ?? [],
            g.Children?.OrderBy(c => c.SiblingIndex).Select(MapGameObject).ToList() ?? []
        );
    }
}

