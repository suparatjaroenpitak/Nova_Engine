using System.Collections.Immutable;
using System.Reflection;
using System.Text;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Emit;
using Microsoft.Extensions.Logging;
using Nova.Application.Abstractions;

namespace Nova.Infrastructure.Scripting;

public sealed class RoslynScriptingService : IScriptingService
{
    private readonly ILogger<RoslynScriptingService> _logger;
    private static readonly Assembly Corlib = typeof(object).Assembly;
    private static readonly Assembly SystemCore = typeof(Enumerable).Assembly;
    private static readonly Assembly Collections = typeof(List<>).Assembly;

    private static readonly string[] DefaultUsings =
    [
        "System", "System.Collections", "System.Collections.Generic",
        "System.Linq", "System.Text", "System.Threading.Tasks",
        "UnityEngine", "Nova.Engine"
    ];

    public RoslynScriptingService(ILogger<RoslynScriptingService> logger) => _logger = logger;

    public Task<ScriptCompilationResult> CompileAsync(ScriptCompilationRequest request, CancellationToken ct = default)
    {
        var className = request.ClassName ?? ExtractClassName(request.ScriptName);
        var source = BuildScriptSource(request.Source, className);

        var syntaxTree = CSharpSyntaxTree.ParseText(source,
            CSharpParseOptions.Default.WithLanguageVersion(LanguageVersion.Latest));

        var references = new[]
        {
            MetadataReference.CreateFromFile(Corlib.Location),
            MetadataReference.CreateFromFile(SystemCore.Location),
            MetadataReference.CreateFromFile(Collections.Location),
            MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
            MetadataReference.CreateFromFile(Assembly.Load("System.Runtime").Location),
        };

        var assemblyName = $"Nova.Scripts.{className}.{Guid.NewGuid():N}";

        var compilation = CSharpCompilation.Create(assemblyName,
            [syntaxTree],
            references,
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary,
                optimizationLevel: OptimizationLevel.Debug,
                allowUnsafe: true));

        using var ms = new MemoryStream();
        var result = compilation.Emit(ms);

        var diagnostics = result.Diagnostics
            .Where(d => d.Severity is DiagnosticSeverity.Error or DiagnosticSeverity.Warning or DiagnosticSeverity.Info)
            .Select(d => new ScriptDiagnostic(
                d.Severity.ToString(),
                d.Id,
                d.GetMessage(),
                d.Location.GetLineSpan().StartLinePosition.Line,
                d.Location.GetLineSpan().StartLinePosition.Character,
                d.Location.GetLineSpan().EndLinePosition.Line,
                d.Location.GetLineSpan().EndLinePosition.Character
            )).ToList().AsReadOnly();

        var success = result.Success;
        var assemblyHash = success ? ComputeHash(ms) : null;

        _logger.LogInformation("Compiled {Name} → {Success} ({Errors} errors, {Warnings} warnings)",
            className, success,
            diagnostics.Count(d => d.Severity == "Error"),
            diagnostics.Count(d => d.Severity == "Warning"));

        return Task.FromResult(new ScriptCompilationResult(success, diagnostics, assemblyHash));
    }

    private static string BuildScriptSource(string source, string className)
    {
        var usings = string.Join("\n", DefaultUsings.Select(u => $"using {u};"));
        return $@"{usings}

public class {className} : MonoBehaviour
{{
    void Awake() {{ }}
    void Start() {{ }}
    void Update() {{ }}
    void LateUpdate() {{ }}
    void FixedUpdate() {{ }}
    void OnTriggerEnter(Collider other) {{ }}
    void OnCollisionEnter(Collision collision) {{ }}

{source}
}}";
    }

    private static string ExtractClassName(string scriptName)
    {
        var name = Path.GetFileNameWithoutExtension(scriptName);
        return name.Replace(" ", "").Replace("-", "_");
    }

    private static string ComputeHash(MemoryStream ms)
    {
        ms.Position = 0;
        using var sha = System.Security.Cryptography.SHA256.Create();
        var hash = sha.ComputeHash(ms);
        return Convert.ToHexStringLower(hash);
    }
}
