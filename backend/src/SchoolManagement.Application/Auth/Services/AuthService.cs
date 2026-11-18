using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Auth.DTOs;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Domain.Auth;

namespace SchoolManagement.Application.Auth.Services;

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _context;
    private readonly ITokenService _tokenService;

    public AuthService(IApplicationDbContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<(LoginResponse? Response, string? Error, bool IsUnauthorized)> LoginAsync(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return (null, "Username and password are required.", false);
        }

        var user = await _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.Trim().ToLower());

        if (user == null || !user.IsActive)
        {
            return (null, "Invalid credentials or account is deactivated.", true);
        }

        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!isPasswordValid)
        {
            return (null, "Invalid credentials.", true);
        }

        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshTokenString = _tokenService.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshTokenString,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        };
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        var response = new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshTokenString,
            ExpiresAt = DateTime.UtcNow.AddHours(8),
            User = new UserProfileDto
            {
                IsSuperAdmin = await IsSuperAdminAsync(user),
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
            }
        };

        return (response, null, false);
    }

    public async Task<(LoginResponse? Response, string? Error)> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var existingToken = await _context.RefreshTokens
            .IgnoreQueryFilters()
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == request.RefreshToken && !r.IsRevoked);

        if (existingToken == null || existingToken.ExpiresAt < DateTime.UtcNow
            || existingToken.User == null || !existingToken.User.IsActive)
        {
            return (null, "Invalid or expired refresh token.");
        }

        // Token rotation
        existingToken.IsRevoked = true;
        var newAccessToken = _tokenService.GenerateAccessToken(existingToken.User);
        var newRefreshToken = _tokenService.GenerateRefreshToken();

        _context.RefreshTokens.Add(new RefreshToken
        {
            UserId = existingToken.UserId,
            Token = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        });

        await _context.SaveChangesAsync();

        var response = new LoginResponse
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(8),
            User = new UserProfileDto
            {
                IsSuperAdmin = await IsSuperAdminAsync(existingToken.User),
                Id = existingToken.User.Id,
                Username = existingToken.User.Username,
                FullName = existingToken.User.FullName,
                Email = existingToken.User.Email,
                RoleId = existingToken.User.RoleId,
                RoleName = existingToken.User.RoleName,
                SchoolId = existingToken.User.SchoolId,
                BranchId = existingToken.User.BranchId,
                Avatar = existingToken.User.Avatar,
                Phone = existingToken.User.Phone,
                IsActive = existingToken.User.IsActive
            }
        };

        return (response, null);
    }

    public async Task<UserProfileDto?> GetMeAsync(string userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return null;

        return new UserProfileDto
        {
            IsSuperAdmin = await IsSuperAdminAsync(user),
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
    }

    public async Task<bool> LogoutAsync(string userId)
    {
        if (string.IsNullOrEmpty(userId)) return false;

        var tokens = await _context.RefreshTokens.Where(r => r.UserId == userId && !r.IsRevoked).ToListAsync();
        foreach (var t in tokens) t.IsRevoked = true;
        await _context.SaveChangesAsync();
        return true;
    }

    private Task<bool> IsSuperAdminAsync(User user) => _context.Roles.IgnoreQueryFilters()
        .AnyAsync(r => r.Id == user.RoleId && r.SchoolId == user.SchoolId && r.IsActive && r.IsSystem && r.Code == "SUPER_ADMIN");
}
