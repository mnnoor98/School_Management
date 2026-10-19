using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.Students.DTOs;
using SchoolManagement.Domain.Student;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class StudentsController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public StudentsController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<StudentDto>>>> GetStudents([FromQuery] string? classId, [FromQuery] string? sectionId, [FromQuery] string? search)
    {
        var query = _context.Students.AsNoTracking().AsQueryable();

        if (!string.IsNullOrEmpty(classId)) query = query.Where(s => s.ClassId == classId);
        if (!string.IsNullOrEmpty(sectionId)) query = query.Where(s => s.SectionId == sectionId);
        if (!string.IsNullOrEmpty(search))
        {
            search = search.Trim().ToLower();
            query = query.Where(s => s.FullName.ToLower().Contains(search) || s.AdmissionNo.ToLower().Contains(search) || s.RollNo.Contains(search));
        }

        var list = await query
            .OrderBy(s => s.RollNo)
            .Select(s => MapToDto(s))
            .ToListAsync();

        return Ok(ApiResponse<List<StudentDto>>.Ok(list));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<StudentDto>>> GetStudentById(string id)
    {
        var student = await _context.Students.FindAsync(id);
        if (student == null) return NotFound(ApiResponse<StudentDto>.Fail("Student not found"));

        return Ok(ApiResponse<StudentDto>.Ok(MapToDto(student)));
    }

    [HttpPost("admissions")]
    public async Task<ActionResult<ApiResponse<StudentDto>>> AdmitStudent([FromBody] AdmissionRequest request)
    {
        var academicYear = await _context.AcademicYears.FirstOrDefaultAsync(y => y.IsCurrent);
        var schoolClass = await _context.Classes.FindAsync(request.ClassId);
        var section = await _context.Sections.FindAsync(request.SectionId);

        int count = await _context.Students.CountAsync(s => s.ClassId == request.ClassId && s.SectionId == request.SectionId);
        string newRoll = (count + 1).ToString("D2");
        string admNo = $"ADM-{DateTime.UtcNow.Year}-" + (new Random().Next(1000, 9999));

        var student = new Student
        {
            AdmissionNo = admNo,
            FullName = request.FullName,
            BanglaName = request.BanglaName,
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender,
            BloodGroup = request.BloodGroup,
            Religion = request.Religion,
            Email = request.Email,
            Phone = request.Phone,
            PresentAddress = request.PresentAddress,
            PermanentAddress = request.PermanentAddress,
            PhotoUrl = string.IsNullOrEmpty(request.PhotoUrl) ? "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80" : request.PhotoUrl,
            GuardianName = request.GuardianName,
            GuardianRelation = request.GuardianRelation,
            GuardianPhone = request.GuardianPhone,
            GuardianOccupation = request.GuardianOccupation,
            GuardianIncome = request.GuardianIncome,
            AcademicYearId = academicYear?.Id ?? "ay-2026",
            ClassId = request.ClassId,
            ClassName = schoolClass?.Name ?? "General Class",
            SectionId = request.SectionId,
            SectionName = section?.Name ?? "Section A",
            RollNo = newRoll,
            AdmissionDate = DateTime.UtcNow,
            Status = "Active"
        };

        _context.Students.Add(student);

        _context.Enrollments.Add(new Enrollment
        {
            StudentId = student.Id,
            AcademicYearId = student.AcademicYearId,
            ClassId = student.ClassId,
            SectionId = student.SectionId,
            RollNo = student.RollNo,
            EnrollmentDate = DateTime.UtcNow,
            Status = "Active"
        });

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<StudentDto>.Ok(MapToDto(student), "Student admitted successfully"));
    }

    [HttpPost("{id}/promote")]
    public async Task<ActionResult<ApiResponse<bool>>> PromoteStudent(string id, [FromBody] StudentPromotionRequest request)
    {
        var student = await _context.Students.FindAsync(id);
        if (student == null) return NotFound(ApiResponse<bool>.Fail("Student not found"));

        var targetClass = await _context.Classes.FindAsync(request.TargetClassId);
        var targetSection = await _context.Sections.FindAsync(request.TargetSectionId);

        student.AcademicYearId = request.TargetAcademicYearId;
        student.ClassId = request.TargetClassId;
        student.ClassName = targetClass?.Name ?? student.ClassName;
        student.SectionId = request.TargetSectionId;
        student.SectionName = targetSection?.Name ?? student.SectionName;
        student.RollNo = request.NewRollNo;
        student.UpdatedAt = DateTime.UtcNow;

        _context.Enrollments.Add(new Enrollment
        {
            StudentId = student.Id,
            AcademicYearId = request.TargetAcademicYearId,
            ClassId = request.TargetClassId,
            SectionId = request.TargetSectionId,
            RollNo = request.NewRollNo,
            EnrollmentDate = DateTime.UtcNow,
            Status = "Active"
        });

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<bool>.Ok(true, "Student promoted successfully"));
    }

    private static StudentDto MapToDto(Student s) => new()
    {
        Id = s.Id,
        AdmissionNo = s.AdmissionNo,
        FullName = s.FullName,
        BanglaName = s.BanglaName,
        DateOfBirth = s.DateOfBirth,
        Gender = s.Gender,
        BloodGroup = s.BloodGroup,
        Religion = s.Religion,
        Email = s.Email,
        Phone = s.Phone,
        PresentAddress = s.PresentAddress,
        PermanentAddress = s.PermanentAddress,
        PhotoUrl = s.PhotoUrl,
        GuardianName = s.GuardianName,
        GuardianRelation = s.GuardianRelation,
        GuardianPhone = s.GuardianPhone,
        GuardianOccupation = s.GuardianOccupation,
        GuardianIncome = s.GuardianIncome,
        AcademicYearId = s.AcademicYearId,
        ClassId = s.ClassId,
        ClassName = s.ClassName,
        SectionId = s.SectionId,
        SectionName = s.SectionName,
        RollNo = s.RollNo,
        AdmissionDate = s.AdmissionDate,
        Status = s.Status
    };
}
