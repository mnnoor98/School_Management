using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Auth.DTOs;
using SchoolManagement.Application.Auth.Services;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.Menus.DTOs;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ICurrentUserService _currentUser;

    public UsersController(IUserService userService, ICurrentUserService currentUser)
    {
        _userService = userService;
        _currentUser = currentUser;
    }

    [HttpGet]
    [Authorize(Policy = SchoolManagement.Api.Security.SecurityPolicies.CampusAdministrator)]
    public async Task<ActionResult<ApiResponse<List<UserProfileDto>>>> GetUsers()
    {
        var users = await _userService.GetUsersAsync(_currentUser.BranchId);
        return Ok(ApiResponse<List<UserProfileDto>>.Ok(users));
    }

    [HttpPost]
    [Authorize(Policy = SchoolManagement.Api.Security.SecurityPolicies.CampusAdministrator)]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> CreateUser([FromBody] CreateUserRequest request)
    {
        var (user, error) = await _userService.CreateUserAsync(request, _currentUser.BranchId, _currentUser.SchoolId, _currentUser.IsSuperAdmin);
        if (!string.IsNullOrEmpty(error))
        {
            return BadRequest(ApiResponse<UserProfileDto>.Fail(error));
        }

        return Ok(ApiResponse<UserProfileDto>.Ok(user!, "User account created successfully in database"));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = SchoolManagement.Api.Security.SecurityPolicies.CampusAdministrator)]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> UpdateUser(string id, [FromBody] UpdateUserRequest request)
    {
        var (user, error) = await _userService.UpdateUserAsync(id, request, _currentUser.BranchId);
        if (!string.IsNullOrEmpty(error))
        {
            return error == "User not found"
                ? NotFound(ApiResponse<UserProfileDto>.Fail(error))
                : BadRequest(ApiResponse<UserProfileDto>.Fail(error));
        }

        return Ok(ApiResponse<UserProfileDto>.Ok(user!, "User profile updated successfully"));
    }

    [HttpPut("{id}/toggle-status")]
    [Authorize(Policy = SchoolManagement.Api.Security.SecurityPolicies.CampusAdministrator)]
    public async Task<ActionResult<ApiResponse<bool>>> ToggleUserStatus(string id)
    {
        var (success, isActive, error) = await _userService.ToggleUserStatusAsync(id, _currentUser.BranchId);
        if (!success)
        {
            return error == "User not found"
                ? NotFound(ApiResponse<bool>.Fail(error!))
                : BadRequest(ApiResponse<bool>.Fail(error!));
        }

        return Ok(ApiResponse<bool>.Ok(isActive!.Value, $"User account is now {(isActive.Value ? "Active" : "Deactivated")}"));
    }

    [HttpPut("{id}/reset-password")]
    [Authorize(Policy = SchoolManagement.Api.Security.SecurityPolicies.CampusAdministrator)]
    public async Task<ActionResult<ApiResponse<bool>>> ResetPassword(string id, [FromBody] ResetPasswordRequest request)
    {
        var (success, error) = await _userService.ResetPasswordAsync(id, _currentUser.BranchId, request.NewPassword);
        if (!success) return NotFound(ApiResponse<bool>.Fail(error ?? "User not found"));

        return Ok(ApiResponse<bool>.Ok(true, "Password reset successfully"));
    }

    [HttpGet("{id}/menu-permissions")]
    [Authorize(Policy = SchoolManagement.Api.Security.SecurityPolicies.CampusAdministrator)]
    public async Task<ActionResult<ApiResponse<List<UserMenuOverrideDto>>>> GetUserOverrides(string id)
    {
        var (overrides, error) = await _userService.GetUserOverridesAsync(id, _currentUser.BranchId);
        if (!string.IsNullOrEmpty(error)) return NotFound();

        return Ok(ApiResponse<List<UserMenuOverrideDto>>.Ok(overrides!));
    }

    [HttpPut("{id}/menu-permissions")]
    [Authorize(Policy = SchoolManagement.Api.Security.SecurityPolicies.CampusAdministrator)]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateUserOverrides(string id, [FromBody] List<UserMenuOverrideDto> request)
    {
        var (success, error) = await _userService.UpdateUserOverridesAsync(id, _currentUser.BranchId, request, _currentUser.Username ?? "admin");
        if (!success) return NotFound();

        return Ok(ApiResponse<bool>.Ok(true, "User permission overrides updated successfully in database"));
    }

    [HttpPost("change-password")]
    public async Task<ActionResult<ApiResponse<bool>>> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var currentUserId = _currentUser.UserId;
        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized(ApiResponse<bool>.Fail("User identity could not be verified."));
        }

        var (success, error) = await _userService.ChangePasswordAsync(currentUserId, request.CurrentPassword, request.NewPassword);
        if (!success)
        {
            return BadRequest(ApiResponse<bool>.Fail(error ?? "Could not change password."));
        }

        return Ok(ApiResponse<bool>.Ok(true, "Password changed successfully."));
    }

    [HttpPut("my-profile")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> UpdateMyProfile([FromBody] UpdateMyProfileRequest request)
    {
        var currentUserId = _currentUser.UserId;
        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized(ApiResponse<UserProfileDto>.Fail("User identity could not be verified."));
        }

        var (user, error) = await _userService.UpdateMyProfileAsync(currentUserId, request, _currentUser.IsSuperAdmin);
        if (!string.IsNullOrEmpty(error))
        {
            return NotFound(ApiResponse<UserProfileDto>.Fail(error));
        }

        return Ok(ApiResponse<UserProfileDto>.Ok(user!, "Profile updated successfully."));
    }
}
