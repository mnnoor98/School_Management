using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Auth.DTOs;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Menus.DTOs;
using SchoolManagement.Domain.Auth;
using SchoolManagement.Domain.Common;

namespace SchoolManagement.Application.Auth.Services;

public class UserService : IUserService
{
    private readonly IApplicationDbContext _context;

    public UserService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserProfileDto>> GetUsersAsync(string branchId, bool isSuperAdmin = false)
    {
        var query = _context.Users.AsNoTracking();
        if (!string.IsNullOrEmpty(branchId))
        {
            query = query.Where(u => u.BranchId == branchId);
        }

        return await query
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
    }

    public async Task<UserProfileDto?> GetUserByIdAsync(string id, string branchId)
    {
        var u = await _context.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && x.BranchId == branchId);
        if (u == null) return null;

        return new UserProfileDto
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
        };
    }

    public async Task<(UserProfileDto? User, string? Error)> CreateUserAsync(CreateUserRequest request, string currentBranchId, string currentSchoolId, bool isSuperAdmin)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.FullName))
        {
            return (null, "Username and Full Name are required.");
        }

        var normalizedUsername = request.Username.Trim().ToLower();
        var exists = await _context.Users.AnyAsync(u => u.Username.ToLower() == normalizedUsername);
        if (exists)
        {
            return (null, $"Username '{request.Username}' is already taken.");
        }

        var role = await _context.Roles.FindAsync(request.RoleId)
            ?? await _context.Roles.FirstOrDefaultAsync(r => r.Name.ToLower() == (request.RoleName ?? "").ToLower())
            ?? await _context.Roles.FirstOrDefaultAsync(r => r.Code == "TEACHER");

        if (!isSuperAdmin && role?.Code == "SUPER_ADMIN")
        {
            return (null, "Campus administrators cannot create Super Administrator accounts.");
        }

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
            SchoolId = currentSchoolId,
            BranchId = (!string.IsNullOrWhiteSpace(request.BranchId) && isSuperAdmin) ? request.BranchId.Trim() : currentBranchId,
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

        return (dto, null);
    }

    public async Task<(UserProfileDto? User, string? Error)> UpdateUserAsync(string id, UpdateUserRequest request, string branchId, bool isSuperAdmin = false)
    {
        var user = isSuperAdmin
            ? await _context.Users.Include(u => u.UserRoles).FirstOrDefaultAsync(u => u.Id == id)
            : await _context.Users.Include(u => u.UserRoles).FirstOrDefaultAsync(u => u.Id == id && u.BranchId == branchId);

        if (user == null) return (null, "User not found");

        user.FullName = request.FullName.Trim();
        user.Email = request.Email.Trim();
        user.Phone = request.Phone?.Trim() ?? user.Phone;
        user.IsActive = request.IsActive;

        if (isSuperAdmin && !string.IsNullOrWhiteSpace(request.BranchId) && request.BranchId != user.BranchId)
        {
            var branchExists = await _context.Branches.AnyAsync(b => b.Id == request.BranchId.Trim());
            if (branchExists)
            {
                user.BranchId = request.BranchId.Trim();
            }
        }

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

        return (dto, null);
    }

    public async Task<(bool Success, bool? IsActive, string? Error)> ToggleUserStatusAsync(string id, string branchId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.BranchId == branchId);
        if (user == null) return (false, null, "User not found");

        if (user.Username.ToLower() == "admin")
        {
            return (false, null, "Cannot deactivate the primary System Administrator account.");
        }

        user.IsActive = !user.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return (true, user.IsActive, null);
    }

    public async Task<(bool Success, string? Error)> ResetPasswordAsync(string id, string branchId, string newPassword)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.BranchId == branchId);
        if (user == null) return (false, "User not found");

        var newPwd = string.IsNullOrWhiteSpace(newPassword) ? "password123" : newPassword;
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPwd);
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(List<UserMenuOverrideDto>? Overrides, string? Error)> GetUserOverridesAsync(string id, string branchId)
    {
        if (!await _context.Users.AnyAsync(u => u.Id == id && u.BranchId == branchId))
            return (null, "User not found");

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

        return (overrides, null);
    }

    public async Task<(bool Success, string? Error)> UpdateUserOverridesAsync(string id, string branchId, List<UserMenuOverrideDto> request, string grantedBy)
    {
        if (!await _context.Users.AnyAsync(u => u.Id == id && u.BranchId == branchId))
            return (false, "User not found");

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
                    GrantedBy = grantedBy
                });
            }
        }

        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return (false, "User account not found.");

        if (string.IsNullOrWhiteSpace(currentPassword) || string.IsNullOrWhiteSpace(newPassword))
        {
            return (false, "Current password and new password are required.");
        }

        if (newPassword.Length < 6)
        {
            return (false, "New password must be at least 6 characters long.");
        }

        bool valid = BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash);
        if (!valid)
        {
            return (false, "Incorrect current password.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(UserProfileDto? User, string? Error)> UpdateMyProfileAsync(string userId, UpdateMyProfileRequest request, bool isSuperAdmin)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return (null, "User account not found.");

        if (!string.IsNullOrWhiteSpace(request.FullName)) user.FullName = request.FullName.Trim();
        if (!string.IsNullOrWhiteSpace(request.Email)) user.Email = request.Email.Trim();
        if (!string.IsNullOrWhiteSpace(request.Phone)) user.Phone = request.Phone.Trim();
        if (!string.IsNullOrWhiteSpace(request.Avatar)) user.Avatar = request.Avatar.Trim();

        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var dto = new UserProfileDto
        {
            IsSuperAdmin = isSuperAdmin,
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

        return (dto, null);
    }
}
