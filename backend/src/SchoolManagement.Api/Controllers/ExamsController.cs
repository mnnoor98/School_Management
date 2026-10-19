using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.Exams.DTOs;
using SchoolManagement.Application.Students.DTOs;
using SchoolManagement.Domain.Exam;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class ExamsController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public ExamsController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ExamDto>>>> GetExams()
    {
        var exams = await _context.Exams
            .AsNoTracking()
            .Select(e => new ExamDto
            {
                Id = e.Id,
                Name = e.Name,
                Term = e.Term,
                AcademicYear = e.AcademicYear,
                StartDate = e.StartDate,
                EndDate = e.EndDate,
                IsPublished = e.IsPublished
            })
            .ToListAsync();

        return Ok(ApiResponse<List<ExamDto>>.Ok(exams));
    }

    [HttpGet("{id}/marks")]
    public async Task<ActionResult<ApiResponse<List<ExamMarkDto>>>> GetExamMarks(string id, [FromQuery] string? classId, [FromQuery] string? sectionId, [FromQuery] string? subjectId)
    {
        var query = _context.ExamMarks.AsNoTracking().Where(m => m.ExamId == id);
        if (!string.IsNullOrEmpty(classId)) query = query.Where(m => m.ClassId == classId);
        if (!string.IsNullOrEmpty(sectionId)) query = query.Where(m => m.SectionId == sectionId);
        if (!string.IsNullOrEmpty(subjectId)) query = query.Where(m => m.SubjectId == subjectId);

        var marks = await query
            .OrderBy(m => m.RollNo)
            .Select(m => MapToDto(m))
            .ToListAsync();

        return Ok(ApiResponse<List<ExamMarkDto>>.Ok(marks));
    }

    [HttpPost("{id}/marks")]
    public async Task<ActionResult<ApiResponse<bool>>> SaveMarks(string id, [FromBody] SaveExamMarksRequest request)
    {
        var subject = await _context.Subjects.FindAsync(request.SubjectId);

        foreach (var item in request.Marks)
        {
            var student = await _context.Students.FindAsync(item.StudentId);
            if (student == null) continue;

            var (grade, gp, isPass) = CalculateGrade(item.ObtainedMarks);

            var existing = await _context.ExamMarks
                .FirstOrDefaultAsync(m => m.ExamId == id && m.StudentId == item.StudentId && m.SubjectId == request.SubjectId);

            if (existing != null)
            {
                existing.ObtainedMarks = item.ObtainedMarks;
                existing.Grade = grade;
                existing.GradePoint = gp;
                existing.IsPass = isPass;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _context.ExamMarks.Add(new ExamMark
                {
                    ExamId = id,
                    StudentId = item.StudentId,
                    StudentName = student.FullName,
                    RollNo = student.RollNo,
                    ClassId = request.ClassId,
                    SectionId = request.SectionId,
                    SubjectId = request.SubjectId,
                    SubjectName = subject?.Name ?? "Subject",
                    FullMarks = subject?.FullMarks ?? 100,
                    ObtainedMarks = item.ObtainedMarks,
                    Grade = grade,
                    GradePoint = gp,
                    IsPass = isPass
                });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<bool>.Ok(true, "Marks recorded successfully"));
    }

    [HttpGet("{examId}/students/{studentId}/marksheet")]
    public async Task<ActionResult<ApiResponse<StudentMarksheetDto>>> GetStudentMarksheet(string examId, string studentId)
    {
        var exam = await _context.Exams.FindAsync(examId);
        var student = await _context.Students.FindAsync(studentId);
        if (student == null) return NotFound(ApiResponse<StudentMarksheetDto>.Fail("Student not found"));

        var marks = await _context.ExamMarks
            .AsNoTracking()
            .Where(m => m.ExamId == examId && m.StudentId == studentId)
            .Select(m => MapToDto(m))
            .ToListAsync();

        decimal totalMarks = marks.Sum(m => m.FullMarks);
        decimal totalObtained = marks.Sum(m => m.ObtainedMarks);
        decimal avgGp = marks.Count > 0 ? marks.Average(m => m.GradePoint) : 0;
        string overallGrade = avgGp >= 5.0m ? "A+" : avgGp >= 4.0m ? "A" : avgGp >= 3.5m ? "A-" : avgGp >= 3.0m ? "B" : avgGp >= 2.0m ? "C" : "F";

        var marksheet = new StudentMarksheetDto
        {
            Student = new StudentDto
            {
                Id = student.Id,
                AdmissionNo = student.AdmissionNo,
                FullName = student.FullName,
                BanglaName = student.BanglaName,
                ClassId = student.ClassId,
                ClassName = student.ClassName,
                SectionId = student.SectionId,
                SectionName = student.SectionName,
                RollNo = student.RollNo,
                PhotoUrl = student.PhotoUrl
            },
            ExamName = exam?.Name ?? "Term Examination",
            AcademicYear = exam?.AcademicYear ?? "2026",
            Marks = marks,
            TotalMarks = totalMarks,
            TotalObtained = totalObtained,
            Gpa = Math.Round(avgGp, 2),
            LetterGrade = overallGrade,
            Remarks = overallGrade == "A+" ? "Exceptional academic performance with top honors." : "Satisfactory progress.",
            PositionInClass = 1
        };

        return Ok(ApiResponse<StudentMarksheetDto>.Ok(marksheet));
    }

    private static (string Grade, decimal Gp, bool IsPass) CalculateGrade(decimal marks)
    {
        if (marks >= 80) return ("A+", 5.0m, true);
        if (marks >= 70) return ("A", 4.0m, true);
        if (marks >= 60) return ("A-", 3.5m, true);
        if (marks >= 50) return ("B", 3.0m, true);
        if (marks >= 40) return ("C", 2.0m, true);
        if (marks >= 33) return ("D", 1.0m, true);
        return ("F", 0.0m, false);
    }

    private static ExamMarkDto MapToDto(ExamMark m) => new()
    {
        Id = m.Id,
        ExamId = m.ExamId,
        StudentId = m.StudentId,
        StudentName = m.StudentName,
        RollNo = m.RollNo,
        ClassId = m.ClassId,
        SectionId = m.SectionId,
        SubjectId = m.SubjectId,
        SubjectName = m.SubjectName,
        FullMarks = m.FullMarks,
        ObtainedMarks = m.ObtainedMarks,
        Grade = m.Grade,
        GradePoint = m.GradePoint,
        IsPass = m.IsPass
    };
}
