using SchoolManagement.Application.System.DTOs;

namespace SchoolManagement.Application.System.Services;

public interface IAuditLogService
{
    Task<List<AuditLogDto>> GetAuditLogsAsync(int count = 100);
    Task LogActionAsync(string userName, string userRole, string action, string module, string targetRecord, string details, string? schoolScope = null);
    Task<bool> PingDatabaseAsync();
}
