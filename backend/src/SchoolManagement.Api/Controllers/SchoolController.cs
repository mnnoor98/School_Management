using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.School.DTOs;
using SchoolManagement.Application.School.Services;
using SchoolManagement.Domain.School;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class SchoolController : ControllerBase
{
    private readonly ISchoolService _schoolService;

    public SchoolController(ISchoolService schoolService)
    {
        _schoolService = schoolService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetSchool()
    {
        var (school, branches, academicYears) = await _schoolService.GetSchoolProfileAsync();
        return Ok(ApiResponse<object>.Ok(new { school, branches, academicYears }, "School institutional profile retrieved"));
    }

    [HttpPut]
    [Authorize(Policy = SchoolManagement.Api.Security.SecurityPolicies.SystemAdministrator)]
    public async Task<ActionResult<ApiResponse<SchoolEntity>>> UpdateSchool([FromBody] SchoolUpdateRequest request)
    {
        var school = await _schoolService.UpdateSchoolAsync(request);
        return Ok(ApiResponse<SchoolEntity>.Ok(school, "School profile updated successfully"));
    }

    [HttpPost("branches")]
    [Authorize(Policy = SchoolManagement.Api.Security.SecurityPolicies.SystemAdministrator)]
    public async Task<ActionResult<ApiResponse<Branch>>> AddBranch([FromBody] BranchCreateRequest request)
    {
        var (branch, error) = await _schoolService.AddBranchAsync(request);
        if (!string.IsNullOrEmpty(error))
        {
            return BadRequest(ApiResponse<Branch>.Fail(error, error));
        }

        return Ok(ApiResponse<Branch>.Ok(branch!, "New campus created successfully"));
    }

    [HttpPut("branches/{id}")]
    [Authorize(Policy = SchoolManagement.Api.Security.SecurityPolicies.SystemAdministrator)]
    public async Task<ActionResult<ApiResponse<Branch>>> UpdateBranch(string id, [FromBody] BranchUpdateRequest request)
    {
        var (branch, error) = await _schoolService.UpdateBranchAsync(id, request);
        if (!string.IsNullOrEmpty(error))
        {
            return NotFound(ApiResponse<Branch>.Fail(error));
        }

        return Ok(ApiResponse<Branch>.Ok(branch!, "Campus details updated successfully"));
    }

    [HttpPut("branches/{id}/toggle")]
    [Authorize(Policy = SchoolManagement.Api.Security.SecurityPolicies.SystemAdministrator)]
    public async Task<ActionResult<ApiResponse<Branch>>> ToggleBranch(string id)
    {
        var (branch, error) = await _schoolService.ToggleBranchAsync(id);
        if (!string.IsNullOrEmpty(error))
        {
            return NotFound(ApiResponse<Branch>.Fail(error));
        }

        return Ok(ApiResponse<Branch>.Ok(branch!, $"Branch is now {(branch!.IsActive ? "Active" : "Inactive")}"));
    }

    [HttpPost("academic-years")]
    public async Task<ActionResult<ApiResponse<AcademicYear>>> AddAcademicYear([FromBody] AcademicYearCreateRequest request)
    {
        var year = await _schoolService.AddAcademicYearAsync(request);
        return Ok(ApiResponse<AcademicYear>.Ok(year, "Academic session created successfully"));
    }

    [HttpPut("academic-years/{id}/toggle-lock")]
    public async Task<ActionResult<ApiResponse<AcademicYear>>> ToggleAcademicYearLock(string id)
    {
        var (year, error) = await _schoolService.ToggleAcademicYearLockAsync(id);
        if (!string.IsNullOrEmpty(error))
        {
            return NotFound(ApiResponse<AcademicYear>.Fail(error));
        }

        return Ok(ApiResponse<AcademicYear>.Ok(year!, $"Academic year is now {(year!.IsLocked ? "Locked" : "Unlocked")}"));
    }

    [HttpPut("academic-years/{id}/set-current")]
    public async Task<ActionResult<ApiResponse<AcademicYear>>> SetCurrentAcademicYear(string id)
    {
        var (year, error) = await _schoolService.SetCurrentAcademicYearAsync(id);
        if (!string.IsNullOrEmpty(error))
        {
            return NotFound(ApiResponse<AcademicYear>.Fail(error));
        }

        return Ok(ApiResponse<AcademicYear>.Ok(year!, $"{year!.Name} set as Current Academic Session"));
    }
}
