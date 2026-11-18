using SchoolManagement.Application.Menus.DTOs;

namespace SchoolManagement.Application.Menus.Services;

public interface IMenuService
{
    Task<List<MenuItemDto>> GetMyMenusAsync(string userId, string? roleId = null);
    Task<List<MenuItemDto>> GetAllMenusAsync();
    Task<(List<RolePermissionDto> RolePermissions, List<UserMenuOverrideDto> Overrides)?> GetMyPermissionsAsync(string userId);
    Task<(bool Success, string? Error)> UpdateMenuAsync(string id, UpdateMenuRequest request);
}
