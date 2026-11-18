using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Hosting;
using SchoolManagement.Api.Controllers;
using SchoolManagement.Api.Security;
using SchoolManagement.Application;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Domain.Auth;
using SchoolManagement.Infrastructure.Identity;
using SchoolManagement.Infrastructure.Persistence;
using Xunit;

namespace SchoolManagement.SecurityTests;

public class SecurityTests : IDisposable
{
    private readonly TestServer server;
    private readonly IHost host;
    private readonly HttpClient client;
    private const string CorrectPassword = "Actual-Test-Password!42";
    private static readonly string TestPasswordHash = BCrypt.Net.BCrypt.HashPassword(CorrectPassword);

    public SecurityTests()
    {
        var databaseName = Guid.NewGuid().ToString();
        host = new HostBuilder().ConfigureWebHost(web => web.UseTestServer()
            .ConfigureAppConfiguration(configuration => configuration.AddInMemoryCollection(
                new Dictionary<string, string?> { ["Jwt:SecretKey"] = "Test-only-signing-key-at-least-thirty-two-bytes-long!" }))
            .ConfigureServices(services =>
            {
                services.AddControllers(options => options.Filters.Add(new PreventSensitiveActionExecution()))
                    .AddApplicationPart(typeof(AuthController).Assembly);
                services.AddDbContext<ApplicationDbContext>(options => options.UseInMemoryDatabase(databaseName));
                services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());
                services.AddScoped<ICurrentUserService, CurrentUserService>();
                services.AddScoped<ITokenService, TokenService>();
                services.AddHttpContextAccessor();
                services.AddAuthentication("Test").AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>("Test", _ => { });
                services.AddScoped<IPermissionService, PermissionEngine>();
                services.AddApplicationServices();
                services.AddSecurityPolicies();
            })
            .Configure(app =>
            {
                app.UseRouting();
                app.UseAuthentication();
                app.UseAuthorization();
                app.UseEndpoints(endpoints => endpoints.MapControllers());
            })).Build();
        host.Start();
        server = host.GetTestServer();
        client = server.CreateClient();
        using var scope = server.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        database.Roles.AddRange(
            new Role { Id = "super", Code = "SUPER_ADMIN", Name = "Super Admin", IsSystem = true },
            new Role { Id = "teacher-role", Code = "TEACHER", Name = "Teacher" });
        var passwordHash = TestPasswordHash;
        database.Users.AddRange(
            new User { Id = "root", Username = "root", RoleId = "super", PasswordHash = passwordHash },
            // A misleading username/role label must never grant administrative authority.
            new User { Id = "staff", Username = "admin", RoleId = "teacher-role", RoleName = "Super Admin", PasswordHash = passwordHash },
            new User { Id = "disabled", Username = "disabled", RoleId = "super", IsActive = false, PasswordHash = passwordHash });
        database.RefreshTokens.Add(new RefreshToken
        {
            UserId = "disabled", Token = "disabled-token", ExpiresAt = DateTime.UtcNow.AddDays(1)
        });
        database.SaveChanges();
    }

    public static IEnumerable<object[]> ProtectedRoutes()
    {
        var routes = new[]
        {
            ("GET", "/api/v1/database/backups"),
            ("POST", "/api/v1/database/backup"),
            ("GET", "/api/v1/database/backups/test.sql/download"),
            ("POST", "/api/v1/database/restore"),
            ("DELETE", "/api/v1/database/backups/test.sql"),
            ("GET", "/api/v1/deployment/status"),
            ("GET", "/api/v1/deployment/history"),
            ("POST", "/api/v1/deployment/upload-deploy"),
            ("POST", "/api/v1/deployment/build-and-deploy"),
            ("POST", "/api/v1/deployment/rollback"),
            ("POST", "/api/v1/deployment/restart-server"),
            ("GET", "/api/v1/deployment/logs"),
            ("GET", "/api/v1/users"),
            ("POST", "/api/v1/users"),
            ("PUT", "/api/v1/users/root"),
            ("PUT", "/api/v1/users/root/toggle-status"),
            ("PUT", "/api/v1/users/root/reset-password"),
            ("GET", "/api/v1/users/root/menu-permissions"),
            ("PUT", "/api/v1/users/root/menu-permissions"),
            ("GET", "/api/v1/roles"),
            ("GET", "/api/v1/roles/super/menu-permissions"),
            ("PUT", "/api/v1/roles/super/menu-permissions"),
            ("GET", "/api/v1/menus"),
            ("PUT", "/api/v1/menus/test")
        };
        foreach (var (method, path) in routes)
        {
            yield return new object[] { method, path, "", HttpStatusCode.Unauthorized };
            yield return new object[] { method, path, "staff", HttpStatusCode.Forbidden };
        }
    }

    [Theory]
    [MemberData(nameof(ProtectedRoutes))]
    public async Task Sensitive_routes_reject_unauthorized_requests(string method, string path, string identity, HttpStatusCode expected)
    {
        using var request = new HttpRequestMessage(new HttpMethod(method), path);
        request.Headers.Add("X-Test-Prevent-Action", "true");
        if (identity.Length > 0) request.Headers.Add("X-Test-Identity", identity);
        using var response = await client.SendAsync(request);
        Assert.Equal(expected, response.StatusCode);
    }

    [Theory]
    [InlineData("admin123")]
    [InlineData("password123")]
    [InlineData("123456")]
    [InlineData("root123")]
    [InlineData("wrong-password")]
    public async Task Login_rejects_password_bypasses(string password)
    {
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new { Username = "root", Password = password });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_accepts_only_the_actual_password()
    {
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new { Username = "root", Password = CorrectPassword });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Disabled_account_cannot_refresh()
    {
        var response = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { RefreshToken = "disabled-token" });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData("root", HttpStatusCode.OK)]
    [InlineData("disabled", HttpStatusCode.Forbidden)]
    [InlineData("missing", HttpStatusCode.Forbidden)]
    public async Task Administrator_policy_checks_current_database_authority(string identity, HttpStatusCode expected)
    {
        client.DefaultRequestHeaders.Add("X-Test-Identity", identity);
        var response = await client.GetAsync("/api/v1/roles");
        Assert.Equal(expected, response.StatusCode);
    }

    [Fact]
    public async Task Revoked_administrator_role_is_denied_with_an_existing_identity()
    {
        client.DefaultRequestHeaders.Add("X-Test-Identity", "root");
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/v1/roles")).StatusCode);
        using var scope = server.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        (await database.Roles.FindAsync("super"))!.IsActive = false;
        await database.SaveChangesAsync();
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/api/v1/roles")).StatusCode);
    }

    [Fact]
    public async Task Staff_can_update_their_own_profile_and_password()
    {
        client.DefaultRequestHeaders.Add("X-Test-Identity", "staff");
        var profile = await client.PutAsJsonAsync("/api/v1/users/my-profile", new { FullName = "Updated Teacher" });
        Assert.Equal(HttpStatusCode.OK, profile.StatusCode);
        var password = await client.PostAsJsonAsync("/api/v1/users/change-password",
            new { CurrentPassword = CorrectPassword, NewPassword = "New-Actual-Password!42" });
        Assert.Equal(HttpStatusCode.OK, password.StatusCode);
    }

    public void Dispose()
    {
        client.Dispose();
        server.Dispose();
        host.Dispose();
    }
}

// Fail safely if authorization regresses: never execute deployment/backup actions.
public sealed class PreventSensitiveActionExecution : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (context.HttpContext.Request.Headers.ContainsKey("X-Test-Prevent-Action"))
            throw new InvalidOperationException("Authorization failed to stop a protected test request.");
    }

    public void OnActionExecuted(ActionExecutedContext context) { }
}

// This authentication scheme exists only in the isolated test host.
public class TestAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger, UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var identity = Request.Headers["X-Test-Identity"].ToString();
        if (identity.Length == 0) return Task.FromResult(AuthenticateResult.NoResult());
        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, identity),
            new Claim(ClaimTypes.Name, "admin"),
            new Claim(ClaimTypes.Role, "Super Admin")
        }, Scheme.Name));
        return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(principal, Scheme.Name)));
    }
}
