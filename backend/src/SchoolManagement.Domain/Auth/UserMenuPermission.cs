using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Auth;

public class UserMenuPermission : BaseEntity, ICampusScopedEntity
{
    public string SchoolId { get; set; } = "sch-01";
    public string BranchId { get; set; } = "br-01";
    public string UserId { get; set; } = string.Empty;
    public string MenuCode { get; set; } = string.Empty;
    public string Action { get; set; } = "view";
    public OverrideType Override { get; set; } = OverrideType.Inherit;
    public string? GrantedBy { get; set; }

    public virtual User? User { get; set; }
}
