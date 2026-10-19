using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Academic;

public class RoutinePeriod : BaseEntity, ISchoolScopedEntity
{
    public string SchoolId { get; set; } = "sch-01";
    public string Day { get; set; } = string.Empty;
    public int PeriodNumber { get; set; } = 1;
    public string StartTime { get; set; } = "09:00 AM";
    public string EndTime { get; set; } = "09:45 AM";
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SectionId { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string SubjectId { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string TeacherId { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public string RoomNo { get; set; } = "Room 101";
}
