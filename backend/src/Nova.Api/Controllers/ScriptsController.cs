using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nova.Application.Abstractions;
using Nova.Application.Dtos;
using Nova.Domain.Scripts;

namespace Nova.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public sealed class ScriptsController : ControllerBase
{
    private readonly IScriptRepository _scripts;
    private readonly IScriptingService _compiler;

    public ScriptsController(IScriptRepository scripts, IScriptingService compiler)
    {
        _scripts = scripts;
        _compiler = compiler;
    }

    [HttpGet("project/{projectId:guid}")]
    public async Task<ActionResult<IReadOnlyList<ScriptDto>>> List(Guid projectId, CancellationToken ct)
    {
        var list = await _scripts.ListForProjectAsync(projectId, ct);
        return Ok(list.Select(MapScript).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ScriptDto>> Get(Guid id, CancellationToken ct)
    {
        var script = await _scripts.GetAsync(id, ct);
        if (script is null) return NotFound();
        return Ok(MapScript(script));
    }

    [HttpPost]
    public async Task<ActionResult<ScriptDto>> Create([FromBody] CreateScriptRequest request, CancellationToken ct)
    {
        var className = request.ClassName ?? request.Name.Replace(".cs", "");
        var source = request.Source ?? $@"using UnityEngine;

public class {className} : MonoBehaviour
{{
    void Start()
    {{
        // Initialization
    }}

    void Update()
    {{
        // Frame update
    }}
}}";

        var script = new Script
        {
            ProjectId = request.ProjectId,
            Name = request.Name.EndsWith(".cs") ? request.Name : $"{request.Name}.cs",
            FullyQualifiedClassName = className,
            CurrentSource = source
        };

        // Compile
        var result = await _compiler.CompileAsync(new ScriptCompilationRequest(script.Name, source, className), ct);
        script.Compiles = result.Success;
        script.ErrorCount = result.Diagnostics.Count(d => d.Severity == "Error");
        script.WarningCount = result.Diagnostics.Count(d => d.Severity == "Warning");

        await _scripts.AddAsync(script, ct);
        await _scripts.SaveChangesAsync(ct);
        script.Versions.Add(new ScriptVersion
        {
            ScriptId = script.Id,
            Version = 1,
            Source = source,
            Compiles = result.Success,
            AssemblyHash = result.AssemblyHash
        });
        await _scripts.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(Get), new { id = script.Id }, MapScript(script));
    }

    [HttpPut("{id:guid}/source")]
    public async Task<ActionResult<CompileResultDto>> UpdateSource(Guid id, [FromBody] UpdateScriptSourceRequest request, CancellationToken ct)
    {
        var script = await _scripts.GetAsync(id, ct);
        if (script is null) return NotFound();

        var result = await _compiler.CompileAsync(
            new ScriptCompilationRequest(script.Name, request.Source, script.FullyQualifiedClassName), ct);

        script.CurrentSource = request.Source;
        script.CurrentVersion++;
        script.Compiles = result.Success;
        script.ErrorCount = result.Diagnostics.Count(d => d.Severity == "Error");
        script.WarningCount = result.Diagnostics.Count(d => d.Severity == "Warning");
        script.Versions.Add(new ScriptVersion
        {
            ScriptId = script.Id,
            Version = script.CurrentVersion,
            Source = request.Source,
            Compiles = result.Success,
            AssemblyHash = result.AssemblyHash,
            DiagnosticsJson = System.Text.Json.JsonSerializer.Serialize(result.Diagnostics)
        });

        await _scripts.SaveChangesAsync(ct);

        return Ok(new CompileResultDto(result.Success,
            result.Diagnostics.Select(d => new CompileDiagnosticDto(d.Severity, d.Code, d.Message, d.StartLine, d.StartColumn, d.EndLine, d.EndColumn)).ToList()));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var script = await _scripts.GetAsync(id, ct);
        if (script is null) return NotFound();
        _scripts.Remove(script);
        await _scripts.SaveChangesAsync(ct);
        return NoContent();
    }

    private static ScriptDto MapScript(Script s) =>
        new(s.Id, s.ProjectId, s.Name, s.FullyQualifiedClassName, s.CurrentSource, s.CurrentVersion, s.Compiles, s.ErrorCount, s.WarningCount, s.UpdatedAtUtc);
}

