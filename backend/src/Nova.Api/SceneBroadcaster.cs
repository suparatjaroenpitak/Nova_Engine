using Microsoft.AspNetCore.SignalR;
using Nova.Api.Hubs;
using Nova.Application.Abstractions;

namespace Nova.Api;

public sealed class SceneBroadcaster : ISceneBroadcaster
{
    private readonly IHubContext<SceneHub> _hub;

    public SceneBroadcaster(IHubContext<SceneHub> hub) => _hub = hub;

    public async Task BroadcastAsync(Guid sceneId, string eventType, object payload, CancellationToken ct = default) =>
        await _hub.Clients.Group($"scene-{sceneId}").SendAsync(eventType, payload, ct);

    public async Task NotifyUserAsync(Guid userId, string eventType, object payload, CancellationToken ct = default) =>
        await _hub.Clients.User(userId.ToString()).SendAsync(eventType, payload, ct);
}
