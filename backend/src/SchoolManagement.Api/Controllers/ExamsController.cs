using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.Exams.DTOs;
using SchoolManagement.Application.Exams.Services;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class ExamsController : ControllerBase
{
    private readonly IExamService _examService;
    private readonly IStudentAccessService _studentAccess;
    private readonly IExcelImportExportService _excelService;

    public ExamsController(
        IExamService examService,
        IStudentAccessService studentAccess,
        IExcelImportExportService excelService)
    {
        _examService = examService;
        _studentAccess = studentAccess;
        _excelService = excelService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ExamDto>>>> GetExams()
    {
        var exams = await _examService.GetExamsAsync();
        return Ok(ApiResponse<List<ExamDto>>.Ok(exams));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ExamDto>>> CreateExam([FromBody] ExamCreateRequest request)
    {
        if (await _studentAccess.IsRestrictedUserAsync())
        {
            return Forbid();
        }

        var exam = await _examService.CreateExamAsync(request);
        return Ok(ApiResponse<ExamDto>.Ok(exam, "Exam created successfully"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ExamDto>>> UpdateExam(string id, [FromBody] ExamUpdateRequest request)
    {
        if (await _studentAccess.IsRestrictedUserAsync())
        {
            return Forbid();
        }

        var exam = await _examService.UpdateExamAsync(id, request);
        if (exam == null) return NotFound(ApiResponse<ExamDto>.Fail("Exam not found"));

        return Ok(ApiResponse<ExamDto>.Ok(exam, "Exam updated successfully"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteExam(string id)
    {
        if (await _studentAccess.IsRestrictedUserAsync())
        {
            return Forbid();
        }

        var deleted = await _examService.DeleteExamAsync(id);
        if (!deleted) return NotFound(ApiResponse<bool>.Fail("Exam not found"));

        return Ok(ApiResponse<bool>.Ok(true, "Exam deleted successfully"));
    }

    [HttpGet("{id}/marks")]
    public async Task<ActionResult<ApiResponse<List<ExamMarkDto>>>> GetExamMarks(string id, [FromQuery] string? classId, [FromQuery] string? sectionId, [FromQuery] string? subjectId)
    {
        var allowedIds = await _studentAccess.GetAllowedStudentIdsAsync();
        var marks = await _examService.GetMarksAsync(id, classId, sectionId, subjectId, allowedIds);
        return Ok(ApiResponse<List<ExamMarkDto>>.Ok(marks));
    }

    [HttpPost("{id}/marks")]
    public async Task<ActionResult<ApiResponse<bool>>> SaveMarks(string id, [FromBody] SaveExamMarksRequest request)
    {
        if (await _studentAccess.IsRestrictedUserAsync())
        {
            return Forbid();
        }

        request.ExamId = id;
        await _examService.SaveMarksAsync(request);
        return Ok(ApiResponse<bool>.Ok(true, "Marks recorded successfully"));
    }

    [HttpGet("{examId}/students/{studentId}/marksheet")]
    public async Task<ActionResult<ApiResponse<StudentMarksheetDto>>> GetStudentMarksheet(string examId, string studentId)
    {
        if (!await _studentAccess.CanAccessStudentAsync(studentId))
        {
            return Forbid();
        }

        var marksheet = await _examService.GetStudentMarksheetAsync(examId, studentId);
        if (marksheet == null) return NotFound(ApiResponse<StudentMarksheetDto>.Fail("Student not found"));

        return Ok(ApiResponse<StudentMarksheetDto>.Ok(marksheet));
    }

    [HttpGet("{examId}/classes/{classId}/marksheet")]
    public async Task<ActionResult<ApiResponse<List<StudentMarksheetDto>>>> GetClassMarksheet(string examId, string classId, [FromQuery] string? sectionId)
    {
        var allowedIds = await _studentAccess.GetAllowedStudentIdsAsync();
        var marksheets = await _examService.GetClassMarksheetAsync(examId, classId, sectionId ?? string.Empty, allowedIds);
        return Ok(ApiResponse<List<StudentMarksheetDto>>.Ok(marksheets));
    }

    [HttpGet("{id}/marks-template")]
    public async Task<IActionResult> DownloadMarksTemplate(
        string id,
        [FromQuery] string classId,
        [FromQuery] string? sectionId,
        [FromQuery] string subjectId)
    {
        if (string.IsNullOrEmpty(classId) || string.IsNullOrEmpty(subjectId))
        {
            return BadRequest(ApiResponse<bool>.Fail("classId and subjectId are required."));
        }

        var bytes = await _examService.GenerateMarksTemplateAsync(id, classId, sectionId, subjectId);
        return File(
            bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Marks_Entry_Template.xlsx");
    }

    [HttpPost("{id}/marks-bulk-upload")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<int>>> BulkUploadMarks(
        string id,
        [FromForm] IFormFile file,
        [FromForm] string classId,
        [FromForm] string? sectionId,
        [FromForm] string subjectId)
    {
        if (await _studentAccess.IsRestrictedUserAsync())
        {
            return Forbid();
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse<int>.Fail("No Excel file was uploaded."));
        }

        using var stream = file.OpenReadStream();
        var (count, errors) = await _examService.BulkUploadMarksAsync(id, classId, sectionId, subjectId, stream);

        if (errors.Count > 0 && count == 0)
        {
            return BadRequest(ApiResponse<int>.Fail(string.Join("; ", errors)));
        }

        var msg = $"Successfully imported marks for {count} student(s)." + (errors.Count > 0 ? $" Note: {string.Join("; ", errors)}" : "");
        return Ok(ApiResponse<int>.Ok(count, msg));
    }

    [HttpGet("{id}/schedules")]
    public async Task<ActionResult<ApiResponse<List<ExamScheduleItemDto>>>> GetSchedules(string id, [FromQuery] string? classId)
    {
        var schedules = await _examService.GetSchedulesAsync(id, classId);
        return Ok(ApiResponse<List<ExamScheduleItemDto>>.Ok(schedules));
    }

    [HttpPost("{id}/schedules")]
    public async Task<ActionResult<ApiResponse<ExamScheduleItemDto>>> CreateSchedule(string id, [FromBody] CreateExamScheduleRequest req)
    {
        if (await _studentAccess.IsRestrictedUserAsync())
        {
            return Forbid();
        }

        req.ExamId = id;
        var created = await _examService.CreateScheduleAsync(req);
        return Ok(ApiResponse<ExamScheduleItemDto>.Ok(created, "Schedule item created successfully"));
    }

    [HttpDelete("schedules/{scheduleId}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteSchedule(string scheduleId)
    {
        if (await _studentAccess.IsRestrictedUserAsync())
        {
            return Forbid();
        }

        var deleted = await _examService.DeleteScheduleAsync(scheduleId);
        if (!deleted) return NotFound(ApiResponse<bool>.Fail("Schedule item not found"));
        return Ok(ApiResponse<bool>.Ok(true, "Schedule item deleted"));
    }

    [HttpGet("{id}/admit-cards")]
    public async Task<ActionResult<ApiResponse<List<AdmitCardDto>>>> GetAdmitCards(
        string id,
        [FromQuery] string? classId,
        [FromQuery] string? sectionId,
        [FromQuery] string? studentId)
    {
        var cards = await _examService.GetAdmitCardsAsync(id, classId, sectionId, studentId);
        return Ok(ApiResponse<List<AdmitCardDto>>.Ok(cards));
    }
}
