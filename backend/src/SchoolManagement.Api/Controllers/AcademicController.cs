using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Academic.DTOs;
using SchoolManagement.Application.Academic.Services;
using SchoolManagement.Application.Common.Models;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Route("api/v1/academic")]
[Authorize]
public class AcademicController : ControllerBase
{
    private readonly IAcademicService _academicService;

    public AcademicController(IAcademicService academicService)
    {
        _academicService = academicService;
    }

    [HttpGet("academic-years")]
    public async Task<ActionResult<ApiResponse<List<AcademicYearDto>>>> GetAcademicYears()
    {
        var years = await _academicService.GetAcademicYearsAsync();
        return Ok(ApiResponse<List<AcademicYearDto>>.Ok(years));
    }

    [HttpGet("classes")]
    public async Task<ActionResult<ApiResponse<List<SchoolClassDto>>>> GetClasses()
    {
        var classes = await _academicService.GetClassesAsync();
        return Ok(ApiResponse<List<SchoolClassDto>>.Ok(classes));
    }

    [HttpGet("sections")]
    public async Task<ActionResult<ApiResponse<List<SectionDto>>>> GetSections([FromQuery] string? classId)
    {
        var sections = await _academicService.GetSectionsAsync(classId);
        return Ok(ApiResponse<List<SectionDto>>.Ok(sections));
    }

    [HttpGet("subjects")]
    public async Task<ActionResult<ApiResponse<List<SubjectDto>>>> GetSubjects([FromQuery] string? classId)
    {
        var subjects = await _academicService.GetSubjectsAsync(classId);
        return Ok(ApiResponse<List<SubjectDto>>.Ok(subjects));
    }

    [HttpGet("class-routines")]
    [HttpGet("routines")]
    public async Task<ActionResult<ApiResponse<List<RoutinePeriodDto>>>> GetRoutines([FromQuery] string? classId, [FromQuery] string? sectionId, [FromQuery] string? dayOfWeek)
    {
        var routines = await _academicService.GetRoutinesAsync(classId, sectionId, dayOfWeek);
        return Ok(ApiResponse<List<RoutinePeriodDto>>.Ok(routines));
    }

    [HttpGet("timetable")]
    public async Task<ActionResult<ApiResponse<List<RoutinePeriodDto>>>> GetTimetable([FromQuery] string? classId, [FromQuery] string? sectionId)
    {
        var timetable = await _academicService.GetRoutineTimetableAsync(classId, sectionId);
        return Ok(ApiResponse<List<RoutinePeriodDto>>.Ok(timetable));
    }

    [HttpGet("classes/{id}")]
    public async Task<ActionResult<ApiResponse<SchoolClassDto>>> GetClassById(string id)
    {
        var classes = await _academicService.GetClassesAsync();
        var cls = classes.FirstOrDefault(c => c.Id == id);
        if (cls == null) return NotFound(ApiResponse<SchoolClassDto>.Fail("Class not found"));
        return Ok(ApiResponse<SchoolClassDto>.Ok(cls));
    }

    [HttpGet("sections/{id}")]
    public async Task<ActionResult<ApiResponse<SectionDto>>> GetSectionById(string id)
    {
        var sections = await _academicService.GetSectionsAsync(null);
        var sec = sections.FirstOrDefault(s => s.Id == id);
        if (sec == null) return NotFound(ApiResponse<SectionDto>.Fail("Section not found"));
        return Ok(ApiResponse<SectionDto>.Ok(sec));
    }

    [HttpPost("classes")]
    public async Task<ActionResult<ApiResponse<SchoolClassDto>>> CreateClass([FromBody] CreateSchoolClassRequest request)
    {
        var (cls, error) = await _academicService.CreateClassAsync(request);
        if (!string.IsNullOrEmpty(error))
        {
            return BadRequest(ApiResponse<SchoolClassDto>.Fail(error));
        }

        return StatusCode(StatusCodes.Status201Created, ApiResponse<SchoolClassDto>.Ok(cls!, "Class created successfully"));
    }

    [HttpPut("classes/{id}")]
    public async Task<ActionResult<ApiResponse<SchoolClassDto>>> UpdateClass(string id, [FromBody] UpdateSchoolClassRequest request)
    {
        var (cls, error) = await _academicService.UpdateClassAsync(id, request);
        if (!string.IsNullOrEmpty(error))
        {
            return error == "Class not found"
                ? NotFound(ApiResponse<SchoolClassDto>.Fail(error))
                : BadRequest(ApiResponse<SchoolClassDto>.Fail(error));
        }

        return Ok(ApiResponse<SchoolClassDto>.Ok(cls!, "Class updated successfully"));
    }

