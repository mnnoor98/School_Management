using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Auth;

public class RoleMenuPermission : BaseEntity
{
    public string RoleId { get; set; } = string.Empty;
    public string MenuCode { get; set; } = string.Empty;
    public bool View { get; set; } = true;
    public bool Create { get; set; } = false;
    public bool Edit { get; set; } = false;
    public bool Delete { get; set; } = false;
    public bool Approve { get; set; } = false;
    public bool Export { get; set; } = false;

    public virtual Role? Role { get; set; }
}
