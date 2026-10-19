using SchoolManagement.Domain.Auth;

namespace SchoolManagement.Application.Common.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
}
