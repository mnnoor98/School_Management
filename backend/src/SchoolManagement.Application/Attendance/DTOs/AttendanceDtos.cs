namespace SchoolManagement.Application.Attendance.DTOs;

public class AttendanceRecordDto
{
    public string BranchId { get; set; } = string.Empty;
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
    public string BranchId { get; set; } = string.Empty;
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

public class WeekendSettingsDto
{
    public string BranchId { get; set; } = string.Empty;
    public List<int> WeekendDays { get; set; } = new() { 5, 6 }; // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
    public string CustomNote { get; set; } = string.Empty;
    public string UpdatedBy { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class AcademicHolidayDto
{
    public string Id { get; set; } = string.Empty;
    public string BranchId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty; // YYYY-MM-DD
    public string EndDate { get; set; } = string.Empty;   // YYYY-MM-DD
    public string Type { get; set; } = "Public"; // Public, Religious, Institutional, Vacation, Emergency
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}

public class SpecialWorkingDayDto
{
    public string Id { get; set; } = string.Empty;
    public string BranchId { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty; // YYYY-MM-DD
    public string Reason { get; set; } = string.Empty;
    public string OrderReference { get; set; } = string.Empty;
    public string DeclaredBy { get; set; } = string.Empty;
    public DateTime DeclaredAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
}
