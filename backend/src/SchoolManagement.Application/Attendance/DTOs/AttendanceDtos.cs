namespace SchoolManagement.Application.Attendance.DTOs;

public class AttendanceRecordDto
{
    public string Id { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string SectionId { get; set; } = string.Empty;
    public string Status { get; set; } = "Present";
    public string? Remark { get; set; }
    public string MarkedBy { get; set; } = string.Empty;
    public DateTime? LastUpdated { get; set; }
}

public class AttendanceCorrectionDto
{
    public string Id { get; set; } = string.Empty;
    public string AttendanceId { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string PreviousStatus { get; set; } = string.Empty;
    public string NewStatus { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string UpdatedBy { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public class SaveRosterAttendanceRequest
{
    public string ClassId { get; set; } = string.Empty;
    public string SectionId { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public List<StudentAttendanceItem> Records { get; set; } = new();
}

public class StudentAttendanceItem
{
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
    public string Status { get; set; } = "Present";
    public string? Remark { get; set; }
}
