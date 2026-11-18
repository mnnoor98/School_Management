using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.Employee.DTOs;
using SchoolManagement.Application.Employee.Services;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class TeachersController : ControllerBase
{
    private readonly ITeacherService _teacherService;

    public TeachersController(ITeacherService teacherService)
    {
        _teacherService = teacherService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<TeacherDto>>>> GetTeachers([FromQuery] string? search)
    {
        var teachers = await _teacherService.GetTeachersAsync(search);
        return Ok(ApiResponse<List<TeacherDto>>.Ok(teachers));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<TeacherDto>>> GetTeacherById(string id)
    {
        var dto = await _teacherService.GetTeacherByIdAsync(id);
        if (dto == null) return NotFound(ApiResponse<TeacherDto>.Fail("Teacher not found"));
        return Ok(ApiResponse<TeacherDto>.Ok(dto));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<TeacherDto>>> CreateTeacher([FromBody] CreateTeacherRequest request)
    {
        var (teacher, error) = await _teacherService.CreateTeacherAsync(request);
        if (!string.IsNullOrEmpty(error))
        {
            return BadRequest(ApiResponse<TeacherDto>.Fail(error));
        }

        return Ok(ApiResponse<TeacherDto>.Ok(teacher!, "Teacher profile created"));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<TeacherDto>>> UpdateTeacher(string id, [FromBody] UpdateTeacherRequest request)
    {
        var (teacher, error) = await _teacherService.UpdateTeacherAsync(id, request);
        if (!string.IsNullOrEmpty(error))
        {
            return error == "Teacher not found" 
                ? NotFound(ApiResponse<TeacherDto>.Fail(error)) 
                : BadRequest(ApiResponse<TeacherDto>.Fail(error));
        }

        return Ok(ApiResponse<TeacherDto>.Ok(teacher!, "Teacher profile updated"));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteTeacher(string id)
    {
        var deleted = await _teacherService.DeleteTeacherAsync(id);
        if (!deleted) return NotFound(ApiResponse<bool>.Fail("Teacher not found"));
        return Ok(ApiResponse<bool>.Ok(true, "Teacher deleted successfully"));
    }
}
