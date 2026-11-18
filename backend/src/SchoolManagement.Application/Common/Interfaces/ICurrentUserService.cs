namespace SchoolManagement.Application.Common.Interfaces;

public interface ICurrentUserService
{
    string? UserId { get; }
    string? Username { get; }
    string? RoleName { get; }
    string? RoleId { get; }
    string SchoolId { get; }
    string BranchId { get; }
    bool IsAuthenticated { get; }
    bool IsSuperAdmin { get; }
}
