using Microsoft.Extensions.Logging;
using Nova.Application.Abstractions;

namespace Nova.Infrastructure.Ai;

public sealed class LocalAiAgent : IAiAgent
{
    private readonly ILogger<LocalAiAgent> _logger;

    public LocalAiAgent(ILogger<LocalAiAgent> logger) => _logger = logger;

    public IReadOnlyCollection<string> Capabilities { get; } =
    [
        "generate-scene", "generate-gameobject", "generate-script", "generate-animation",
        "generate-ui", "generate-shader", "generate-terrain", "generate-npc",
        "generate-quest", "generate-dialogue", "generate-material", "generate-texture", "generate-sound"
    ];

    public Task<AgentResponse> ExecuteAsync(AgentRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation("AI stub: {Capability} — {Prompt[:50]}", request.Capability, request.Prompt?[..Math.Min(50, request.Prompt?.Length ?? 0)]);
        return Task.FromResult(new AgentResponse(true, $"[Stub] Generated content for {request.Capability}. In production this calls an LLM."));
    }
}

public sealed class LocalAiAgentRegistry : IAiAgentRegistry
{
    private readonly IEnumerable<IAiAgent> _agents;

    public LocalAiAgentRegistry(IEnumerable<IAiAgent> agents) => _agents = agents;

    public IAiAgent Resolve(string capability) =>
        _agents.FirstOrDefault(a => a.Capabilities.Contains(capability))
        ?? throw new KeyNotFoundException($"No agent registered for capability '{capability}'");

    public IReadOnlyCollection<string> AvailableCapabilities =>
        _agents.SelectMany(a => a.Capabilities).Distinct().ToList().AsReadOnly();
}
