using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Auth.DTOs;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.Menus.DTOs;
using SchoolManagement.Domain.Auth;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public RolesController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<RoleDto>>>> GetRoles()
    {
        var roles = await _context.Roles
            .AsNoTracking()
            .Select(r => new RoleDto
            {
                Id = r.Id,
                Code = r.Code,
                Name = r.Name,
                Description = r.Description,
                IsSystem = r.IsSystem,
                UserCount = _context.Users.Count(u => u.RoleId == r.Id)
            })
            .ToListAsync();

        return Ok(ApiResponse<List<RoleDto>>.Ok(roles));
    }

    [HttpGet("{id}/menu-permissions")]
    public async Task<ActionResult<ApiResponse<List<RolePermissionDto>>>> GetRolePermissions(string id)
    {
        var permissions = await _context.RoleMenuPermissions
            .AsNoTracking()
            .Where(r => r.RoleId == id)
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

        return Ok(ApiResponse<List<RolePermissionDto>>.Ok(permissions));
    }

    [HttpPut("{id}/menu-permissions")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateRolePermissions(string id, [FromBody] List<RolePermissionDto> request)
    {
        var existing = await _context.RoleMenuPermissions.Where(r => r.RoleId == id).ToListAsync();
        _context.RoleMenuPermissions.RemoveRange(existing);

        foreach (var item in request)
        {
            _context.RoleMenuPermissions.Add(new RoleMenuPermission
            {
                RoleId = id,
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
        return Ok(ApiResponse<bool>.Ok(true, "Role permissions updated successfully"));
    }
}
