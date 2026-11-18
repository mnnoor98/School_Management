using SchoolManagement.Application.Auth.DTOs;
using SchoolManagement.Application.Menus.DTOs;

namespace SchoolManagement.Application.Menus.Services;

public interface IRoleService
{
    Task<List<RoleDto>> GetRolesAsync(string branchId);
    Task<(List<RolePermissionDto>? Permissions, string? Error)> GetRolePermissionsAsync(string roleId);
    Task<(bool Success, string? Error)> UpdateRolePermissionsAsync(string roleId, List<RolePermissionDto> request);
}
