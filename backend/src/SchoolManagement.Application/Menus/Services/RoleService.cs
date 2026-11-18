using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Auth.DTOs;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Menus.DTOs;
using SchoolManagement.Domain.Auth;

namespace SchoolManagement.Application.Menus.Services;

public class RoleService : IRoleService
{
    private readonly IApplicationDbContext _context;

    public RoleService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<RoleDto>> GetRolesAsync(string branchId)
    {
        return await _context.Roles
            .AsNoTracking()
            .Where(r => r.IsActive)
            .Select(r => new RoleDto
            {
                Id = r.Id,
                Code = r.Code,
                Name = r.Name,
                Description = r.Description,
                IsSystem = r.IsSystem,
                UserCount = _context.Users.Count(u => u.RoleId == r.Id && u.BranchId == branchId)
            })
            .ToListAsync();
    }

    public async Task<(List<RolePermissionDto>? Permissions, string? Error)> GetRolePermissionsAsync(string roleId)
    {
        var role = await _context.Roles.AsNoTracking().FirstOrDefaultAsync(r => r.Id == roleId && r.IsActive);
        if (role == null) return (null, "Role not found.");

        var permissions = await _context.RoleMenuPermissions
            .AsNoTracking()
            .Where(r => r.RoleId == roleId)
            .Select(p => new RolePermissionDto
            {
                RoleId = p.RoleId,
                MenuCode = p.MenuCode,
                View = p.View,
                Create = p.Create,
                Edit = p.Edit,
                Delete = p.Delete,
                Approve = p.Approve,
                Export = p.Export
            })
            .ToListAsync();

        return (permissions, null);
    }

    public async Task<(bool Success, string? Error)> UpdateRolePermissionsAsync(string roleId, List<RolePermissionDto> request)
    {
        var role = await _context.Roles.AsNoTracking().FirstOrDefaultAsync(r => r.Id == roleId && r.IsActive);
        if (role == null) return (false, "Role not found.");

        if (role.IsSystem && role.Code == "SUPER_ADMIN")
            return (false, "Super Admin always has full menu access. Super Admin access cannot be restricted.");

        if (request.Any(p => string.IsNullOrWhiteSpace(p.MenuCode) || (!string.IsNullOrEmpty(p.RoleId) && p.RoleId != roleId)))
            return (false, "Permission rows must belong to the selected role and have a menu code.");

        if (request.GroupBy(p => p.MenuCode.Trim(), StringComparer.OrdinalIgnoreCase).Any(group => group.Count() > 1))
            return (false, "Each menu can occur only once.");

        var isPrincipalRole = role.Code == "PRINCIPAL" || role.Name.Contains("Principal", StringComparison.OrdinalIgnoreCase);
        var menus = await _context.Menus.AsNoTracking().ToListAsync();
        var menuCodes = menus.ToDictionary(m => m.Code, StringComparer.OrdinalIgnoreCase);

        foreach (var permission in request)
        {
            if (!menuCodes.TryGetValue(permission.MenuCode.Trim(), out var menu))
                return (false, $"Unknown menu: {permission.MenuCode}");

            permission.MenuCode = menu.Code;

            if (!permission.View && (permission.Create || permission.Edit || permission.Delete || permission.Approve || permission.Export))
                return (false, $"Enable View before assigning actions for {menu.Name}.");

            // SuperAdminOnly and CampusAdministratorMenu checks
            bool isSuperAdminOnly = menu.Code is "ADMIN_SCHOOL" or "ADMIN_BACKUP" or "ADMIN_DEPLOYMENT" or "SEC_MENUS" or "SEC_AUDIT" or "DEPLOYMENT" or "SYS_BACKUP" or "AUDIT_LOGS";
            if (isSuperAdminOnly && permission.View)
                return (false, $"{menu.Name} is available only to Super Admin.");

            bool isCampusAdminOnly = menu.Code is "SECURITY" or "SEC_USERS" or "SEC_USER_OVERRIDES" or "SEC_ROLES" or "ROLE_CONFIG" or "USER_MGMT";
            if (isCampusAdminOnly && permission.View && !isPrincipalRole)
                return (false, $"{menu.Name} is available only to Super Admin and Campus Principal.");
        }

        var existing = await _context.RoleMenuPermissions.Where(r => r.RoleId == roleId).ToListAsync();
        _context.RoleMenuPermissions.RemoveRange(existing);

        foreach (var item in request)
        {
            _context.RoleMenuPermissions.Add(new RoleMenuPermission
            {
                RoleId = roleId,
                MenuCode = item.MenuCode,
                View = item.View,
                Create = item.Create,
                Edit = item.Edit,
                Delete = item.Delete,
                Approve = item.Approve,
                Export = item.Export
            });
        }

        await _context.SaveChangesAsync();
        return (true, null);
    }
}
