using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Academic;

public class Section : BaseEntity, ICampusScopedEntity
{
    public string BranchId { get; set; } = "br-01";
    public string SchoolId { get; set; } = "sch-01";
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Capacity { get; set; } = 40;
    public string? ClassTeacherId { get; set; }
    public string? ClassTeacherName { get; set; }

    public virtual SchoolClass? SchoolClass { get; set; }
}
