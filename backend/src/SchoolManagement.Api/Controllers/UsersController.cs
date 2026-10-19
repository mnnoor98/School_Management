using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Auth.DTOs;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.Menus.DTOs;
using SchoolManagement.Domain.Auth;
using SchoolManagement.Domain.Common;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public UsersController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<UserProfileDto>>>> GetUsers()
    {
        var users = await _context.Users
            .AsNoTracking()
            .OrderBy(u => u.RoleName)
            .ThenBy(u => u.FullName)
            .Select(u => new UserProfileDto
            {
                Id = u.Id,
                Username = u.Username,
                FullName = u.FullName,
                Email = u.Email,
                RoleId = u.RoleId,
                RoleName = u.RoleName,
                SchoolId = u.SchoolId,
                BranchId = u.BranchId,
                Avatar = u.Avatar,
                Phone = u.Phone,
                IsActive = u.IsActive
            })
            .ToListAsync();

        return Ok(ApiResponse<List<UserProfileDto>>.Ok(users));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> CreateUser([FromBody] CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest(ApiResponse<UserProfileDto>.Fail("Username and Full Name are required."));
        }

        var normalizedUsername = request.Username.Trim().ToLower();
        var exists = await _context.Users.AnyAsync(u => u.Username.ToLower() == normalizedUsername);
        if (exists)
        {
            return BadRequest(ApiResponse<UserProfileDto>.Fail($"Username '{request.Username}' is already taken."));
        }

        var role = await _context.Roles.FindAsync(request.RoleId) 
            ?? await _context.Roles.FirstOrDefaultAsync(r => r.Name.ToLower() == (request.RoleName ?? "").ToLower())
            ?? await _context.Roles.FirstOrDefaultAsync(r => r.Code == "TEACHER");

        var roleId = role?.Id ?? "role-teacher";
        var roleName = role?.Name ?? "Teacher";

        var password = string.IsNullOrWhiteSpace(request.Password) ? "password123" : request.Password;
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

        var defaultAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80";
        if (roleName.Contains("Teacher")) defaultAvatar = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80";
        else if (roleName.Contains("Student")) defaultAvatar = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80";
        else if (roleName.Contains("Accountant")) defaultAvatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80";

        var user = new User
        {
            Id = "usr-" + Guid.NewGuid().ToString("N").Substring(0, 8),
            Username = request.Username.Trim(),
            FullName = request.FullName.Trim(),
            Email = request.Email?.Trim() ?? $"{request.Username.ToLower()}@scholarsacademy.edu.bd",
            PasswordHash = passwordHash,
            RoleId = roleId,
            RoleName = roleName,
            SchoolId = request.SchoolId ?? "sch-01",
            BranchId = request.BranchId ?? "br-01",
            Avatar = string.IsNullOrWhiteSpace(request.Avatar) ? defaultAvatar : request.Avatar,
            Phone = request.Phone?.Trim() ?? "+880 1700-000000",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        user.UserRoles.Add(new UserRole
        {
            UserId = user.Id,
            RoleId = roleId,
            SchoolId = user.SchoolId
        });

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var dto = new UserProfileDto
        {
            Id = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            RoleId = user.RoleId,
            RoleName = user.RoleName,
            SchoolId = user.SchoolId,
            BranchId = user.BranchId,
            Avatar = user.Avatar,
            Phone = user.Phone,
            IsActive = user.IsActive
        };

        return Ok(ApiResponse<UserProfileDto>.Ok(dto, "User account created successfully in database"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> UpdateUser(string id, [FromBody] UpdateUserRequest request)
    {
        var user = await _context.Users.Include(u => u.UserRoles).FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound(ApiResponse<UserProfileDto>.Fail("User not found"));

        user.FullName = request.FullName.Trim();
        user.Email = request.Email.Trim();
        user.Phone = request.Phone?.Trim() ?? user.Phone;
        user.IsActive = request.IsActive;

        if (!string.IsNullOrEmpty(request.RoleId) && request.RoleId != user.RoleId)
        {
            var role = await _context.Roles.FindAsync(request.RoleId);
            if (role != null)
            {
                user.RoleId = role.Id;
                user.RoleName = role.Name;

                user.UserRoles.Clear();
                user.UserRoles.Add(new UserRole
                {
                    UserId = user.Id,
                    RoleId = role.Id,
                    SchoolId = user.SchoolId
                });
            }
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var dto = new UserProfileDto
        {
            Id = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            RoleId = user.RoleId,
            RoleName = user.RoleName,
            SchoolId = user.SchoolId,
            BranchId = user.BranchId,
            Avatar = user.Avatar,
            Phone = user.Phone,
            IsActive = user.IsActive
        };

        return Ok(ApiResponse<UserProfileDto>.Ok(dto, "User profile updated successfully"));
    }

    [HttpPut("{id}/toggle-status")]
    public async Task<ActionResult<ApiResponse<bool>>> ToggleUserStatus(string id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound(ApiResponse<bool>.Fail("User not found"));

        if (user.Username.ToLower() == "admin")
        {
            return BadRequest(ApiResponse<bool>.Fail("Cannot deactivate the primary System Administrator account."));
        }

        user.IsActive = !user.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<bool>.Ok(user.IsActive, $"User account is now {(user.IsActive ? "Active" : "Deactivated")}"));
    }

    [HttpPut("{id}/reset-password")]
    public async Task<ActionResult<ApiResponse<bool>>> ResetPassword(string id, [FromBody] ResetPasswordRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound(ApiResponse<bool>.Fail("User not found"));

        var newPwd = string.IsNullOrWhiteSpace(request.NewPassword) ? "password123" : request.NewPassword;
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPwd);
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<bool>.Ok(true, $"Password for {user.Username} reset successfully"));
    }

    [HttpGet("{id}/menu-permissions")]
    public async Task<ActionResult<ApiResponse<List<UserMenuOverrideDto>>>> GetUserOverrides(string id)
    {
        var overrides = await _context.UserMenuPermissions
            .AsNoTracking()
            .Where(u => u.UserId == id)
            .Select(o => new UserMenuOverrideDto
            {
                UserId = o.UserId,
                MenuCode = o.MenuCode,
                Action = o.Action,
                Override = o.Override.ToString()
            })
            .ToListAsync();

        return Ok(ApiResponse<List<UserMenuOverrideDto>>.Ok(overrides));
    }

    [HttpPut("{id}/menu-permissions")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateUserOverrides(string id, [FromBody] List<UserMenuOverrideDto> request)
    {
        var existing = await _context.UserMenuPermissions.Where(u => u.UserId == id).ToListAsync();
        _context.UserMenuPermissions.RemoveRange(existing);

        foreach (var item in request)
        {
            if (Enum.TryParse<OverrideType>(item.Override, true, out var overrideType))
            {
                _context.UserMenuPermissions.Add(new UserMenuPermission
                {
                    UserId = id,
                    MenuCode = item.MenuCode,
                    Action = item.Action,
                    Override = overrideType,
                    GrantedBy = "admin"
                });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<bool>.Ok(true, "User permission overrides updated successfully in database"));
    }
}

public class CreateUserRequest
{
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string RoleId { get; set; } = string.Empty;
    public string? RoleName { get; set; }
    public string? Phone { get; set; }
    public string? SchoolId { get; set; }
    public string? BranchId { get; set; }
    public string? Avatar { get; set; }
}

public class UpdateUserRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? RoleId { get; set; }
    public bool IsActive { get; set; } = true;
}

public class ResetPasswordRequest
{
    public string NewPassword { get; set; } = string.Empty;
}
