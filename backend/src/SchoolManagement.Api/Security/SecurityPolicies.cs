using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;

namespace SchoolManagement.Api.Security;

public static class SecurityPolicies
{
    public const string SystemAdministrator = "SystemAdministrator";
    public const string CampusAdministrator = "CampusAdministrator";

    public static IServiceCollection AddSecurityPolicies(this IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            options.FallbackPolicy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser().Build();
            options.AddPolicy(SystemAdministrator, policy => policy
                .RequireAuthenticatedUser()
                .AddRequirements(new SystemAdministratorRequirement()));
            options.AddPolicy(CampusAdministrator, policy => policy
                .RequireAuthenticatedUser()
                .AddRequirements(new CampusAdministratorRequirement()));
        });
        services.AddScoped<IAuthorizationHandler, SystemAdministratorHandler>();
        services.AddScoped<IAuthorizationHandler, CampusAdministratorHandler>();
        return services;
    }
}

public sealed class SystemAdministratorRequirement : IAuthorizationRequirement;

public sealed class SystemAdministratorHandler(IApplicationDbContext database)
    : AuthorizationHandler<SystemAdministratorRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context, SystemAdministratorRequirement requirement)
    {
        if (context.User.Identity?.IsAuthenticated != true) return;
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return;

        // Check current database authority, not a username or stale token role label.
        var isAdministrator = await (
            from user in database.Users.IgnoreQueryFilters().AsNoTracking()
            join role in database.Roles.IgnoreQueryFilters().AsNoTracking() on user.RoleId equals role.Id
            where user.Id == userId && user.IsActive && role.IsActive
                && role.IsSystem && role.Code == "SUPER_ADMIN"
                && role.SchoolId == user.SchoolId
            select user.Id).AnyAsync();

        if (isAdministrator) context.Succeed(requirement);
    }
}

public sealed class CampusAdministratorRequirement : IAuthorizationRequirement;

public sealed class CampusAdministratorHandler(IApplicationDbContext database)
    : AuthorizationHandler<CampusAdministratorRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context, CampusAdministratorRequirement requirement)
    {
        if (context.User.Identity?.IsAuthenticated != true) return;
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return;

        // Allows Super Admin, or Campus Principal, or user with explicit campus admin permission
        var isAuthorized = await (
            from user in database.Users.IgnoreQueryFilters().AsNoTracking()
            join role in database.Roles.IgnoreQueryFilters().AsNoTracking() on user.RoleId equals role.Id
            where user.Id == userId && user.IsActive && role.IsActive
                && role.SchoolId == user.SchoolId
                && (role.Code == "SUPER_ADMIN" || role.Code == "PRINCIPAL" || role.Name.Contains("Principal"))
            select user.Id).AnyAsync();

        if (isAuthorized) context.Succeed(requirement);
    }
}
