using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Exam;

public class ExamScheduleItem : BaseEntity, ICampusScopedEntity
{
    public string BranchId { get; set; } = "br-01";
    public string SchoolId { get; set; } = "sch-01";
    public string ExamId { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SubjectId { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public DateTime ExamDate { get; set; }
    public string Day { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string RoomNo { get; set; } = string.Empty;
    public decimal FullMarks { get; set; } = 100;
    public decimal PassMarks { get; set; } = 33;
}
