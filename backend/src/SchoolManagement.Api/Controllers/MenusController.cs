using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.Menus.DTOs;
using SchoolManagement.Domain.Auth;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class MenusController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IPermissionService _permissionService;
    private readonly ICurrentUserService _currentUser;

    public MenusController(IApplicationDbContext context, IPermissionService permissionService, ICurrentUserService currentUser)
    {
        _context = context;
        _permissionService = permissionService;
        _currentUser = currentUser;
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<List<MenuItemDto>>>> GetMyMenus()
    {
        var user = await _context.Users.FindAsync(_currentUser.UserId);
        if (user == null) return Unauthorized();

        var authorizedMenus = await _permissionService.GetAuthorizedMenuTreeAsync(user.Id, user.RoleId);

        var dtoList = authorizedMenus.Select(m => MapToDto(m)).ToList();
        return Ok(ApiResponse<List<MenuItemDto>>.Ok(dtoList));
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<List<MenuItemDto>>>> GetAllMenus()
    {
        var menus = await _context.Menus
            .AsNoTracking()
            .OrderBy(m => m.DisplayOrder)
            .ToListAsync();

        var rootMenus = menus.Where(m => string.IsNullOrEmpty(m.ParentCode)).ToList();
        var result = rootMenus.Select(r =>
        {
            var dto = MapToDto(r);
            dto.Children = menus.Where(c => c.ParentCode == r.Code).Select(c => MapToDto(c)).ToList();
            return dto;
        }).ToList();

        return Ok(ApiResponse<List<MenuItemDto>>.Ok(result));
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateMenu(string id, [FromBody] UpdateMenuRequest request)
    {
        var menu = await _context.Menus.FindAsync(id);
        if (menu == null) return NotFound(ApiResponse<bool>.Fail("Menu not found"));

        menu.Name = request.Name;
        menu.Route = request.Route;
        menu.Icon = request.Icon;
        menu.DisplayOrder = request.DisplayOrder;
        menu.IsActive = request.IsActive;
        menu.IsVisible = request.IsVisible;
        menu.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<bool>.Ok(true, "Menu updated successfully"));
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
        Badge = m.Badge,
        PermissionCode = m.PermissionCode,
        Children = m.Children?.Select(c => MapToDto(c)).ToList() ?? new()
    };
}
