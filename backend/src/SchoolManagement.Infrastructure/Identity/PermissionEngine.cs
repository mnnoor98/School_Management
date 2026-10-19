using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Domain.Auth;
using SchoolManagement.Domain.Common;

namespace SchoolManagement.Infrastructure.Identity;

public class PermissionEngine : IPermissionService
{
    private readonly IApplicationDbContext _context;

    public PermissionEngine(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> HasPermissionAsync(string userId, string roleId, string menuCode, string action)
    {
        // 1. Evaluate Explicit User Overrides (Highest Priority)
        var userOverride = await _context.UserMenuPermissions
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == userId && u.MenuCode == menuCode && u.Action.ToLower() == action.ToLower());

        if (userOverride != null)
        {
            if (userOverride.Override == OverrideType.Deny) return false;
            if (userOverride.Override == OverrideType.Allow) return true;
        }

        // 2. Evaluate Role Grants
        var roleGrant = await _context.RoleMenuPermissions
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.RoleId == roleId && r.MenuCode == menuCode);

        if (roleGrant != null)
        {
            return action.ToLower() switch
            {
                "view" => roleGrant.View,
                "create" => roleGrant.Create,
                "edit" => roleGrant.Edit,
                "delete" => roleGrant.Delete,
                "approve" => roleGrant.Approve,
                "export" => roleGrant.Export,
                _ => false
            };
        }

        // 3. Default Deny
        return false;
    }

    public async Task<List<Menu>> GetAuthorizedMenuTreeAsync(string userId, string roleId)
    {
        var allMenus = await _context.Menus
            .AsNoTracking()
            .Where(m => m.IsActive)
            .OrderBy(m => m.DisplayOrder)
            .ToListAsync();

        var userOverrides = await _context.UserMenuPermissions
            .AsNoTracking()
            .Where(u => u.UserId == userId)
            .ToListAsync();

        var roleGrants = await _context.RoleMenuPermissions
            .AsNoTracking()
            .Where(r => r.RoleId == roleId)
            .ToListAsync();

        var allowedMenuCodes = new HashSet<string>();

        foreach (var menu in allMenus)
        {
            // Check User Override
            var uOverride = userOverrides.FirstOrDefault(u => u.MenuCode == menu.Code && u.Action.ToLower() == "view");
            if (uOverride != null)
            {
                if (uOverride.Override == OverrideType.Allow)
                {
                    allowedMenuCodes.Add(menu.Code);
                    continue;
                }
                if (uOverride.Override == OverrideType.Deny)
                {
                    continue;
                }
            }

            // Check Role Grant
            var rGrant = roleGrants.FirstOrDefault(r => r.MenuCode == menu.Code);
            if (rGrant != null && rGrant.View)
            {
                allowedMenuCodes.Add(menu.Code);
            }
        }

        // Build tree: include root items that are allowed or have allowed children
        var rootMenus = allMenus.Where(m => string.IsNullOrEmpty(m.ParentCode)).ToList();
        var resultTree = new List<Menu>();

        foreach (var root in rootMenus)
        {
            var children = allMenus.Where(m => m.ParentCode == root.Code && allowedMenuCodes.Contains(m.Code)).ToList();
            if (allowedMenuCodes.Contains(root.Code) || children.Count > 0)
            {
                var copy = new Menu
                {
                    Id = root.Id,
                    Code = root.Code,
                    Name = root.Name,
                    Route = root.Route,
                    Icon = root.Icon,
                    Type = root.Type,
                    DisplayOrder = root.DisplayOrder,
                    IsActive = root.IsActive,
                    IsVisible = root.IsVisible,
                    Badge = root.Badge,
                    PermissionCode = root.PermissionCode,
                    Children = children
                };
                resultTree.Add(copy);
            }
        }

        return resultTree;
    }
}
