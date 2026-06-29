using System.Security.Claims;
using Nova.Application.Abstractions;

namespace Nova.Api.Middleware;

public sealed class AuditLoggingMiddleware
{
    private readonly RequestDelegate _next;

    public AuditLoggingMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Method != "GET" && context.Request.Method != "OPTIONS" && context.Request.Method != "HEAD")
        {
            var audit = context.RequestServices.GetRequiredService<IAuditLogger>();
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
            var ip = context.Connection.RemoteIpAddress?.ToString();

            await audit.LogAsync(
                userId is not null && Guid.TryParse(userId, out var g) ? g : null,
                $"{context.Request.Method} {context.Request.Path}",
                ip: ip
            );
        }

        await _next(context);
    }
}
