using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Attendance.DTOs;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Domain.Attendance;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public AttendanceController(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet("students")]
    public async Task<ActionResult<ApiResponse<List<AttendanceRecordDto>>>> GetStudentAttendance([FromQuery] string? classId, [FromQuery] string? sectionId, [FromQuery] DateTime? date)
    {
        var targetDate = (date ?? DateTime.UtcNow).Date;
        var query = _context.AttendanceRecords.AsNoTracking().Where(a => a.AttendanceDate.Date == targetDate);

        if (!string.IsNullOrEmpty(classId)) query = query.Where(a => a.ClassId == classId);
        if (!string.IsNullOrEmpty(sectionId)) query = query.Where(a => a.SectionId == sectionId);

        var list = await query
            .OrderBy(a => a.RollNo)
            .Select(a => new AttendanceRecordDto
            {
                Id = a.Id,
                Date = a.AttendanceDate,
                StudentId = a.StudentId,
                StudentName = a.StudentName,
                RollNo = a.RollNo,
                ClassId = a.ClassId,
                SectionId = a.SectionId,
                Status = a.Status,
                Remark = a.Remark,
                MarkedBy = a.MarkedBy,
                LastUpdated = a.UpdatedAt
            })
            .ToListAsync();

        return Ok(ApiResponse<List<AttendanceRecordDto>>.Ok(list));
    }

    [HttpPost("students")]
    public async Task<ActionResult<ApiResponse<bool>>> SaveStudentAttendanceRoster([FromBody] SaveRosterAttendanceRequest request)
    {
        var targetDate = request.Date.Date;

        foreach (var item in request.Records)
        {
            var existing = await _context.AttendanceRecords
                .FirstOrDefaultAsync(a => a.StudentId == item.StudentId && a.AttendanceDate.Date == targetDate);

            if (existing != null)
            {
                existing.Status = item.Status;
                existing.Remark = item.Remark;
                existing.MarkedBy = _currentUser.Username ?? "teacher";
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _context.AttendanceRecords.Add(new AttendanceRecord
                {
                    StudentId = item.StudentId,
                    StudentName = item.StudentName,
                    RollNo = item.RollNo,
                    ClassId = request.ClassId,
                    SectionId = request.SectionId,
                    AttendanceDate = targetDate,
                    Status = item.Status,
                    Remark = item.Remark,
                    MarkedBy = _currentUser.Username ?? "teacher"
                });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<bool>.Ok(true, "Attendance roster saved successfully"));
    }

    [HttpPost("correction")]
    public async Task<ActionResult<ApiResponse<bool>>> LogAttendanceCorrection([FromBody] AttendanceCorrectionDto request)
    {
        var record = await _context.AttendanceRecords.FindAsync(request.AttendanceId);
        if (record != null)
        {
            record.Status = request.NewStatus;
            record.UpdatedAt = DateTime.UtcNow;
        }

        _context.AttendanceCorrectionLogs.Add(new AttendanceCorrectionLog
        {
            AttendanceRecordId = request.AttendanceId,
            Date = request.Date,
            StudentName = request.StudentName,
            PreviousStatus = request.PreviousStatus,
            NewStatus = request.NewStatus,
            Reason = request.Reason,
            UpdatedBy = _currentUser.Username ?? "admin",
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<bool>.Ok(true, "Correction logged and record updated"));
    }
}
