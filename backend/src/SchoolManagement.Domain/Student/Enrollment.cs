using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Student;

public class Enrollment : BaseEntity, ISchoolScopedEntity
{
    public string SchoolId { get; set; } = "sch-01";
    public string StudentId { get; set; } = string.Empty;
    public string AcademicYearId { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string SectionId { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
    public DateTime EnrollmentDate { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Active";

    public virtual Student? Student { get; set; }
}
