using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace SchoolManagement.Infrastructure.Persistence;

// Migration tooling must not run the application's automatic migration/seed pipeline.
public sealed class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var directory = new DirectoryInfo(Directory.GetCurrentDirectory());
        string? settingsDirectory = null;
        while (directory != null && settingsDirectory == null)
        {
            settingsDirectory = new[]
            {
                directory.FullName,
                Path.Combine(directory.FullName, "src", "SchoolManagement.Api"),
                Path.Combine(directory.FullName, "backend", "src", "SchoolManagement.Api")
            }.FirstOrDefault(path => File.Exists(Path.Combine(path, "appsettings.json")));
            directory = directory.Parent;
        }
        if (settingsDirectory == null) throw new InvalidOperationException("Run migration tools from the project repository.");
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT") ?? "Development";
        var configuration = new ConfigurationBuilder().SetBasePath(settingsDirectory)
            .AddJsonFile("appsettings.json")
            .AddJsonFile($"appsettings.{environment}.json", optional: true)
            .AddEnvironmentVariables().Build();
        var connection = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Configure ConnectionStrings:DefaultConnection before running migration tools.");
        return new(new DbContextOptionsBuilder<ApplicationDbContext>().UseNpgsql(connection).Options);
    }
}
