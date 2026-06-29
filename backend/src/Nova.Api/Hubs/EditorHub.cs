using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Nova.Api.Hubs;

[Authorize]
public sealed class EditorHub : Hub
{
    private readonly ILogger<EditorHub> _logger;

    public EditorHub(ILogger<EditorHub> logger) => _logger = logger;

    public async Task JoinProject(string projectId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"project-{projectId}");
        _logger.LogInformation("User {User} joined project {Project}", Context.UserIdentifier, projectId);
    }

    public async Task LeaveProject(string projectId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"project-{projectId}");
    }

    public async Task CursorMoved(object payload)
    {
        var projectId = Context.GetHttpContext()?.Request.Query["projectId"].FirstOrDefault();
        if (projectId is not null)
            await Clients.OthersInGroup($"project-{projectId}").SendAsync("CursorMoved", payload);
    }

    public async Task SelectionChanged(object payload)
    {
        var projectId = Context.GetHttpContext()?.Request.Query["projectId"].FirstOrDefault();
        if (projectId is not null)
            await Clients.OthersInGroup($"project-{projectId}").SendAsync("SelectionChanged", payload);
    }
}
