using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Nova.Domain.Projects;
using Nova.Domain.Scenes;
using Nova.Infrastructure.Persistence;
using Xunit;

namespace Nova.Infrastructure.Tests.Persistence;

public sealed class AppDbContextTests
{
    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task Can_Create_Project_With_Scene()
    {
        using var db = CreateDb();

        var project = new Project { Name = "Test Project", OwnerId = Guid.NewGuid() };
        db.Projects.Add(project);
        await db.SaveChangesAsync();

        var scene = new Scene { Name = "Main Scene", ProjectId = project.Id };
        db.Scenes.Add(scene);
        await db.SaveChangesAsync();

        var loaded = await db.Projects.Include(p => p.Scenes).FirstAsync();
        loaded.Name.Should().Be("Test Project");
        loaded.Scenes.Should().HaveCount(1);
        loaded.Scenes[0].Name.Should().Be("Main Scene");
    }

    [Fact]
    public async Task Soft_Delete_Sets_IsDeleted()
    {
        using var db = CreateDb();

        var project = new Project { Name = "To Delete" };
        db.Projects.Add(project);
        await db.SaveChangesAsync();

        db.Projects.Remove(project);
        await db.SaveChangesAsync();

        var deleted = await db.Projects.IgnoreQueryFilters().FirstAsync(p => p.Id == project.Id);
        deleted.IsDeleted.Should().BeTrue();
        deleted.DeletedAtUtc.Should().NotBeNull();
    }
}
