using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SchoolManagement.Application.Auth.DTOs;
using SchoolManagement.Application.Auth.Services;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ICurrentUserService _currentUser;

    public AuthController(IAuthService authService, ICurrentUserService currentUser)
    {
        _authService = authService;
        _currentUser = currentUser;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("AuthLimiter")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login([FromBody] LoginRequest request)
    {
        var (response, error, isUnauthorized) = await _authService.LoginAsync(request);
        if (response == null)
        {
            return isUnauthorized 
                ? Unauthorized(ApiResponse<LoginResponse>.Fail(error ?? "Invalid credentials."))
                : BadRequest(ApiResponse<LoginResponse>.Fail(error ?? "Invalid request."));
        }

        return Ok(ApiResponse<LoginResponse>.Ok(response, "Login successful"));
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Refresh([FromBody] RefreshTokenRequest request)
    {
        var (response, error) = await _authService.RefreshTokenAsync(request);
        if (response == null)
        {
            return Unauthorized(ApiResponse<LoginResponse>.Fail(error ?? "Invalid or expired refresh token."));
        }

        return Ok(ApiResponse<LoginResponse>.Ok(response, "Token refreshed successfully"));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetMe()
    {
        var userId = _currentUser.UserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var profile = await _authService.GetMeAsync(userId);
        if (profile == null) return NotFound(ApiResponse<UserProfileDto>.Fail("User profile not found"));

        return Ok(ApiResponse<UserProfileDto>.Ok(profile));
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> Logout()
    {
        var userId = _currentUser.UserId;
        await _authService.LogoutAsync(userId ?? string.Empty);
        return Ok(ApiResponse<bool>.Ok(true, "Logged out successfully"));
    }
}
