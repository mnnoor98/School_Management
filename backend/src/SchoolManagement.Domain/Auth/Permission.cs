using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Auth;

public class Permission : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
