using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nova.Application.Abstractions;
using Nova.Application.Dtos;
using Nova.Domain.Accounts;
using Nova.Domain;
using Nova.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Nova.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public sealed class AuthController : ControllerBase
{
    private readonly IUserRepository _users;
    private readonly ITokenService _tokens;
    private readonly IPasswordHasher _hasher;
    private readonly AppDbContext _db;

    public AuthController(IUserRepository users, ITokenService tokens, IPasswordHasher hasher, AppDbContext db)
    {
        _users = users;
        _tokens = tokens;
        _hasher = hasher;
        _db = db;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        if (await _users.GetByEmailAsync(request.Email, ct) is not null)
            return Conflict(new { error = "Email already registered" });

        var user = new User
        {
            Email = request.Email,
            DisplayName = request.DisplayName ?? request.Email.Split('@')[0],
            PasswordHash = _hasher.Hash(request.Password),
            Role = UserRole.User
        };

        await _users.AddAsync(user, ct);
        var (accessToken, refreshToken) = await _tokens.IssueAsync(user, ct);

        return Ok(new AuthResponse(accessToken, refreshToken.Token, MapUser(user)));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var user = await _users.GetByEmailAsync(request.Email, ct);
        if (user is null || user.PasswordHash is null || !_hasher.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { error = "Invalid email or password" });

        var (accessToken, refreshToken) = await _tokens.IssueAsync(user, ct);
        return Ok(new AuthResponse(accessToken, refreshToken.Token, MapUser(user)));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshRequest request, CancellationToken ct)
    {
        var result = await _tokens.RefreshAsync(request.RefreshToken, ct);
        if (result is null)
            return Unauthorized(new { error = "Invalid or expired refresh token" });

        var user = await _users.GetByEmailAsync(User.Identity?.Name ?? string.Empty, ct);
        return Ok(new AuthResponse(result.Value.accessToken, result.Value.refreshToken.Token, user is not null ? MapUser(user) : null!));
    }

    [HttpPost("revoke")]
    [Authorize]
    public async Task<IActionResult> Revoke([FromBody] RefreshRequest request, CancellationToken ct)
    {
        await _tokens.RevokeAsync(request.RefreshToken, ct);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me(CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var user = await _users.GetAsync(userId, ct);
        if (user is null) return NotFound();
        return Ok(MapUser(user));
    }

    private static UserDto MapUser(User u) =>
        new(u.Id, u.Email, u.DisplayName, u.Role.ToString(), u.AvatarUrl);
}