    [HttpDelete("classes/{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteClass(string id)
    {
        var deleted = await _academicService.DeleteClassAsync(id);
        if (!deleted) return NotFound(ApiResponse<bool>.Fail("Class not found"));

        return Ok(ApiResponse<bool>.Ok(true, "Class deleted successfully"));
    }

    [HttpPost("sections")]
    public async Task<ActionResult<ApiResponse<SectionDto>>> CreateSection([FromBody] CreateSectionRequest request)
    {
        var (section, error) = await _academicService.CreateSectionAsync(request);
        if (!string.IsNullOrEmpty(error))
        {
            return BadRequest(ApiResponse<SectionDto>.Fail(error));
        }

        return StatusCode(StatusCodes.Status201Created, ApiResponse<SectionDto>.Ok(section!, "Section created successfully"));
    }

    [HttpPut("sections/{id}")]
    public async Task<ActionResult<ApiResponse<SectionDto>>> UpdateSection(string id, [FromBody] UpdateSectionRequest request)
    {
        var (section, error) = await _academicService.UpdateSectionAsync(id, request);
        if (!string.IsNullOrEmpty(error))
        {
            return NotFound(ApiResponse<SectionDto>.Fail(error));
        }

        return Ok(ApiResponse<SectionDto>.Ok(section!, "Section updated successfully"));
    }

    [HttpDelete("sections/{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteSection(string id)
    {
        var deleted = await _academicService.DeleteSectionAsync(id);
        if (!deleted) return NotFound(ApiResponse<bool>.Fail("Section not found"));

        return Ok(ApiResponse<bool>.Ok(true, "Section deleted successfully"));
    }

    [HttpPost("subjects")]
    public async Task<ActionResult<ApiResponse<SubjectDto>>> CreateSubject([FromBody] CreateSubjectRequest request)
    {
        var (subject, error) = await _academicService.CreateSubjectAsync(request);
        if (!string.IsNullOrEmpty(error))
        {
            return BadRequest(ApiResponse<SubjectDto>.Fail(error));
        }

        return StatusCode(StatusCodes.Status201Created, ApiResponse<SubjectDto>.Ok(subject!, "Subject created successfully"));
    }

    [HttpPut("subjects/{id}")]
    public async Task<ActionResult<ApiResponse<SubjectDto>>> UpdateSubject(string id, [FromBody] UpdateSubjectRequest request)
    {
        var (subject, error) = await _academicService.UpdateSubjectAsync(id, request);
        if (!string.IsNullOrEmpty(error))
        {
            return NotFound(ApiResponse<SubjectDto>.Fail(error));
        }

        return Ok(ApiResponse<SubjectDto>.Ok(subject!, "Subject updated successfully"));
    }

    [HttpDelete("subjects/{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteSubject(string id)
    {
        var deleted = await _academicService.DeleteSubjectAsync(id);
        if (!deleted) return NotFound(ApiResponse<bool>.Fail("Subject not found"));

        return Ok(ApiResponse<bool>.Ok(true, "Subject deleted successfully"));
    }

    [HttpPost("routines")]
    [HttpPost("class-routines")]
    public async Task<ActionResult<ApiResponse<RoutinePeriodDto>>> CreateRoutinePeriod([FromBody] RoutinePeriodDto request)
    {
        var result = await _academicService.CreateRoutineAsync(request);
        return Ok(ApiResponse<RoutinePeriodDto>.Ok(result, "Period assigned successfully"));
    }

    [HttpPost("class-routines/batch")]
    public async Task<ActionResult<ApiResponse<bool>>> SaveClassRoutines([FromBody] List<RoutinePeriodDto> periods)
    {
        await _academicService.SaveRoutinesAsync(periods);
        return Ok(ApiResponse<bool>.Ok(true, "Routine periods saved successfully"));
    }

    [HttpDelete("routines/{id}")]
    [HttpDelete("class-routines/{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteRoutinePeriod(string id)
    {
        var deleted = await _academicService.DeleteRoutinePeriodAsync(id);
        if (!deleted) return NotFound(ApiResponse<bool>.Fail("Routine period not found"));
        return Ok(ApiResponse<bool>.Ok(true, "Routine period deleted successfully"));
    }

    [HttpGet("classes/{classId}/subjects")]
    public async Task<ActionResult<ApiResponse<List<ClassSubjectMappingDto>>>> GetClassSubjects(string classId)
    {
        var list = await _academicService.GetClassSubjectsAsync(classId);
        return Ok(ApiResponse<List<ClassSubjectMappingDto>>.Ok(list));
    }

    [HttpPost("classes/{classId}/subjects")]
    public async Task<ActionResult<ApiResponse<bool>>> AssignClassSubjects(string classId, [FromBody] AssignClassSubjectsRequest request)
    {
        var success = await _academicService.AssignClassSubjectsAsync(classId, request?.SubjectIds ?? new List<string>());
        return Ok(ApiResponse<bool>.Ok(success, "Class curriculum subjects updated successfully"));
    }
}
