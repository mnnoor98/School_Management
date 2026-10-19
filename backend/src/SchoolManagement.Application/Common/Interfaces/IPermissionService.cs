using SchoolManagement.Domain.Auth;

namespace SchoolManagement.Application.Common.Interfaces;

public interface IPermissionService
{
    Task<List<Menu>> GetAuthorizedMenuTreeAsync(string userId, string roleId);
    Task<bool> HasPermissionAsync(string userId, string roleId, string menuCode, string action);
}
