using SchoolManagement.Application.Auth.DTOs;
using SchoolManagement.Application.Menus.DTOs;

namespace SchoolManagement.Application.Auth.Services;

public interface IUserService
{
    Task<List<UserProfileDto>> GetUsersAsync(string branchId);
    Task<UserProfileDto?> GetUserByIdAsync(string id, string branchId);
    Task<(UserProfileDto? User, string? Error)> CreateUserAsync(CreateUserRequest request, string currentBranchId, string currentSchoolId, bool isSuperAdmin);
    Task<(UserProfileDto? User, string? Error)> UpdateUserAsync(string id, UpdateUserRequest request, string branchId);
    Task<(bool Success, bool? IsActive, string? Error)> ToggleUserStatusAsync(string id, string branchId);
    Task<(bool Success, string? Error)> ResetPasswordAsync(string id, string branchId, string newPassword);
    Task<(List<UserMenuOverrideDto>? Overrides, string? Error)> GetUserOverridesAsync(string id, string branchId);
    Task<(bool Success, string? Error)> UpdateUserOverridesAsync(string id, string branchId, List<UserMenuOverrideDto> request, string grantedBy);
    Task<(bool Success, string? Error)> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
    Task<(UserProfileDto? User, string? Error)> UpdateMyProfileAsync(string userId, UpdateMyProfileRequest request, bool isSuperAdmin);
}
