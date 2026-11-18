using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.Exams.DTOs;
using SchoolManagement.Application.Exams.Services;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/exams/schedules")]
[Authorize]
public class ExamSchedulesController : ControllerBase
{
    private readonly IExamService _examService;

    public ExamSchedulesController(IExamService examService)
    {
        _examService = examService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ExamScheduleItemDto>>>> GetSchedules(
        [FromQuery] string? examId,
        [FromQuery] string? classId)
    {
        var list = await _examService.GetSchedulesAsync(examId, classId);
        return Ok(ApiResponse<List<ExamScheduleItemDto>>.Ok(list));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ExamScheduleItemDto>>> GetScheduleById(string id)
    {
        var dto = await _examService.GetScheduleByIdAsync(id);
        if (dto == null) return NotFound(ApiResponse<ExamScheduleItemDto>.Fail("Schedule item not found"));
        return Ok(ApiResponse<ExamScheduleItemDto>.Ok(dto));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ExamScheduleItemDto>>> CreateSchedule([FromBody] CreateExamScheduleRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.ExamId) || string.IsNullOrWhiteSpace(req.SubjectName))
            return BadRequest(ApiResponse<ExamScheduleItemDto>.Fail("Exam and Subject are required"));

        var dto = await _examService.CreateScheduleAsync(req);
        return CreatedAtAction(nameof(GetScheduleById), new { id = dto.Id }, ApiResponse<ExamScheduleItemDto>.Ok(dto, "Exam schedule added successfully"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteSchedule(string id)
    {
        var deleted = await _examService.DeleteScheduleAsync(id);
        if (!deleted) return NotFound(ApiResponse<bool>.Fail("Schedule item not found"));
        return Ok(ApiResponse<bool>.Ok(true, "Exam schedule removed successfully"));
    }
}
