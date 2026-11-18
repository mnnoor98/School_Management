using SchoolManagement.Application.Auth.DTOs;

namespace SchoolManagement.Application.Auth.Services;

public interface IAuthService
{
    Task<(LoginResponse? Response, string? Error, bool IsUnauthorized)> LoginAsync(LoginRequest request);
    Task<(LoginResponse? Response, string? Error)> RefreshTokenAsync(RefreshTokenRequest request);
    Task<UserProfileDto?> GetMeAsync(string userId);
    Task<bool> LogoutAsync(string userId);
}
