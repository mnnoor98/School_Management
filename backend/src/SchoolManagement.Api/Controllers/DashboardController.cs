using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.System.DTOs;
using SchoolManagement.Application.System.Services;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<DashboardStatsDto>>> GetStats()
    {
        var stats = await _dashboardService.GetDashboardStatsAsync();
        return Ok(ApiResponse<DashboardStatsDto>.Ok(stats));
    }

    [HttpGet("principal")]
    public async Task<ActionResult<ApiResponse<PrincipalDashboardDto>>> GetPrincipalDashboard()
    {
        var stats = await _dashboardService.GetPrincipalDashboardAsync();
        return Ok(ApiResponse<PrincipalDashboardDto>.Ok(stats));
    }

    [HttpGet("teacher")]
    public async Task<ActionResult<ApiResponse<TeacherDashboardDto>>> GetTeacherDashboard([FromQuery] string? teacherId = null)
    {
        var stats = await _dashboardService.GetTeacherDashboardAsync(teacherId);
        return Ok(ApiResponse<TeacherDashboardDto>.Ok(stats));
    }

    [HttpGet("accountant")]
    public async Task<ActionResult<ApiResponse<AccountantDashboardDto>>> GetAccountantDashboard()
    {
        var stats = await _dashboardService.GetAccountantDashboardAsync();
        return Ok(ApiResponse<AccountantDashboardDto>.Ok(stats));
    }

    [HttpGet("super-admin")]
    public async Task<ActionResult<ApiResponse<SuperAdminDashboardDto>>> GetSuperAdminDashboard()
    {
        var stats = await _dashboardService.GetSuperAdminDashboardAsync();
        return Ok(ApiResponse<SuperAdminDashboardDto>.Ok(stats));
    }

    [HttpGet("student")]
    public async Task<ActionResult<ApiResponse<StudentDashboardDto>>> GetStudentDashboard([FromQuery] string? studentId = null)
    {
        var stats = await _dashboardService.GetStudentDashboardAsync(studentId);
        return Ok(ApiResponse<StudentDashboardDto>.Ok(stats));
    }

    [HttpGet("guardian")]
    public async Task<ActionResult<ApiResponse<GuardianDashboardDto>>> GetGuardianDashboard([FromQuery] string? guardianUserId = null)
    {
        var stats = await _dashboardService.GetGuardianDashboardAsync(guardianUserId);
        return Ok(ApiResponse<GuardianDashboardDto>.Ok(stats));
    }
}
