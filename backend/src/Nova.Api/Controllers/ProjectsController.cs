using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nova.Application.Abstractions;
using Nova.Application.Dtos;
using Nova.Domain.Projects;

namespace Nova.Api.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[Authorize]
public sealed class ProjectsController : ControllerBase
{
    private readonly IProjectRepository _projects;
    private readonly ICurrentUserService _currentUser;

    public ProjectsController(IProjectRepository projects, ICurrentUserService currentUser)
    {
        _projects = projects;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProjectDto>>> List(CancellationToken ct)
    {
        var list = await _projects.ListForUserAsync(_currentUser.UserId!.Value, ct);
        return Ok(list.Select(MapProject).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProjectDto>> Get(Guid id, CancellationToken ct)
    {
        var project = await _projects.GetAsync(id, ct);
        if (project is null) return NotFound();
        return Ok(MapProject(project));
    }

    [HttpPost]
    public async Task<ActionResult<ProjectDto>> Create([FromBody] CreateProjectRequest request, CancellationToken ct)
    {
        var project = new Project
        {
            Name = request.Name,
            Description = request.Description,
            OwnerId = _currentUser.UserId!.Value,
            Is3D = request.Is3D,
            RenderPipeline = request.RenderPipeline
        };
        await _projects.AddAsync(project, ct);
        await _projects.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = project.Id }, MapProject(project));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ProjectDto>> Update(Guid id, [FromBody] UpdateProjectRequest request, CancellationToken ct)
    {
        var project = await _projects.GetAsync(id, ct);
        if (project is null) return NotFound();
        project.Name = request.Name;
        project.Description = request.Description;
        _projects.Update(project);
        await _projects.SaveChangesAsync(ct);
        return Ok(MapProject(project));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var project = await _projects.GetAsync(id, ct);
        if (project is null) return NotFound();
        _projects.Remove(project);
        await _projects.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("{id:guid}/scenes")]
    public async Task<ActionResult<IReadOnlyList<SceneDto>>> GetScenes(Guid id, CancellationToken ct)
    {
        var project = await _projects.GetWithScenesAsync(id, ct);
        if (project is null) return NotFound();
        return Ok(project.Scenes.Select(s => new SceneDto(s.Id, s.ProjectId, s.Name, s.IsMain, s.SettingsJson, s.GameObjects.Count)).ToList());
    }

    private static ProjectDto MapProject(Project p) =>
        new(p.Id, p.Name, p.Description, p.OwnerId, p.Visibility.ToString(), p.RenderPipeline, p.Is3D, p.CreatedAtUtc, p.Scenes?.Count ?? 0);
}
