using Microsoft.AspNetCore.Http;
using SchoolManagement.Application.Common.Interfaces;

namespace SchoolManagement.Infrastructure.Identity;

public sealed class CampusContext(IHttpContextAccessor accessor) : ICampusContext
{
    // Only out-of-request maintenance (migrations/seeding) bypasses isolation.
    public bool BypassIsolation => accessor.HttpContext == null;
    public bool IsResolved { get; private set; }
    public bool IsSuperAdmin { get; private set; }
    public string UserId { get; private set; } = "";
    public string SchoolId { get; private set; } = "";
    public string BranchId { get; private set; } = "";

    public void Resolve(string userId, string schoolId, string branchId, bool isSuperAdmin)
    {
        UserId = userId;
        SchoolId = schoolId;
        BranchId = branchId;
        IsSuperAdmin = isSuperAdmin;
        IsResolved = true;
    }
}
