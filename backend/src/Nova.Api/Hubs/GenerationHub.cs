using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Nova.Application.Abstractions;

namespace Nova.Api.Hubs;

[Authorize]
public sealed class GenerationHub : Hub
{
    private readonly ILogger<GenerationHub> _logger;

    public GenerationHub(ILogger<GenerationHub> logger)
    {
        _logger = logger;
    }

    public async Task JoinProject(string projectId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"project-{projectId}");
    }

    public async Task LeaveProject(string projectId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"project-{projectId}");
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("GenerationHub client connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("GenerationHub client disconnected: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
