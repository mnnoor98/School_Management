using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Domain.School;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class SchoolController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public SchoolController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<object>>> GetSchool()
    {
        var school = await _context.Schools.FirstOrDefaultAsync();
        var branches = await _context.Branches.OrderBy(b => b.Code).ToListAsync();
        var academicYears = await _context.AcademicYears.OrderByDescending(a => a.StartDate).ToListAsync();
        return Ok(ApiResponse<object>.Ok(new { school, branches, academicYears }, "School institutional profile retrieved"));
    }

    [HttpPut]
    public async Task<ActionResult<ApiResponse<SchoolEntity>>> UpdateSchool([FromBody] SchoolUpdateRequest request)
    {
        var school = await _context.Schools.FirstOrDefaultAsync();
        if (school == null)
        {
            school = new SchoolEntity
            {
                Id = "sch-01",
                Name = request.Name,
                Code = request.Code,
                Address = request.Address,
                Contact = request.Contact,
                Email = request.Email,
                Website = request.Website,
                Status = request.Status ?? "Active"
            };
            _context.Schools.Add(school);
        }
        else
        {
            school.Name = request.Name;
            school.Code = request.Code;
            school.Address = request.Address;
            school.Contact = request.Contact;
            school.Email = request.Email;
            school.Website = request.Website;
            if (!string.IsNullOrEmpty(request.Status)) school.Status = request.Status;
            school.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<SchoolEntity>.Ok(school, "School profile updated successfully"));
    }

    [HttpPost("branches")]
    public async Task<ActionResult<ApiResponse<Branch>>> AddBranch([FromBody] BranchCreateRequest request)
    {
        var school = await _context.Schools.FirstOrDefaultAsync();
        var schoolId = school?.Id ?? "sch-01";

        var branch = new Branch
        {
            Id = "br-" + Guid.NewGuid().ToString("N").Substring(0, 6),
            SchoolId = schoolId,
            Code = request.Code.ToUpper().Trim(),
            Name = request.Name.Trim(),
            Address = request.Address,
            Phone = request.Phone,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Branches.Add(branch);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<Branch>.Ok(branch, "Branch created successfully"));
    }

    [HttpPut("branches/{id}")]
    public async Task<ActionResult<ApiResponse<Branch>>> UpdateBranch(string id, [FromBody] BranchCreateRequest request)
    {
        var branch = await _context.Branches.FindAsync(id);
        if (branch == null) return NotFound(ApiResponse<Branch>.Fail("Branch not found"));

        branch.Name = request.Name.Trim();
        branch.Code = request.Code.ToUpper().Trim();
        branch.Address = request.Address;
        branch.Phone = request.Phone;
        branch.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<Branch>.Ok(branch, "Branch updated successfully"));
    }

    [HttpPut("branches/{id}/toggle")]
    public async Task<ActionResult<ApiResponse<Branch>>> ToggleBranch(string id)
    {
        var branch = await _context.Branches.FindAsync(id);
        if (branch == null) return NotFound(ApiResponse<Branch>.Fail("Branch not found"));

        branch.IsActive = !branch.IsActive;
        branch.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<Branch>.Ok(branch, $"Branch is now {(branch.IsActive ? "Active" : "Inactive")}"));
    }

    [HttpPost("academic-years")]
    public async Task<ActionResult<ApiResponse<AcademicYear>>> AddAcademicYear([FromBody] AcademicYearCreateRequest request)
    {
        var school = await _context.Schools.FirstOrDefaultAsync();
        var schoolId = school?.Id ?? "sch-01";

        if (request.IsCurrent)
        {
            var existing = await _context.AcademicYears.ToListAsync();
            foreach (var ay in existing) ay.IsCurrent = false;
        }

        var year = new AcademicYear
        {
            Id = "ay-" + Guid.NewGuid().ToString("N").Substring(0, 6),
            SchoolId = schoolId,
            Name = request.Name,
            StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc),
            EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc),
            IsCurrent = request.IsCurrent,
            IsLocked = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.AcademicYears.Add(year);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<AcademicYear>.Ok(year, "Academic session created successfully"));
    }

    [HttpPut("academic-years/{id}/toggle-lock")]
    public async Task<ActionResult<ApiResponse<AcademicYear>>> ToggleAcademicYearLock(string id)
    {
        var year = await _context.AcademicYears.FindAsync(id);
        if (year == null) return NotFound(ApiResponse<AcademicYear>.Fail("Academic year not found"));

        year.IsLocked = !year.IsLocked;
        year.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<AcademicYear>.Ok(year, $"Academic year is now {(year.IsLocked ? "Locked" : "Unlocked")}"));
    }

    [HttpPut("academic-years/{id}/set-current")]
    public async Task<ActionResult<ApiResponse<AcademicYear>>> SetCurrentAcademicYear(string id)
    {
        var year = await _context.AcademicYears.FindAsync(id);
        if (year == null) return NotFound(ApiResponse<AcademicYear>.Fail("Academic year not found"));

        var all = await _context.AcademicYears.ToListAsync();
        foreach (var y in all)
        {
            y.IsCurrent = (y.Id == id);
            y.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<AcademicYear>.Ok(year, $"{year.Name} set as Current Academic Session"));
    }
}

public class SchoolUpdateRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Contact { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public string? Status { get; set; }
}

public class BranchCreateRequest
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public class AcademicYearCreateRequest
{
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsCurrent { get; set; }
}
