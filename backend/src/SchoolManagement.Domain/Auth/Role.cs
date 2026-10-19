using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Auth;

public class Role : BaseEntity, ISchoolScopedEntity
{
    public string SchoolId { get; set; } = "sch-01";
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsSystem { get; set; } = false;
    public bool IsActive { get; set; } = true;

    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public virtual ICollection<RoleMenuPermission> RoleMenuPermissions { get; set; } = new List<RoleMenuPermission>();
}
