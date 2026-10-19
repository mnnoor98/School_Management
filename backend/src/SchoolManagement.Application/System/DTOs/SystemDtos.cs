namespace SchoolManagement.Application.System.DTOs;

public class AuditLogDto
{
    public string Id { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string TargetRecord { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string SchoolScope { get; set; } = string.Empty;
}

public class NoticeDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public string TargetAudience { get; set; } = "All";
    public DateTime PublishedDate { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsImportant { get; set; }
    public string Author { get; set; } = string.Empty;
}

public class DashboardStatsDto
{
    public int TotalStudents { get; set; }
    public int TotalTeachers { get; set; }
    public decimal AttendanceRate { get; set; }
    public decimal FeeCollectionRate { get; set; }
    public decimal TotalCollectedRevenue { get; set; }
    public decimal TotalDueRevenue { get; set; }
    public int ActiveClasses { get; set; }
    public int ActiveExams { get; set; }
}
