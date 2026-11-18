using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.Employee.DTOs;
using SchoolManagement.Application.Employee.Services;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/teachers/leaves")]
[Authorize]
public class TeacherLeavesController : ControllerBase
{
    private readonly ITeacherLeaveService _leaveService;
    private readonly ICurrentUserService _currentUser;

    public TeacherLeavesController(ITeacherLeaveService leaveService, ICurrentUserService currentUser)
    {
        _leaveService = leaveService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<TeacherLeaveApplicationDto>>>> GetLeaves(
        [FromQuery] string? status,
        [FromQuery] string? leaveType,
        [FromQuery] string? teacherId,
        [FromQuery] string? search)
    {
        var list = await _leaveService.GetLeavesAsync(status, leaveType, teacherId, search);
        return Ok(ApiResponse<List<TeacherLeaveApplicationDto>>.Ok(list));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<TeacherLeaveApplicationDto>>> GetLeaveById(string id)
    {
        var dto = await _leaveService.GetLeaveByIdAsync(id);
        if (dto == null) return NotFound(ApiResponse<TeacherLeaveApplicationDto>.Fail("Leave application not found"));
        return Ok(ApiResponse<TeacherLeaveApplicationDto>.Ok(dto));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<TeacherLeaveApplicationDto>>> ApplyLeave([FromBody] CreateTeacherLeaveRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.TeacherId) || string.IsNullOrWhiteSpace(req.Reason))
            return BadRequest(ApiResponse<TeacherLeaveApplicationDto>.Fail("Teacher and reason are required."));

        var dto = await _leaveService.ApplyLeaveAsync(req);
        return CreatedAtAction(nameof(GetLeaveById), new { id = dto.Id }, ApiResponse<TeacherLeaveApplicationDto>.Ok(dto, "Leave application submitted successfully"));
    }

    [HttpPut("{id}/status")]
    public async Task<ActionResult<ApiResponse<TeacherLeaveApplicationDto>>> UpdateStatus(string id, [FromBody] ReviewTeacherLeaveRequest req)
    {
        var reviewer = _currentUser.Username ?? "Administrator";
        var dto = await _leaveService.UpdateStatusAsync(id, req, reviewer);
        if (dto == null) return NotFound(ApiResponse<TeacherLeaveApplicationDto>.Fail("Leave application not found"));

        return Ok(ApiResponse<TeacherLeaveApplicationDto>.Ok(dto, $"Leave application {dto.Status.ToLowerInvariant()} successfully"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteLeave(string id)
    {
        var deleted = await _leaveService.DeleteLeaveAsync(id);
        if (!deleted) return NotFound(ApiResponse<bool>.Fail("Leave application not found"));
        return Ok(ApiResponse<bool>.Ok(true, "Leave application removed"));
    }
}
