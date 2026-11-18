using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Domain.Auth;
using SchoolManagement.Domain.Common;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Identity;

public class PermissionEngine(IApplicationDbContext context, ICampusContext? campus = null) : IPermissionService
{
    public async Task<bool> HasPermissionAsync(string userId, string roleId, string menuCode, string action)
    {
        if (action.ToLowerInvariant() is not ("view" or "create" or "edit" or "delete" or "approve" or "export")) return false;
        bool Contains(IEnumerable<Menu> menus) => menus.Any(menu => menu.Code == menuCode || Contains(menu.Children));
        if (!Contains(await GetAuthorizedMenuTreeAsync(userId, roleId))) return false;
        if ((campus?.IsSuperAdmin == true && campus.UserId == userId) || action.Equals("view", StringComparison.OrdinalIgnoreCase)) return true;
        var role = await context.Roles.IgnoreQueryFilters().AsNoTracking().FirstOrDefaultAsync(r => r.Id == roleId);
        var isPrincipal = role != null && (role.Code == "PRINCIPAL" || role.Name.Contains("Principal"));
        var overrides = await context.UserMenuPermissions.AsNoTracking().Where(p => p.UserId == userId).ToListAsync();
        var grant = await context.RoleMenuPermissions.AsNoTracking().FirstOrDefaultAsync(p => p.RoleId == roleId && p.MenuCode == menuCode);
        return Allowed(menuCode, action, overrides, grant, isPrincipal);
    }

    private static bool Allowed(string code, string action, List<UserMenuPermission> overrides, RoleMenuPermission? grant, bool isPrincipal = false)
    {
        var userOverride = overrides.FirstOrDefault(p => p.MenuCode == code && p.Action.Equals(action, StringComparison.OrdinalIgnoreCase));
        if (userOverride?.Override == OverrideType.Deny) return false;
        if (userOverride?.Override == OverrideType.Allow) return true;
        if (isPrincipal && MenuCatalog.IsCampusAdministratorMenu(code)) return true;
        if (grant == null) return false;
        return action.ToLowerInvariant() switch
        {
            "view" => grant.View, "create" => grant.View && grant.Create,
            "edit" => grant.View && grant.Edit, "delete" => grant.View && grant.Delete,
            "approve" => grant.View && grant.Approve, "export" => grant.View && grant.Export,
            _ => false
        };
    }

    public async Task<List<Menu>> GetAuthorizedMenuTreeAsync(string userId, string roleId)
    {
        if (!await context.Roles.AsNoTracking().AnyAsync(role => role.Id == roleId && role.IsActive)) return new List<Menu>();
        var menus = await context.Menus.AsNoTracking().OrderBy(m => m.DisplayOrder).ThenBy(m => m.Code).ToListAsync();
        var overrides = await context.UserMenuPermissions.AsNoTracking().Where(p => p.UserId == userId).ToListAsync();
        var grants = await context.RoleMenuPermissions.AsNoTracking().Where(p => p.RoleId == roleId).ToDictionaryAsync(p => p.MenuCode);
        var administrator = campus?.IsSuperAdmin == true && campus.UserId == userId;
        var role = await context.Roles.IgnoreQueryFilters().AsNoTracking().FirstOrDefaultAsync(r => r.Id == roleId);
        var isPrincipal = role != null && (role.Code == "PRINCIPAL" || role.Name.Contains("Principal"));
        var isCampusAdmin = administrator || isPrincipal;

        Menu? Build(Menu menu, HashSet<string> ancestors)
        {
            if (!menu.IsActive || !menu.IsVisible || ancestors.Contains(menu.Code)) return null;
            if (!isCampusAdmin && MenuCatalog.IsAdministratorMenu(menu.Code)) return null;
            if (!administrator && MenuCatalog.IsSuperAdminOnlyMenu(menu.Code)) return null;
            if (!administrator && overrides.Any(p => p.MenuCode == menu.Code
                && p.Action.Equals("view", StringComparison.OrdinalIgnoreCase) && p.Override == OverrideType.Deny)) return null;
            var path = new HashSet<string>(ancestors) { menu.Code };
            var children = menus.Where(m => m.ParentCode == menu.Code).Select(m => Build(m, path)).OfType<Menu>().ToList();
            grants.TryGetValue(menu.Code, out var grant);
            var visible = administrator || Allowed(menu.Code, "view", overrides, grant, isPrincipal);
            // Parent groups are containers, never permission grants for their children.
            if (menu.Type == MenuType.Group ? children.Count == 0 : !visible) return null;
            return new Menu
            {
                Id = menu.Id, Code = menu.Code, Name = menu.Name, ParentCode = menu.ParentCode,
                Route = menu.Route, Icon = menu.Icon, Type = menu.Type, DisplayOrder = menu.DisplayOrder,
                IsActive = true, IsVisible = true, PermissionCode = menu.PermissionCode,
                Badge = menu.Badge, Children = children
            };
        }
        return menus.Where(m => string.IsNullOrEmpty(m.ParentCode)).Select(m => Build(m, new HashSet<string>())).OfType<Menu>().ToList();
    }
}
