using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.Students.DTOs;
using SchoolManagement.Application.Students.Services;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class StudentsController : ControllerBase
{
    private readonly IStudentService _studentService;
    private readonly IStudentAccessService _studentAccess;

    public StudentsController(
        IStudentService studentService,
        IStudentAccessService studentAccess)
    {
        _studentService = studentService;
        _studentAccess = studentAccess;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<StudentDto>>>> GetStudents(
        [FromQuery] string? classId, 
        [FromQuery] string? sectionId, 
        [FromQuery] string? search)
    {
        var allowedIds = await _studentAccess.GetAllowedStudentIdsAsync();
        var list = await _studentService.GetStudentsAsync(classId, sectionId, search, allowedIds);
        return Ok(ApiResponse<List<StudentDto>>.Ok(list));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<StudentDto>>> GetStudentById(string id)
    {
        if (!await _studentAccess.CanAccessStudentAsync(id))
        {
            return Forbid();
        }

        var student = await _studentService.GetStudentByIdAsync(id);
        if (student == null) return NotFound(ApiResponse<StudentDto>.Fail("Student not found"));

        return Ok(ApiResponse<StudentDto>.Ok(student));
    }

    [HttpPost("admissions")]
    public async Task<ActionResult<ApiResponse<StudentDto>>> AdmitStudent([FromBody] AdmissionRequest request)
    {
        if (await _studentAccess.IsRestrictedUserAsync())
        {
            return Forbid();
        }

        var student = await _studentService.AdmitStudentAsync(request);
        return Ok(ApiResponse<StudentDto>.Ok(student, "Student admitted successfully"));
    }

    [HttpGet("admission-lookups")]
    public async Task<ActionResult<ApiResponse<AdmissionLookupsDto>>> GetAdmissionLookups()
    {
        var lookups = await _studentService.GetAdmissionLookupsAsync();
        return Ok(ApiResponse<AdmissionLookupsDto>.Ok(lookups));
    }

    [HttpGet("import-template")]
    public IActionResult DownloadImportTemplate()
    {
        var fileBytes = _studentService.DownloadImportTemplate();
        return File(
            fileBytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Student_Admission_Template.xlsx");
    }

    [HttpPost("bulk-import")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<BulkImportResultDto>>> BulkImportStudents(
        IFormFile? file,
        [FromForm] string classId,
        [FromForm] string sectionId,
        [FromForm] string? academicYearId)
    {
        if (await _studentAccess.IsRestrictedUserAsync())
        {
            return Forbid();
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse<BulkImportResultDto>.Fail("Please upload a valid Excel file (.xlsx)."));
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext != ".xlsx" && ext != ".xls")
        {
            return BadRequest(ApiResponse<BulkImportResultDto>.Fail("Only Excel spreadsheets (.xlsx, .xls) are supported."));
        }

        using var stream = file.OpenReadStream();
        var (result, error) = await _studentService.BulkImportStudentsAsync(stream, file.FileName, classId, sectionId, academicYearId);

        if (!string.IsNullOrEmpty(error) && (result == null || result.ImportedCount == 0))
        {
            return BadRequest(ApiResponse<BulkImportResultDto>.Fail(error));
        }

        return Ok(ApiResponse<BulkImportResultDto>.Ok(
            result!,
            $"Successfully imported {result!.ImportedCount} student(s)."));
    }

    [HttpPost("{id}/promote")]
    public async Task<ActionResult<ApiResponse<bool>>> PromoteStudent(string id, [FromBody] StudentPromotionRequest request)
    {
        if (await _studentAccess.IsRestrictedUserAsync())
        {
            return Forbid();
        }

        var success = await _studentService.PromoteStudentAsync(id, request);
        if (!success) return NotFound(ApiResponse<bool>.Fail("Student not found"));

        return Ok(ApiResponse<bool>.Ok(true, "Student promoted successfully"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<StudentDto>>> UpdateStudent(string id, [FromBody] UpdateStudentRequest request)
    {
        if (await _studentAccess.IsRestrictedUserAsync())
        {
            return Forbid();
        }

        var student = await _studentService.UpdateStudentAsync(id, request);
        if (student == null) return NotFound(ApiResponse<StudentDto>.Fail("Student not found"));

        return Ok(ApiResponse<StudentDto>.Ok(student, "Student updated successfully"));
    }

    [HttpPut("{id}/status")]
    public async Task<ActionResult<ApiResponse<StudentDto>>> UpdateStudentStatus(string id, [FromBody] UpdateStudentStatusRequest request)
    {
        if (await _studentAccess.IsRestrictedUserAsync())
        {
            return Forbid();
        }

        var student = await _studentService.UpdateStudentStatusAsync(id, request.Status, request.Reason);
        if (student == null) return NotFound(ApiResponse<StudentDto>.Fail("Student not found"));

        return Ok(ApiResponse<StudentDto>.Ok(student, $"Student status updated to {request.Status} successfully"));
    }

    [HttpPost("batch-promote")]
    public async Task<ActionResult<ApiResponse<int>>> BatchPromote([FromBody] BatchStudentPromotionRequest request)
    {
        if (await _studentAccess.IsRestrictedUserAsync())
        {
            return Forbid();
        }

        if (request.Students == null || !request.Students.Any())
        {
            return BadRequest(ApiResponse<int>.Fail("No students selected for promotion"));
        }

        int count = await _studentService.BatchPromoteAsync(request);
        return Ok(ApiResponse<int>.Ok(count, $"Successfully promoted {count} students"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteStudent(string id)
    {
        if (await _studentAccess.IsRestrictedUserAsync())
        {
            return Forbid();
        }

        var success = await _studentService.DeleteStudentAsync(id);
        if (!success) return NotFound(ApiResponse<bool>.Fail("Student not found"));

        return Ok(ApiResponse<bool>.Ok(true, "Student deleted successfully"));
    }
}
