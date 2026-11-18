using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Infrastructure.Identity;

namespace SchoolManagement.Api.Middleware;

public sealed class CampusScopeMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext http, IApplicationDbContext database, CampusContext campus)
    {
        if (!http.Request.Path.StartsWithSegments("/api/v1") || http.User.Identity?.IsAuthenticated != true)
        {
            await next(http);
            return;
        }
        var userId = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await database.Users.IgnoreQueryFilters().AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, http.RequestAborted);
        if (user == null)
        {
            http.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return;
        }
        var isSuperAdmin = await database.Roles.IgnoreQueryFilters().AnyAsync(r => r.Id == user.RoleId
            && r.SchoolId == user.SchoolId && r.IsActive && r.IsSystem && r.Code == "SUPER_ADMIN", http.RequestAborted);
        var requestedBranch = http.Request.Headers["X-Campus-Id"].ToString().Trim();
        if (!isSuperAdmin && requestedBranch.Length > 0 && requestedBranch != user.BranchId)
        {
            await Reject(http, 403, "You can only work in your assigned campus.");
            return;
        }
        var branchId = isSuperAdmin ? requestedBranch : user.BranchId;
        if (branchId.Length > 0 && !await database.Branches.IgnoreQueryFilters().AnyAsync(b => b.Id == branchId
            && b.SchoolId == user.SchoolId && b.IsActive, http.RequestAborted))
        {
            await Reject(http, 403, "Campus is inactive or unavailable.");
            return;
        }
        campus.Resolve(user.Id, user.SchoolId, branchId, isSuperAdmin);
        var path = (http.Request.Path.Value ?? "").TrimEnd('/').ToLowerInvariant();
        var metadataRequest = (http.Request.Method == "GET" && path == "/api/v1/school")
            || path.StartsWith("/api/v1/auth/") || path == "/api/v1/menus/my"
            || path == "/api/v1/users/my-profile" || path == "/api/v1/users/change-password"
            || path.StartsWith("/api/v1/database/") || path.StartsWith("/api/v1/deployment/")
            || (path.StartsWith("/api/v1/roles") && !path.EndsWith("/menu-permissions"))
            || path.StartsWith("/api/v1/menus")
            || (isSuperAdmin && path.StartsWith("/api/v1/school/branches"))
            || (isSuperAdmin && path == "/api/v1/school" && http.Request.Method == "PUT");
        if (branchId.Length == 0 && !metadataRequest)
        {
            await Reject(http, 400, "Select a campus before viewing or changing campus data.");
            return;
        }
        await next(http);
    }

    private static Task Reject(HttpContext http, int status, string message)
    {
        http.Response.StatusCode = status;
        return http.Response.WriteAsJsonAsync(new { success = false, message });
    }
}
