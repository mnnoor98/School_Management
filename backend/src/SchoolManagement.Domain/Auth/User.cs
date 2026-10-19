using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Auth;

public class User : BaseEntity, ISchoolScopedEntity
{
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string RoleId { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
    public string SchoolId { get; set; } = "sch-01";
    public string BranchId { get; set; } = "br-01";
    public string Avatar { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public virtual ICollection<UserMenuPermission> UserOverrides { get; set; } = new List<UserMenuPermission>();
}
