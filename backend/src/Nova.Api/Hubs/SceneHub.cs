using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Nova.Application.Abstractions;

namespace Nova.Api.Hubs;

[Authorize]
public sealed class SceneHub : Hub
{
    private readonly ILogger<SceneHub> _logger;

    public SceneHub(ILogger<SceneHub> logger) => _logger = logger;

    public async Task JoinScene(string sceneId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"scene-{sceneId}");
        _logger.LogInformation("User {User} joined scene {Scene}", Context.UserIdentifier, sceneId);
    }

    public async Task LeaveScene(string sceneId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"scene-{sceneId}");
    }

    public async Task GameObjectCreated(object payload)
    {
        var sceneId = Context.GetHttpContext()?.Request.Query["sceneId"].FirstOrDefault();
        if (sceneId is not null)
            await Clients.OthersInGroup($"scene-{sceneId}").SendAsync("GameObjectCreated", payload);
    }

    public async Task GameObjectUpdated(object payload)
    {
        var sceneId = Context.GetHttpContext()?.Request.Query["sceneId"].FirstOrDefault();
        if (sceneId is not null)
            await Clients.OthersInGroup($"scene-{sceneId}").SendAsync("GameObjectUpdated", payload);
    }

    public async Task GameObjectDeleted(object payload)
    {
        var sceneId = Context.GetHttpContext()?.Request.Query["sceneId"].FirstOrDefault();
        if (sceneId is not null)
            await Clients.OthersInGroup($"scene-{sceneId}").SendAsync("GameObjectDeleted", payload);
    }

    public async Task ComponentUpdated(object payload)
    {
        var sceneId = Context.GetHttpContext()?.Request.Query["sceneId"].FirstOrDefault();
        if (sceneId is not null)
            await Clients.OthersInGroup($"scene-{sceneId}").SendAsync("ComponentUpdated", payload);
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected: {Id}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected: {Id}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
