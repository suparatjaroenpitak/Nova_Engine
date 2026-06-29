using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Nova.Application;
using Nova.Application.Abstractions;
using Nova.Domain;
using Nova.Domain.Accounts;
using Nova.Infrastructure.Persistence;

namespace Nova.Infrastructure.Authentication;

public sealed class TokenService : ITokenService
{
    private readonly AppDbContext _db;
    private readonly JwtOptions _jwt;
    private readonly IPasswordHasher _hasher;

    public TokenService(AppDbContext db, IOptions<JwtOptions> jwt, IPasswordHasher hasher)
    {
        _db = db;
        _jwt = jwt.Value;
        _hasher = hasher;
    }

    public async Task<(string accessToken, RefreshTokenIssue refreshToken)> IssueAsync(User user, CancellationToken ct = default)
    {
        var accessToken = GenerateAccessToken(user);
        var (token, expiresAt) = GenerateRefreshToken();
        var tokenHash = HashRefreshToken(token);

        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAtUtc = expiresAt
        });
        await _db.SaveChangesAsync(ct);

        return (accessToken, new RefreshTokenIssue(token, expiresAt));
    }

    public async Task<(string accessToken, RefreshTokenIssue refreshToken, Guid userId)?> RefreshAsync(string refreshToken, CancellationToken ct = default)
    {
        var tokenHash = HashRefreshToken(refreshToken);
        var stored = await _db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.TokenHash == tokenHash && r.IsActive, ct);

        if (stored is null || stored.User is null)
            return null;

        stored.RevokedAtUtc = DateTime.UtcNow;
        stored.ReplacedByTokenHash = tokenHash;

        var newAccessToken = GenerateAccessToken(stored.User);
        var (newToken, expiresAt) = GenerateRefreshToken();
        var newTokenHash = HashRefreshToken(newToken);

        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = stored.UserId,
            TokenHash = newTokenHash,
            ExpiresAtUtc = expiresAt,
            ReplacedByTokenHash = null
        });
        await _db.SaveChangesAsync(ct);

        return (newAccessToken, new RefreshTokenIssue(newToken, expiresAt), stored.UserId);
    }

    public async Task RevokeAsync(string refreshToken, CancellationToken ct = default)
    {
        var tokenHash = HashRefreshToken(refreshToken);
        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == tokenHash, ct);
        if (stored is not null)
        {
            stored.RevokedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
    }

    private string GenerateAccessToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.SigningKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.DisplayName),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwt.AccessTokenMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static (string token, DateTime expiresAt) GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        var token = Convert.ToBase64String(bytes);
        return (token, DateTime.UtcNow.AddDays(7));
    }

    private static string HashRefreshToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }
}
