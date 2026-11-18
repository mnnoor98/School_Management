using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Attendance;

public class AttendanceCorrectionLog : BaseEntity, ICampusScopedEntity
{
    public string BranchId { get; set; } = "br-01";
    public string SchoolId { get; set; } = "sch-01";
    public string AttendanceRecordId { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string PreviousStatus { get; set; } = string.Empty;
    public string NewStatus { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string UpdatedBy { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
