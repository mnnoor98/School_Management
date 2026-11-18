using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.Menus.DTOs;
using SchoolManagement.Application.Menus.Services;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class MenusController : ControllerBase
{
    private readonly IMenuService _menuService;
    private readonly ICurrentUserService _currentUser;

    public MenusController(IMenuService menuService, ICurrentUserService currentUser)
    {
        _menuService = menuService;
        _currentUser = currentUser;
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<List<MenuItemDto>>>> GetMyMenus()
    {
        var currentUserId = _currentUser.UserId;
        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized();
        }

        var dtoList = await _menuService.GetMyMenusAsync(currentUserId, _currentUser.RoleId);
        return Ok(ApiResponse<List<MenuItemDto>>.Ok(dtoList));
    }

    [HttpGet]
    [Authorize(Policy = SchoolManagement.Api.Security.SecurityPolicies.CampusAdministrator)]
    public async Task<ActionResult<ApiResponse<List<MenuItemDto>>>> GetAllMenus()
    {
        var result = await _menuService.GetAllMenusAsync();
        return Ok(ApiResponse<List<MenuItemDto>>.Ok(result));
    }

    [HttpGet("my/permissions")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> GetMyPermissions()
    {
        var currentUserId = _currentUser.UserId;
        if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

        var perms = await _menuService.GetMyPermissionsAsync(currentUserId);
        if (perms == null) return Unauthorized();

        return Ok(ApiResponse<object>.Ok(new { rolePermissions = perms.Value.RolePermissions, overrides = perms.Value.Overrides }));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = SchoolManagement.Api.Security.SecurityPolicies.SystemAdministrator)]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateMenu(string id, [FromBody] UpdateMenuRequest request)
    {
        var (success, error) = await _menuService.UpdateMenuAsync(id, request);
        if (!success) return NotFound(ApiResponse<bool>.Fail(error ?? "Menu not found"));

        return Ok(ApiResponse<bool>.Ok(true, "Menu updated successfully"));
    }
}
