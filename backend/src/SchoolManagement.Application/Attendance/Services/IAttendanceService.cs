using SchoolManagement.Application.Attendance.DTOs;

namespace SchoolManagement.Application.Attendance.Services;

public interface IAttendanceService
{
    Task<List<AttendanceRecordDto>> GetStudentAttendanceAsync(string? classId, string? sectionId, DateTime? date, DateTime? startDate = null, DateTime? endDate = null, List<string>? allowedStudentIds = null);
    Task<bool> SaveStudentAttendanceRosterAsync(SaveRosterAttendanceRequest request, string markedBy, string branchId = "br-01");
    Task<bool> LogAttendanceCorrectionAsync(AttendanceCorrectionDto request, string updatedBy);
    Task<List<AttendanceCorrectionDto>> GetAttendanceCorrectionsAsync();
    Task<WeekendSettingsDto> GetWeekendSettingsAsync(string branchId);
    Task<WeekendSettingsDto> SaveWeekendSettingsAsync(string branchId, WeekendSettingsDto settings, string updatedBy);
    Task<List<AcademicHolidayDto>> GetHolidaysAsync(string branchId);
    Task<AcademicHolidayDto> SaveHolidayAsync(string branchId, AcademicHolidayDto holiday);
    Task<bool> DeleteHolidayAsync(string branchId, string id);
    Task<List<SpecialWorkingDayDto>> GetSpecialWorkingDaysAsync(string branchId);
    Task<SpecialWorkingDayDto> DeclareSpecialWorkingDayAsync(string branchId, SpecialWorkingDayDto request, string declaredBy);
    Task<bool> RemoveSpecialWorkingDayAsync(string branchId, string dateOrId);
}
