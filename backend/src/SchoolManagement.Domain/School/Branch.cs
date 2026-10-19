using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.School;

public class Branch : BaseEntity, ISchoolScopedEntity
{
    public string SchoolId { get; set; } = "sch-01";
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
