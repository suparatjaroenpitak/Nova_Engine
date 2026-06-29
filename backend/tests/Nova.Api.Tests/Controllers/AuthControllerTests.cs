using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Nova.Api.Controllers;
using Nova.Application.Abstractions;
using Nova.Application.Dtos;
using Nova.Domain;
using Nova.Domain.Accounts;
using Xunit;

namespace Nova.Api.Tests.Controllers;

public sealed class AuthControllerTests
{
    private readonly Mock<IUserRepository> _users = new();
    private readonly Mock<ITokenService> _tokens = new();
    private readonly Mock<IPasswordHasher> _hasher = new();
    private readonly Mock<IAuditLogger> _audit = new();
    private readonly Mock<IRepository<User>> _userRepo = new();
    private readonly AuthController _sut;

    public AuthControllerTests()
    {
        _sut = new AuthController(_users.Object, _tokens.Object, _hasher.Object, null!);
    }

    [Fact]
    public async Task Register_Should_Return_AuthResponse()
    {
        var request = new RegisterRequest("test@test.com", "Pass123!", "Test");
        _users.Setup(x => x.GetByEmailAsync(request.Email, default)).ReturnsAsync((User?)null);
        _hasher.Setup(x => x.Hash(request.Password)).Returns("hashed");
        _tokens.Setup(x => x.IssueAsync(It.IsAny<User>(), default))
            .ReturnsAsync(("access", new RefreshTokenIssue("refresh", DateTime.UtcNow.AddDays(7))));

        var result = await _sut.Register(request, default);

        result.Result.Should().BeOfType<OkObjectResult>();
        var response = (result.Result as OkObjectResult)!.Value as AuthResponse;
        response.Should().NotBeNull();
        response!.AccessToken.Should().Be("access");
    }

    [Fact]
    public async Task Register_Should_Return_Conflict_When_Email_Exists()
    {
        var request = new RegisterRequest("existing@test.com", "Pass123!", "Existing");
        _users.Setup(x => x.GetByEmailAsync(request.Email, default))
            .ReturnsAsync(new User { Email = request.Email });

        var result = await _sut.Register(request, default);

        result.Result.Should().BeOfType<ConflictObjectResult>();
    }

    [Fact]
    public async Task Login_Should_Return_Unauthorized_With_Wrong_Password()
    {
        var request = new LoginRequest("test@test.com", "wrong");
        var user = new User { Email = request.Email, PasswordHash = "hash" };
        _users.Setup(x => x.GetByEmailAsync(request.Email, default)).ReturnsAsync(user);
        _hasher.Setup(x => x.Verify("wrong", "hash")).Returns(false);

        var result = await _sut.Login(request, default);

        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }
}
