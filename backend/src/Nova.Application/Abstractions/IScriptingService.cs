using Nova.Domain;

namespace Nova.Application.Abstractions;

/// <summary>
/// Compiles user-authored C# scripts (MonoBehaviour-style) and returns diagnostics.
/// The default implementation uses Roslyn in-process.
/// </summary>
public interface IScriptingService
{
    Task<ScriptCompilationResult> CompileAsync(ScriptCompilationRequest request, CancellationToken ct = default);
}

public sealed record ScriptCompilationRequest(
    string ScriptName,
    string Source,
    string? ClassName = null,
    IReadOnlyCollection<string>? AdditionalReferences = null);

public sealed record ScriptCompilationResult(
    bool Success,
    IReadOnlyList<ScriptDiagnostic> Diagnostics,
    string? AssemblyHash);

public sealed record ScriptDiagnostic(
    string Severity,   // "Error" | "Warning" | "Info"
    string Code,       // e.g. "CS0103"
    string Message,
    int StartLine,     // 0-based
    int StartColumn,
    int EndLine,
    int EndColumn);
