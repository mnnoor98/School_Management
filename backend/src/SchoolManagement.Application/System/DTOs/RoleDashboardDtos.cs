namespace SchoolManagement.Application.System.DTOs;

public class PrincipalDashboardDto
{
    public CampusKpiSummaryDto Kpis { get; set; } = new();
    public List<ClassAttendanceMetricDto> ClassAttendanceBreakdown { get; set; } = new();
    public List<PendingTeacherLeaveDto> PendingTeacherLeaves { get; set; } = new();
    public ExamPerformanceAnalyticsDto LatestExamAnalytics { get; set; } = new();
    public List<DashboardAlertDto> CriticalAlerts { get; set; } = new();
}

public class CampusKpiSummaryDto
{
    public decimal TodayAttendanceRate { get; set; }
    public int TodayPresentCount { get; set; }
    public int TodayTotalExpected { get; set; }
    public int TotalStudents { get; set; }
    public int TotalTeachers { get; set; }
    public int UnsubmittedAttendanceSections { get; set; }
    public int PendingTeacherLeavesCount { get; set; }
    public decimal LatestExamAverageGpa { get; set; }
    public decimal FeeCollectionRate { get; set; }
}

public class ClassAttendanceMetricDto
{
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public int TotalStudents { get; set; }
    public int PresentToday { get; set; }
    public decimal AttendanceRate { get; set; }
    public bool HasSubmitted { get; set; }
}

public class PendingTeacherLeaveDto
{
    public string ApplicationId { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string LeaveType { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalDays { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime AppliedAt { get; set; }
}

public class ExamPerformanceAnalyticsDto
{
    public string ExamId { get; set; } = string.Empty;
    public string ExamName { get; set; } = string.Empty;
    public int TotalEvaluated { get; set; }
    public int PassCount { get; set; }
    public int FailCount { get; set; }
    public decimal PassRate { get; set; }
    public decimal AverageGpa { get; set; }
    public Dictionary<string, int> GradeDistribution { get; set; } = new();
}

public class DashboardAlertDto
{
    public string Severity { get; set; } = "Info"; // Danger, Warning, Info, Success
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string ActionRoute { get; set; } = string.Empty;
    public string ActionText { get; set; } = string.Empty;
}

public class TeacherDashboardDto
{
    public string TeacherId { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public List<TeacherRoutinePeriodDto> TodayRoutine { get; set; } = new();
    public TeacherClassSectionAttendanceDto? ClassTeacherSection { get; set; }
    public List<TeacherPendingMarksSubjectDto> PendingMarksEntries { get; set; } = new();
    public List<TeacherAtRiskStudentDto> AtRiskStudents { get; set; } = new();
}

public class TeacherRoutinePeriodDto
{
    public int PeriodNumber { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string RoomNumber { get; set; } = string.Empty;
    public bool IsCurrentPeriod { get; set; }
    public bool IsCompleted { get; set; }
}

public class TeacherClassSectionAttendanceDto
{
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SectionId { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public int TotalStudents { get; set; }
    public int PresentToday { get; set; }
    public int AbsentToday { get; set; }
    public bool IsAttendanceSubmittedToday { get; set; }
}

public class TeacherPendingMarksSubjectDto
{
    public string ExamId { get; set; } = string.Empty;
    public string ExamName { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SubjectId { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public int TotalStudents { get; set; }
    public int EvaluatedStudents { get; set; }
    public decimal ProgressPercent { get; set; }
}

public class TeacherAtRiskStudentDto
{
    public string StudentId { get; set; } = string.Empty;
    public string AdmissionNo { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public decimal AttendanceRate { get; set; }
    public decimal LatestExamGpa { get; set; }
    public string RiskType { get; set; } = string.Empty; // "Shortage", "Failing", "Both"
}

public class AccountantDashboardDto
{
    public decimal TodayTotalCollected { get; set; }
    public decimal TodayCashInDrawer { get; set; }
    public decimal TodayMfsTotal { get; set; }
    public decimal TodayBankTotal { get; set; }
    public int TodayReceiptCount { get; set; }
    public decimal MonthlyTargetRevenue { get; set; }
    public decimal MonthlyCollectedRevenue { get; set; }
    public decimal MonthlyDueRevenue { get; set; }
    public decimal MonthlyCollectionRate { get; set; }
    public OverdueAgingDto OverdueAging { get; set; } = new();
    public List<ClassFeeSummaryDto> ClassCollectionBreakdown { get; set; } = new();
    public List<RecentReceiptSummaryDto> RecentReceipts { get; set; } = new();
}

public class OverdueAgingDto
{
    public decimal CurrentDue0To30 { get; set; }
    public decimal Overdue31To60 { get; set; }
    public decimal Overdue61To90 { get; set; }
    public decimal OverdueAbove90 { get; set; }
}

public class ClassFeeSummaryDto
{
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public decimal TotalInvoiced { get; set; }
    public decimal TotalCollected { get; set; }
    public decimal TotalDue { get; set; }
    public decimal CollectionRate { get; set; }
}

public class RecentReceiptSummaryDto
{
    public string ReceiptNo { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public decimal AmountPaid { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public string FeeTypeName { get; set; } = string.Empty;
}

public class SuperAdminDashboardDto
{
    public int TotalCampuses { get; set; }
    public int TotalGlobalStudents { get; set; }
    public int TotalGlobalTeachers { get; set; }
    public decimal GlobalMonthlyRevenue { get; set; }
    public decimal GlobalMonthlyCollected { get; set; }
    public decimal GlobalCollectionRate { get; set; }
    public List<CampusSummaryMetricDto> CampusSummaries { get; set; } = new();
    public List<AuditLogDto> RecentAuditLogs { get; set; } = new();
}

public class CampusSummaryMetricDto
{
    public string BranchId { get; set; } = string.Empty;
    public string BranchCode { get; set; } = string.Empty;
    public string BranchName { get; set; } = string.Empty;
    public int StudentCount { get; set; }
    public int TeacherCount { get; set; }
    public decimal TodayAttendanceRate { get; set; }
    public decimal FeeCollectionRate { get; set; }
    public decimal TotalCollected { get; set; }
    public bool IsActive { get; set; }
}

public class StudentDashboardDto
{
    public string StudentId { get; set; } = string.Empty;
    public string AdmissionNo { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public decimal AttendanceRate { get; set; }
    public int TotalDaysHeld { get; set; }
    public int TotalPresentDays { get; set; }
    public bool IsAttendanceShortage { get; set; } // < 75%
    public decimal TotalDueFee { get; set; }
    public StudentLatestResultDto? LatestResult { get; set; }
    public List<UpcomingExamScheduleDto> UpcomingExams { get; set; } = new();
    public List<TeacherRoutinePeriodDto> TodayRoutine { get; set; } = new();
}

public class StudentLatestResultDto
{
    public string ExamName { get; set; } = string.Empty;
    public decimal TotalMarks { get; set; }
    public decimal ObtainedMarks { get; set; }
    public decimal Gpa { get; set; }
    public string LetterGrade { get; set; } = string.Empty;
    public int PositionInClass { get; set; }
}

public class UpcomingExamScheduleDto
{
    public string ExamName { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public DateTime ExamDate { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string RoomNumber { get; set; } = string.Empty;
}

public class GuardianDashboardDto
{
    public string GuardianName { get; set; } = string.Empty;
    public StudentDashboardDto Ward { get; set; } = new();
    public string TodayAttendanceStatus { get; set; } = "Not Registered"; // Present, Absent, Late
    public string TodayAttendanceTime { get; set; } = string.Empty;
    public List<NoticeDto> UrgentNotices { get; set; } = new();
}
