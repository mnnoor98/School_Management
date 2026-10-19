using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using SchoolManagement.Application.Common.Interfaces;

namespace SchoolManagement.Infrastructure.Identity;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public string? UserId => User?.FindFirstValue(ClaimTypes.NameIdentifier);
    public string? Username => User?.FindFirstValue(ClaimTypes.Name);
    public string? RoleName => User?.FindFirstValue(ClaimTypes.Role);
    public string SchoolId => User?.FindFirstValue("school_id") ?? "sch-01";
    public string BranchId => User?.FindFirstValue("branch_id") ?? "br-01";
    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;
}
