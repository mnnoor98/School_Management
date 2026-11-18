using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Exam;

public class Exam : BaseEntity, ICampusScopedEntity
{
    public string BranchId { get; set; } = "br-01";
    public string SchoolId { get; set; } = "sch-01";
    public string AcademicYearId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Term { get; set; } = "Term 1";
    public string AcademicYear { get; set; } = "2026";
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsPublished { get; set; } = false;

    public virtual ICollection<ExamMark> Marks { get; set; } = new List<ExamMark>();
}
