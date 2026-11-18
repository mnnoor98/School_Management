using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Attendance;

public class AttendanceRecord : BaseEntity, ICampusScopedEntity
{
    public string BranchId { get; set; } = "br-01";
    public string SchoolId { get; set; } = "sch-01";
    public string EnrollmentId { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string SectionId { get; set; } = string.Empty;
    public DateTime AttendanceDate { get; set; }
    public string Status { get; set; } = "Present";
    public string? Remark { get; set; }
    public string MarkedBy { get; set; } = string.Empty;
}
