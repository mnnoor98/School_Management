using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Domain.Employee;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class TeachersController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public TeachersController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<TeacherDto>>>> GetTeachers([FromQuery] string? search)
    {
        var query = _context.Teachers.AsNoTracking().AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            search = search.Trim().ToLower();
            query = query.Where(t => t.FullName.ToLower().Contains(search) || t.EmployeeCode.ToLower().Contains(search) || t.Department.ToLower().Contains(search));
        }

        var teachers = await query
            .OrderBy(t => t.FullName)
            .Select(t => new TeacherDto
            {
                Id = t.Id,
                EmployeeCode = t.EmployeeCode,
                FullName = t.FullName,
                Designation = t.Designation,
                Department = t.Department,
                Qualification = t.Qualification,
                Email = t.Email,
                Phone = t.Phone,
                JoiningDate = t.JoiningDate,
                Status = t.Status,
                Avatar = t.Avatar,
                AssignedSubjects = new List<string> { "Higher Mathematics", "Physics" }
            })
            .ToListAsync();

        return Ok(ApiResponse<List<TeacherDto>>.Ok(teachers));
    }
}

public class TeacherDto
{
    public string Id { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Qualification { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime JoiningDate { get; set; }
    public string Status { get; set; } = "Active";
    public string Avatar { get; set; } = string.Empty;
    public List<string> AssignedSubjects { get; set; } = new();
}
