using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using SchoolManagement.Application.Common.Interfaces;

namespace SchoolManagement.Infrastructure.Identity;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ICampusContext? _campus;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor, ICampusContext? campus = null)
    {
        _httpContextAccessor = httpContextAccessor;
        _campus = campus;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public string? UserId => User?.FindFirstValue(ClaimTypes.NameIdentifier);
    public string? Username => User?.FindFirstValue(ClaimTypes.Name);
    public string? RoleName => User?.FindFirstValue(ClaimTypes.Role);
    public string? RoleId => User?.FindFirstValue("role_id");
    public string SchoolId => _campus?.IsResolved == true ? _campus.SchoolId : User?.FindFirstValue("school_id") ?? "";
    public string BranchId => _campus?.IsResolved == true ? _campus.BranchId : User?.FindFirstValue("branch_id") ?? "";
    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;
    public bool IsSuperAdmin
    {
        get
        {
            return _campus?.IsResolved == true && _campus.IsSuperAdmin;
        }
    }
}
