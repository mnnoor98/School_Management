using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.School;

public class AcademicYear : BaseEntity, ISchoolScopedEntity
{
    public string SchoolId { get; set; } = "sch-01";
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsCurrent { get; set; } = true;
    public bool IsLocked { get; set; } = false;
}
