using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Auth.DTOs;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.Menus.DTOs;
using SchoolManagement.Application.Menus.Services;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize(Policy = SchoolManagement.Api.Security.SecurityPolicies.CampusAdministrator)]
public class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;
    private readonly ICurrentUserService _currentUser;

    public RolesController(IRoleService roleService, ICurrentUserService currentUser)
    {
        _roleService = roleService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<RoleDto>>>> GetRoles()
    {
        var roles = await _roleService.GetRolesAsync(_currentUser.BranchId);
        return Ok(ApiResponse<List<RoleDto>>.Ok(roles));
    }

    [HttpGet("{id}/menu-permissions")]
    public async Task<ActionResult<ApiResponse<List<RolePermissionDto>>>> GetRolePermissions(string id)
    {
        var (permissions, error) = await _roleService.GetRolePermissionsAsync(id);
        if (!string.IsNullOrEmpty(error)) return NotFound(ApiResponse<List<RolePermissionDto>>.Fail(error));

        return Ok(ApiResponse<List<RolePermissionDto>>.Ok(permissions!));
    }

    [HttpPut("{id}/menu-permissions")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateRolePermissions(string id, [FromBody] List<RolePermissionDto> request)
    {
        var (success, error) = await _roleService.UpdateRolePermissionsAsync(id, request);
        if (!success)
        {
            return error == "Role not found."
                ? NotFound(ApiResponse<bool>.Fail(error))
                : BadRequest(ApiResponse<bool>.Fail(error!));
        }

        return Ok(ApiResponse<bool>.Ok(true, "Role permission matrix updated successfully in database"));
    }
}
