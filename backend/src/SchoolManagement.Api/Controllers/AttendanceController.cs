using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Attendance.DTOs;
using SchoolManagement.Application.Attendance.Services;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _attendanceService;
    private readonly ICurrentUserService _currentUser;
    private readonly IStudentAccessService _studentAccess;

    public AttendanceController(
        IAttendanceService attendanceService,
        ICurrentUserService currentUser,
        IStudentAccessService studentAccess)
    {
        _attendanceService = attendanceService;
        _currentUser = currentUser;
        _studentAccess = studentAccess;
    }

    [HttpGet("students")]
    public async Task<ActionResult<ApiResponse<List<AttendanceRecordDto>>>> GetStudentAttendance(
        [FromQuery] string? classId, 
        [FromQuery] string? sectionId, 
        [FromQuery] DateTime? date,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var allowedIds = await _studentAccess.GetAllowedStudentIdsAsync();
        var list = await _attendanceService.GetStudentAttendanceAsync(classId, sectionId, date, startDate, endDate, allowedIds);
        return Ok(ApiResponse<List<AttendanceRecordDto>>.Ok(list));
    }

    [HttpGet("corrections")]
    public async Task<ActionResult<ApiResponse<List<AttendanceCorrectionDto>>>> GetAttendanceCorrections()
    {
        var list = await _attendanceService.GetAttendanceCorrectionsAsync();
        return Ok(ApiResponse<List<AttendanceCorrectionDto>>.Ok(list));
    }

    [HttpPost("students")]
    public async Task<ActionResult<ApiResponse<bool>>> SaveStudentAttendanceRoster([FromBody] SaveRosterAttendanceRequest request)
    {
        if (await _studentAccess.IsRestrictedUserAsync())
        {
            return Forbid();
        }

        var branchId = Request.Headers["X-Campus-Id"].FirstOrDefault() ?? _currentUser.BranchId ?? "br-01";
        var markedBy = _currentUser.Username ?? "teacher";
        await _attendanceService.SaveStudentAttendanceRosterAsync(request, markedBy, branchId);
        return Ok(ApiResponse<bool>.Ok(true, "Attendance roster saved successfully"));
    }

    [HttpPost("correction")]
    public async Task<ActionResult<ApiResponse<bool>>> LogAttendanceCorrection([FromBody] AttendanceCorrectionDto request)
    {
        if (await _studentAccess.IsRestrictedUserAsync())
        {
            return Forbid();
        }

        var updatedBy = _currentUser.Username ?? "admin";
        await _attendanceService.LogAttendanceCorrectionAsync(request, updatedBy);
        return Ok(ApiResponse<bool>.Ok(true, "Correction logged and record updated"));
    }

    [HttpGet("weekend-settings")]
    public async Task<ActionResult<ApiResponse<WeekendSettingsDto>>> GetWeekendSettings()
    {
        var branchId = Request.Headers["X-Campus-Id"].FirstOrDefault() ?? _currentUser.BranchId ?? "br-01";
        var settings = await _attendanceService.GetWeekendSettingsAsync(branchId);
        return Ok(ApiResponse<WeekendSettingsDto>.Ok(settings));
    }

    [HttpPost("weekend-settings")]
    public async Task<ActionResult<ApiResponse<WeekendSettingsDto>>> SaveWeekendSettings([FromBody] WeekendSettingsDto request)
    {
        var branchId = Request.Headers["X-Campus-Id"].FirstOrDefault() ?? _currentUser.BranchId ?? "br-01";
        var updatedBy = _currentUser.Username ?? "Principal";
        var settings = await _attendanceService.SaveWeekendSettingsAsync(branchId, request, updatedBy);
        return Ok(ApiResponse<WeekendSettingsDto>.Ok(settings, "Institutional weekend schedule updated successfully"));
    }

    [HttpGet("holidays")]
    public async Task<ActionResult<ApiResponse<List<AcademicHolidayDto>>>> GetHolidays()
    {
        var branchId = Request.Headers["X-Campus-Id"].FirstOrDefault() ?? _currentUser.BranchId ?? "br-01";
        var holidays = await _attendanceService.GetHolidaysAsync(branchId);
        return Ok(ApiResponse<List<AcademicHolidayDto>>.Ok(holidays));
    }

    [HttpPost("holidays")]
    public async Task<ActionResult<ApiResponse<AcademicHolidayDto>>> SaveHoliday([FromBody] AcademicHolidayDto request)
    {
        var branchId = Request.Headers["X-Campus-Id"].FirstOrDefault() ?? _currentUser.BranchId ?? "br-01";
        var holiday = await _attendanceService.SaveHolidayAsync(branchId, request);
        return Ok(ApiResponse<AcademicHolidayDto>.Ok(holiday, "Academic holiday saved successfully"));
    }

    [HttpDelete("holidays/{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteHoliday(string id)
    {
        var branchId = Request.Headers["X-Campus-Id"].FirstOrDefault() ?? _currentUser.BranchId ?? "br-01";
        var success = await _attendanceService.DeleteHolidayAsync(branchId, id);
        return Ok(ApiResponse<bool>.Ok(success, success ? "Holiday removed successfully" : "Holiday not found"));
    }

    [HttpGet("special-working-days")]
    public async Task<ActionResult<ApiResponse<List<SpecialWorkingDayDto>>>> GetSpecialWorkingDays()
    {
        var branchId = Request.Headers["X-Campus-Id"].FirstOrDefault() ?? _currentUser.BranchId ?? "br-01";
        var list = await _attendanceService.GetSpecialWorkingDaysAsync(branchId);
        return Ok(ApiResponse<List<SpecialWorkingDayDto>>.Ok(list));
    }

    [HttpPost("special-working-days")]
    public async Task<ActionResult<ApiResponse<SpecialWorkingDayDto>>> DeclareSpecialWorkingDay([FromBody] SpecialWorkingDayDto request)
    {
        var branchId = Request.Headers["X-Campus-Id"].FirstOrDefault() ?? _currentUser.BranchId ?? "br-01";
        var declaredBy = _currentUser.Username ?? "Administrator";
        var result = await _attendanceService.DeclareSpecialWorkingDayAsync(branchId, request, declaredBy);
        return Ok(ApiResponse<SpecialWorkingDayDto>.Ok(result, "Special working day declared successfully"));
    }

    [HttpDelete("special-working-days/{dateOrId}")]
    public async Task<ActionResult<ApiResponse<bool>>> RemoveSpecialWorkingDay(string dateOrId)
    {
        var branchId = Request.Headers["X-Campus-Id"].FirstOrDefault() ?? _currentUser.BranchId ?? "br-01";
        var success = await _attendanceService.RemoveSpecialWorkingDayAsync(branchId, dateOrId);
        return Ok(ApiResponse<bool>.Ok(success, success ? "Special working day declaration removed" : "Declaration not found"));
    }
}
