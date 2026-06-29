using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Nova.Application.Abstractions;
using Nova.Domain;

namespace Nova.Infrastructure.Authentication;

public sealed class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _http;

    public CurrentUserService(IHttpContextAccessor http) => _http = http;

    public Guid? UserId
    {
        get
        {
            var id = _http.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
            return id is not null && Guid.TryParse(id, out var g) ? g : null;
        }
    }

    public UserRole? Role
    {
        get
        {
            var role = _http.HttpContext?.User.FindFirstValue(ClaimTypes.Role);
            return role is not null && Enum.TryParse<UserRole>(role, out var r) ? r : null;
        }
    }

    public bool IsAuthenticated => UserId.HasValue;
}
