using SchoolManagement.Application.System.DTOs;

namespace SchoolManagement.Application.System.Services;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetDashboardStatsAsync();
    Task<PrincipalDashboardDto> GetPrincipalDashboardAsync();
    Task<TeacherDashboardDto> GetTeacherDashboardAsync(string? teacherId = null);
    Task<AccountantDashboardDto> GetAccountantDashboardAsync();
    Task<SuperAdminDashboardDto> GetSuperAdminDashboardAsync();
    Task<StudentDashboardDto> GetStudentDashboardAsync(string? studentId = null);
    Task<GuardianDashboardDto> GetGuardianDashboardAsync(string? guardianUserId = null);
}
