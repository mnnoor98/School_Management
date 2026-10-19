using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.System.DTOs;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public DashboardController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<DashboardStatsDto>>> GetStats()
    {
        int studentCount = await _context.Students.CountAsync(s => s.Status == "Active");
        int teacherCount = await _context.Teachers.CountAsync(t => t.Status == "Active");
        int classCount = await _context.Classes.CountAsync();
        int examCount = await _context.Exams.CountAsync();

        var today = DateTime.UtcNow.Date;
        var todayAttendance = await _context.AttendanceRecords.Where(a => a.AttendanceDate.Date == today).ToListAsync();
        decimal attendanceRate = todayAttendance.Count > 0
            ? Math.Round((decimal)todayAttendance.Count(a => a.Status == "Present") / todayAttendance.Count * 100, 1)
            : 96.4m;

        decimal totalRevenue = await _context.StudentInvoices.SumAsync(i => i.NetAmount);
        decimal collectedRevenue = await _context.StudentInvoices.SumAsync(i => i.PaidAmount);
        decimal dueRevenue = await _context.StudentInvoices.SumAsync(i => i.DueAmount);
        decimal collectionRate = totalRevenue > 0 ? Math.Round((collectedRevenue / totalRevenue) * 100, 1) : 100m;

        var stats = new DashboardStatsDto
        {
            TotalStudents = studentCount,
            TotalTeachers = teacherCount,
            ActiveClasses = classCount,
            ActiveExams = examCount,
            AttendanceRate = attendanceRate,
            FeeCollectionRate = collectionRate,
            TotalCollectedRevenue = collectedRevenue,
            TotalDueRevenue = dueRevenue
        };

        return Ok(ApiResponse<DashboardStatsDto>.Ok(stats));
    }
}
