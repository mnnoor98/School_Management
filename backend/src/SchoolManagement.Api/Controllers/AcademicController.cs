using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Academic.DTOs;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize]
public class AcademicController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public AcademicController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("academic-years")]
    public async Task<ActionResult<ApiResponse<List<AcademicYearDto>>>> GetAcademicYears()
    {
        var years = await _context.AcademicYears
            .AsNoTracking()
            .Select(y => new AcademicYearDto
            {
                Id = y.Id,
                Name = y.Name,
                StartDate = y.StartDate,
                EndDate = y.EndDate,
                IsCurrent = y.IsCurrent,
                IsLocked = y.IsLocked
            })
            .ToListAsync();

        return Ok(ApiResponse<List<AcademicYearDto>>.Ok(years));
    }

    [HttpGet("classes")]
    public async Task<ActionResult<ApiResponse<List<SchoolClassDto>>>> GetClasses()
    {
        var classes = await _context.Classes
            .AsNoTracking()
            .Include(c => c.Sections)
            .OrderBy(c => c.SortOrder)
            .Select(c => new SchoolClassDto
            {
                Id = c.Id,
                Name = c.Name,
                Code = c.Code,
                SortOrder = c.SortOrder,
                SectionCount = c.Sections.Count,
                StudentCount = _context.Students.Count(s => s.ClassId == c.Id)
            })
            .ToListAsync();

        return Ok(ApiResponse<List<SchoolClassDto>>.Ok(classes));
    }

    [HttpGet("sections")]
    public async Task<ActionResult<ApiResponse<List<SectionDto>>>> GetSections([FromQuery] string? classId)
    {
        var query = _context.Sections.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(classId))
        {
            query = query.Where(s => s.ClassId == classId);
        }

        var sections = await query
            .Select(s => new SectionDto
            {
                Id = s.Id,
                ClassId = s.ClassId,
                ClassName = s.ClassName,
                Name = s.Name,
                Capacity = s.Capacity,
                CurrentStudentCount = _context.Students.Count(st => st.SectionId == s.Id),
                ClassTeacherId = s.ClassTeacherId,
                ClassTeacherName = s.ClassTeacherName
            })
            .ToListAsync();

        return Ok(ApiResponse<List<SectionDto>>.Ok(sections));
    }

    [HttpGet("subjects")]
    public async Task<ActionResult<ApiResponse<List<SubjectDto>>>> GetSubjects()
    {
        var subjects = await _context.Subjects
            .AsNoTracking()
            .Select(s => new SubjectDto
            {
                Id = s.Id,
                Code = s.Code,
                Name = s.Name,
                Type = s.Type,
                FullMarks = s.FullMarks,
                PassMarks = s.PassMarks
            })
            .ToListAsync();

        return Ok(ApiResponse<List<SubjectDto>>.Ok(subjects));
    }

    [HttpGet("routines")]
    public async Task<ActionResult<ApiResponse<List<RoutinePeriodDto>>>> GetRoutines([FromQuery] string? classId, [FromQuery] string? sectionId)
    {
        var query = _context.RoutinePeriods.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(classId)) query = query.Where(r => r.ClassId == classId);
        if (!string.IsNullOrEmpty(sectionId)) query = query.Where(r => r.SectionId == sectionId);

        var routines = await query
            .OrderBy(r => r.Day)
            .ThenBy(r => r.PeriodNumber)
            .Select(r => new RoutinePeriodDto
            {
                Id = r.Id,
                Day = r.Day,
                PeriodNumber = r.PeriodNumber,
                StartTime = r.StartTime,
                EndTime = r.EndTime,
                ClassId = r.ClassId,
                ClassName = r.ClassName,
                SectionId = r.SectionId,
                SectionName = r.SectionName,
                SubjectId = r.SubjectId,
                SubjectName = r.SubjectName,
                TeacherId = r.TeacherId,
                TeacherName = r.TeacherName,
                RoomNo = r.RoomNo
            })
            .ToListAsync();

        return Ok(ApiResponse<List<RoutinePeriodDto>>.Ok(routines));
    }

    [HttpPost("routines")]
    public async Task<ActionResult<ApiResponse<RoutinePeriodDto>>> CreateRoutinePeriod([FromBody] RoutinePeriodDto request)
    {
        var entity = new RoutinePeriod
        {
            Day = request.Day,
            PeriodNumber = request.PeriodNumber,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            ClassId = request.ClassId,
            ClassName = request.ClassName,
            SectionId = request.SectionId,
            SectionName = request.SectionName,
            SubjectId = request.SubjectId,
            SubjectName = request.SubjectName,
            TeacherId = request.TeacherId,
            TeacherName = request.TeacherName,
            RoomNo = request.RoomNo
        };

        _context.RoutinePeriods.Add(entity);
        await _context.SaveChangesAsync();

        request.Id = entity.Id;
        return Ok(ApiResponse<RoutinePeriodDto>.Ok(request, "Period assigned successfully"));
    }
}
