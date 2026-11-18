using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Menus.DTOs;
using SchoolManagement.Domain.Auth;

namespace SchoolManagement.Application.Menus.Services;

public class MenuService : IMenuService
{
    private readonly IApplicationDbContext _context;
    private readonly IPermissionService _permissionService;

    public MenuService(IApplicationDbContext context, IPermissionService permissionService)
    {
        _context = context;
        _permissionService = permissionService;
    }

    public async Task<List<MenuItemDto>> GetMyMenusAsync(string userId, string? roleId = null)
    {
        if (string.IsNullOrEmpty(roleId))
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return new List<MenuItemDto>();
            roleId = user.RoleId;
        }

        var authorizedMenus = await _permissionService.GetAuthorizedMenuTreeAsync(userId, roleId);
        return authorizedMenus.Select(MapToDto).ToList();
    }

    public async Task<List<MenuItemDto>> GetAllMenusAsync()
    {
        var menus = await _context.Menus
            .AsNoTracking()
            .OrderBy(m => m.DisplayOrder)
            .ToListAsync();

        var rootMenus = menus.Where(m => string.IsNullOrEmpty(m.ParentCode)).ToList();
        return rootMenus.Select(r =>
        {
            var dto = MapToDto(r);
            dto.Children = menus.Where(c => c.ParentCode == r.Code).Select(c => MapToDto(c)).ToList();
            return dto;
        }).ToList();
    }

    public async Task<(List<RolePermissionDto> RolePermissions, List<UserMenuOverrideDto> Overrides)?> GetMyPermissionsAsync(string userId)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return null;

        var rolePermissions = await _context.RoleMenuPermissions.AsNoTracking()
            .Where(p => p.RoleId == user.RoleId)
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

        var overrides = await _context.UserMenuPermissions.AsNoTracking()
            .Where(p => p.UserId == user.Id)
            .Select(p => new UserMenuOverrideDto
            {
                UserId = p.UserId,
                MenuCode = p.MenuCode,
                Action = p.Action,
                Override = p.Override.ToString()
            })
            .ToListAsync();

        return (rolePermissions, overrides);
    }

    public async Task<(bool Success, string? Error)> UpdateMenuAsync(string id, UpdateMenuRequest request)
    {
        var menu = await _context.Menus.FindAsync(id);
        if (menu == null) return (false, "Menu not found");

        menu.Name = request.Name;
        menu.Route = request.Route;
        menu.Icon = request.Icon;
        menu.DisplayOrder = request.DisplayOrder;
        menu.IsActive = request.IsActive;
        menu.IsVisible = request.IsVisible;
        menu.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return (true, null);
    }

    private static MenuItemDto MapToDto(Menu m) => new()
    {
        Id = m.Id,
        Name = m.Name,
        Code = m.Code,
        ParentCode = m.ParentCode,
        Route = m.Route,
        Icon = m.Icon,
        Type = m.Type.ToString(),
        DisplayOrder = m.DisplayOrder,
        IsActive = m.IsActive,
        IsVisible = m.IsVisible,
        PermissionCode = m.PermissionCode,
        Badge = m.Badge,
        Children = m.Children?.Select(c => MapToDto(c)).ToList() ?? new(),
        SuperAdminOnly = m.Code is "DEPLOYMENT" or "SYS_BACKUP" or "AUDIT_LOGS"
    };
}
