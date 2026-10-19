using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Auth;

public class UserRole : BaseEntity, ISchoolScopedEntity
{
    public string UserId { get; set; } = string.Empty;
    public string RoleId { get; set; } = string.Empty;
    public string SchoolId { get; set; } = "sch-01";

    public virtual User? User { get; set; }
    public virtual Role? Role { get; set; }
}
