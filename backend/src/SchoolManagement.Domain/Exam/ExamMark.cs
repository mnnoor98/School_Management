using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Exam;

public class ExamMark : BaseEntity, ICampusScopedEntity
{
    public string BranchId { get; set; } = "br-01";
    public string SchoolId { get; set; } = "sch-01";
    public string ExamId { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string SectionId { get; set; } = string.Empty;
    public string SubjectId { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public decimal FullMarks { get; set; } = 100;
    public decimal ObtainedMarks { get; set; } = 0;
    public string Grade { get; set; } = "A+";
    public decimal GradePoint { get; set; } = 5.0m;
    public bool IsPass { get; set; } = true;

    public virtual Exam? Exam { get; set; }
}
