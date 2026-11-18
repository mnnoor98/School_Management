namespace SchoolManagement.Application.System.DTOs;

public class AuditLogDto
{
    public string BranchId { get; set; } = string.Empty;
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
    public string BranchId { get; set; } = string.Empty;
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
    public int TodayPresent { get; set; }
    public int TodayTotal { get; set; }
    public int TotalStudents { get; set; }
    public int TotalTeachers { get; set; }
    public decimal AttendanceRate { get; set; }
    public decimal FeeCollectionRate { get; set; }
    public decimal TotalCollectedRevenue { get; set; }
    public decimal TotalDueRevenue { get; set; }
    public int ActiveClasses { get; set; }
    public int ActiveExams { get; set; }
}

public class DatabaseBackupDto
{
    public string FileName { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string FileSizeFormatted { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string Type { get; set; } = "SQL";
    public string Status { get; set; } = "Completed";
}

public class RestoreBackupRequest
{
    public string FileName { get; set; } = string.Empty;
}

public class SystemServerStatusDto
{
    public string ServerTime { get; set; } = string.Empty;
    public string Uptime { get; set; } = string.Empty;
    public string MachineName { get; set; } = string.Empty;
    public string OsDescription { get; set; } = string.Empty;
    public string DotnetVersion { get; set; } = string.Empty;
    public int ProcessId { get; set; }
    public string MemoryUsageFormatted { get; set; } = string.Empty;
    public bool DatabaseHealthy { get; set; }
    public string DatabaseName { get; set; } = string.Empty;
    public double DatabaseLatencyMs { get; set; }
    public bool FrontendDeployed { get; set; }
    public string ActiveFrontendVersion { get; set; } = string.Empty;
    public string FrontendDeployedAt { get; set; } = string.Empty;
    public string FrontendDeployedBy { get; set; } = string.Empty;
    public string FrontendBundleSize { get; set; } = string.Empty;
    public string AppBaseUrl { get; set; } = string.Empty;
    public int TotalDeployedFiles { get; set; }
}

public class DeploymentRecordDto
{
    public string Id { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string ArchiveName { get; set; } = string.Empty;
    public DateTime DeployedAt { get; set; }
    public string DeployedBy { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string FileSizeFormatted { get; set; } = string.Empty;
    public int FileCount { get; set; }
    public string Status { get; set; } = "Active"; // Active, RolledBack, Archived
    public bool HasIndexHtml { get; set; }
    public string Notes { get; set; } = string.Empty;
}

public class RollbackDeploymentRequest
{
    public string DeploymentId { get; set; } = string.Empty;
}

public class BuildDeployResultDto
{
    public bool Success { get; set; }
    public string Version { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public int DeployedFileCount { get; set; }
    public string TotalSizeFormatted { get; set; } = string.Empty;
    public DateTime DeployedAt { get; set; }
    public string BuildLog { get; set; } = string.Empty;
}
