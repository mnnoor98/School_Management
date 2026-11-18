using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Exams.DTOs;
using SchoolManagement.Application.Students.DTOs;
using SchoolManagement.Domain.Exam;

namespace SchoolManagement.Application.Exams.Services;

public class ExamService : IExamService
{
    private readonly IApplicationDbContext _context;
    private readonly IExcelImportExportService _excelService;

    public ExamService(IApplicationDbContext context, IExcelImportExportService excelService)
    {
        _context = context;
        _excelService = excelService;
    }

    public async Task<List<ExamDto>> GetExamsAsync()
    {
        return await _context.Exams
            .AsNoTracking()
            .Select(e => new ExamDto
            {
                Id = e.Id,
                BranchId = e.BranchId,
                Name = e.Name,
                Term = e.Term,
                AcademicYear = e.AcademicYear,
                StartDate = e.StartDate,
                EndDate = e.EndDate,
                IsPublished = e.IsPublished
            })
            .ToListAsync();
    }

    public async Task<ExamDto?> GetExamByIdAsync(string id)
    {
        var e = await _context.Exams.FindAsync(id);
        if (e == null) return null;

        return new ExamDto
        {
            Id = e.Id,
            BranchId = e.BranchId,
            Name = e.Name,
            Term = e.Term,
            AcademicYear = e.AcademicYear,
            StartDate = e.StartDate,
            EndDate = e.EndDate,
            IsPublished = e.IsPublished
        };
    }

    public async Task<ExamDto> CreateExamAsync(ExamCreateRequest request)
    {
        var exam = new Exam
        {
            Id = "ex-" + Guid.NewGuid().ToString("N")[..8],
            Name = request.Name.Trim(),
            Term = request.Term.Trim(),
            AcademicYear = request.AcademicYear.Trim(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            IsPublished = request.IsPublished,
            CreatedAt = DateTime.UtcNow
        };

        _context.Exams.Add(exam);
        await _context.SaveChangesAsync();

        return new ExamDto
        {
            Id = exam.Id,
            BranchId = exam.BranchId,
            Name = exam.Name,
            Term = exam.Term,
            AcademicYear = exam.AcademicYear,
            StartDate = exam.StartDate,
            EndDate = exam.EndDate,
            IsPublished = exam.IsPublished
        };
    }

    public async Task<ExamDto?> UpdateExamAsync(string id, ExamUpdateRequest request)
    {
        var exam = await _context.Exams.FindAsync(id);
        if (exam == null) return null;

        exam.Name = request.Name.Trim();
        exam.Term = request.Term.Trim();
        exam.AcademicYear = request.AcademicYear.Trim();
        exam.StartDate = request.StartDate;
        exam.EndDate = request.EndDate;
        exam.IsPublished = request.IsPublished;
        exam.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new ExamDto
        {
            Id = exam.Id,
            BranchId = exam.BranchId,
            Name = exam.Name,
            Term = exam.Term,
            AcademicYear = exam.AcademicYear,
            StartDate = exam.StartDate,
            EndDate = exam.EndDate,
            IsPublished = exam.IsPublished
        };
    }

    public async Task<bool> DeleteExamAsync(string id)
    {
        var exam = await _context.Exams.FindAsync(id);
        if (exam == null) return false;

        _context.Exams.Remove(exam);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<ExamMarkDto>> GetMarksAsync(string examId, string? classId, string? sectionId, string? subjectId, List<string>? allowedStudentIds = null)
    {
        var query = _context.ExamMarks.AsNoTracking().Where(m => m.ExamId == examId);

        if (allowedStudentIds != null)
        {
            query = query.Where(m => allowedStudentIds.Contains(m.StudentId));
        }

        if (!string.IsNullOrEmpty(classId) && classId != "ALL") query = query.Where(m => m.ClassId == classId);
        if (!string.IsNullOrEmpty(sectionId) && sectionId != "ALL") query = query.Where(m => m.SectionId == sectionId);
        if (!string.IsNullOrEmpty(subjectId) && subjectId != "ALL") query = query.Where(m => m.SubjectId == subjectId);

        return await query
            .OrderBy(m => m.RollNo)
            .Select(m => MapToDto(m))
            .ToListAsync();
    }

    public async Task<bool> SaveMarksAsync(SaveExamMarksRequest request)
    {
        var subject = !string.IsNullOrEmpty(request.SubjectId) ? await _context.Subjects.FindAsync(request.SubjectId) : null;
        var subjectName = subject?.Name ?? (!string.IsNullOrEmpty(request.SubjectId) ? request.SubjectId : "Subject");
        var fullMarks = subject?.FullMarks ?? 100;

        foreach (var item in request.Marks)
        {
            var student = await _context.Students.FindAsync(item.StudentId);
            var studentName = student?.FullName ?? (!string.IsNullOrEmpty(item.StudentName) ? item.StudentName : "Student");
            var rollNo = student?.RollNo ?? (!string.IsNullOrEmpty(item.RollNo) ? item.RollNo : "01");

            var (grade, gp, isPass) = CalculateGrade(item.ObtainedMarks, item.IsAbsent);

            var existing = await _context.ExamMarks
                .FirstOrDefaultAsync(m => m.ExamId == request.ExamId && m.StudentId == item.StudentId && m.SubjectId == request.SubjectId);

            if (existing != null)
            {
                existing.StudentName = studentName;
                existing.RollNo = rollNo;
                existing.ObtainedMarks = item.IsAbsent ? 0 : item.ObtainedMarks;
                existing.Grade = grade;
                existing.GradePoint = gp;
                existing.IsPass = isPass;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _context.ExamMarks.Add(new ExamMark
                {
                    SchoolId = "sch-01",
                    ExamId = request.ExamId,
                    StudentId = item.StudentId,
                    StudentName = studentName,
                    RollNo = rollNo,
                    ClassId = request.ClassId,
                    SectionId = request.SectionId,
                    SubjectId = request.SubjectId,
                    SubjectName = subjectName,
                    FullMarks = fullMarks,
                    ObtainedMarks = item.IsAbsent ? 0 : item.ObtainedMarks,
                    Grade = grade,
                    GradePoint = gp,
                    IsPass = isPass,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<StudentMarksheetDto?> GetStudentMarksheetAsync(string examId, string studentId)
    {
        var exam = await _context.Exams.FindAsync(examId);
        var student = await _context.Students.FindAsync(studentId);
        if (student == null) return null;

        var marks = await _context.ExamMarks
            .AsNoTracking()
            .Where(m => m.ExamId == examId && m.StudentId == studentId)
            .OrderBy(m => m.SubjectName)
            .Select(m => MapToDto(m))
            .ToListAsync();

        decimal totalMarks = marks.Sum(m => m.FullMarks);
        decimal totalObtained = marks.Sum(m => m.ObtainedMarks);
        bool hasFail = marks.Any(m => !m.IsPass || m.Grade == "F" || m.ObtainedMarks < 33);
        decimal avgGp = marks.Count > 0 ? (hasFail ? 0.0m : Math.Round(marks.Average(m => m.GradePoint), 2)) : 0.0m;
        string overallGrade = marks.Count == 0 ? "N/A" : (hasFail ? "F" : (avgGp >= 5.0m ? "A+" : avgGp >= 4.0m ? "A" : avgGp >= 3.5m ? "A-" : avgGp >= 3.0m ? "B" : avgGp >= 2.0m ? "C" : avgGp >= 1.0m ? "D" : "F"));

        string remarks = marks.Count == 0
            ? "No assessment marks recorded for this examination."
            : hasFail
                ? "Did not achieve passing marks in one or more subjects. Remedial examination required."
                : (avgGp >= 5.0m ? "Exceptional academic performance with GPA 5.00 (Golden / Top Honors)." :
                   avgGp >= 4.0m ? "Outstanding academic excellence and top class honors." :
                   avgGp >= 3.5m ? "Very good academic standing with steady consistency." :
                   avgGp >= 3.0m ? "Good academic progress with room for improvement." : "Passed with minimum grade threshold.");

        int rank = 1;
        if (!string.IsNullOrEmpty(student.ClassId))
        {
            var classStudentIds = await _context.Students
                .AsNoTracking()
                .Where(s => s.ClassId == student.ClassId)
                .Select(s => s.Id)
                .ToListAsync();

            var peerMarks = await _context.ExamMarks
                .AsNoTracking()
                .Where(m => m.ExamId == examId && classStudentIds.Contains(m.StudentId))
                .GroupBy(m => m.StudentId)
                .Select(g => new {
                    StudentId = g.Key,
                    Total = g.Sum(m => m.ObtainedMarks),
                    HasFail = g.Any(m => !m.IsPass || m.Grade == "F" || m.ObtainedMarks < 33),
                    AvgGp = g.Average(m => m.GradePoint)
                })
                .ToListAsync();

            var sortedPeers = peerMarks
                .OrderBy(x => x.HasFail ? 1 : 0)
                .ThenByDescending(x => x.HasFail ? 0 : x.AvgGp)
                .ThenByDescending(x => x.Total)
                .ToList();

            var peerIndex = sortedPeers.FindIndex(x => x.StudentId == studentId);
            if (peerIndex >= 0) rank = peerIndex + 1;
        }

        return new StudentMarksheetDto
        {
            Student = new StudentDto
            {
                Id = student.Id,
                BranchId = student.BranchId,
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
            Gpa = avgGp,
            LetterGrade = overallGrade,
            Remarks = remarks,
            PositionInClass = rank
        };
    }

    public async Task<List<StudentMarksheetDto>> GetClassMarksheetAsync(string examId, string classId, string sectionId, List<string>? allowedStudentIds = null)
    {
        var studentsQuery = _context.Students.AsNoTracking().Where(s => s.ClassId == classId);
        if (!string.IsNullOrEmpty(sectionId) && sectionId != "ALL")
        {
            studentsQuery = studentsQuery.Where(s => s.SectionId == sectionId);
        }
        if (allowedStudentIds != null)
        {
            studentsQuery = studentsQuery.Where(s => allowedStudentIds.Contains(s.Id));
        }

        var students = await studentsQuery.OrderBy(s => s.RollNo).ToListAsync();
        var result = new List<StudentMarksheetDto>();

        foreach (var s in students)
        {
            var sheet = await GetStudentMarksheetAsync(examId, s.Id);
            if (sheet != null) result.Add(sheet);
        }

        var ranked = result
            .OrderBy(r => r.LetterGrade == "F" || r.Gpa == 0 ? 1 : 0)
            .ThenByDescending(r => r.Gpa)
            .ThenByDescending(r => r.TotalObtained)
            .ToList();

        for (int i = 0; i < ranked.Count; i++)
        {
            ranked[i].PositionInClass = i + 1;
        }

        return ranked;
    }

    public async Task<List<ExamScheduleItemDto>> GetSchedulesAsync(string? examId, string? classId)
    {
        var query = _context.ExamScheduleItems.AsNoTracking().AsQueryable();

        if (!string.IsNullOrEmpty(examId))
            query = query.Where(s => s.ExamId == examId);

        if (!string.IsNullOrEmpty(classId))
            query = query.Where(s => s.ClassId == classId);

        return await query
            .OrderBy(s => s.ExamDate)
            .ThenBy(s => s.StartTime)
            .Select(s => new ExamScheduleItemDto
            {
                Id = s.Id,
                BranchId = s.BranchId,
                ExamId = s.ExamId,
                ClassId = s.ClassId,
                ClassName = s.ClassName,
                SubjectId = s.SubjectId,
                SubjectName = s.SubjectName,
                ExamDate = s.ExamDate,
                Day = s.Day,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                RoomNo = s.RoomNo,
                FullMarks = s.FullMarks,
                PassMarks = s.PassMarks
            })
            .ToListAsync();
    }

    public async Task<ExamScheduleItemDto?> GetScheduleByIdAsync(string id)
    {
        var s = await _context.ExamScheduleItems.FindAsync(id);
        if (s == null) return null;

        return new ExamScheduleItemDto
        {
            Id = s.Id,
            BranchId = s.BranchId,
            ExamId = s.ExamId,
            ClassId = s.ClassId,
            ClassName = s.ClassName,
            SubjectId = s.SubjectId,
            SubjectName = s.SubjectName,
            ExamDate = s.ExamDate,
            Day = s.Day,
            StartTime = s.StartTime,
            EndTime = s.EndTime,
            RoomNo = s.RoomNo,
            FullMarks = s.FullMarks,
            PassMarks = s.PassMarks
        };
    }

    public async Task<ExamScheduleItemDto> CreateScheduleAsync(CreateExamScheduleRequest req)
    {
        var item = new ExamScheduleItem
        {
            ExamId = req.ExamId,
            ClassId = req.ClassId,
            ClassName = req.ClassName,
            SubjectId = req.SubjectId,
            SubjectName = req.SubjectName,
            ExamDate = DateTime.SpecifyKind(req.ExamDate, DateTimeKind.Utc),
            Day = req.Day,
            StartTime = req.StartTime,
            EndTime = req.EndTime,
            RoomNo = req.RoomNo,
            FullMarks = req.FullMarks,
            PassMarks = req.PassMarks
        };

        _context.ExamScheduleItems.Add(item);
        await _context.SaveChangesAsync();

        return new ExamScheduleItemDto
        {
            Id = item.Id,
            BranchId = item.BranchId,
            ExamId = item.ExamId,
            ClassId = item.ClassId,
            ClassName = item.ClassName,
            SubjectId = item.SubjectId,
            SubjectName = item.SubjectName,
            ExamDate = item.ExamDate,
            Day = item.Day,
            StartTime = item.StartTime,
            EndTime = item.EndTime,
            RoomNo = item.RoomNo,
            FullMarks = item.FullMarks,
            PassMarks = item.PassMarks
        };
    }

    public async Task<bool> DeleteScheduleAsync(string id)
    {
        var item = await _context.ExamScheduleItems.FindAsync(id);
        if (item == null) return false;

        _context.ExamScheduleItems.Remove(item);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<byte[]> GenerateMarksTemplateAsync(string examId, string classId, string? sectionId, string subjectId)
    {
        var exam = await _context.Exams.FindAsync(examId);
        var examName = exam?.Name ?? "Assessment";

        var schoolClass = await _context.Classes.FindAsync(classId);
        var className = schoolClass?.Name ?? classId;

        string sectionName = "All Sections";
        if (!string.IsNullOrEmpty(sectionId) && sectionId != "ALL")
        {
            var section = await _context.Sections.FindAsync(sectionId);
            sectionName = section?.Name ?? sectionId;
        }

        var subject = await _context.Subjects.FindAsync(subjectId);
        var subjectName = subject?.Name ?? subjectId;
        var fullMarks = subject?.FullMarks ?? 100;

        var studentsQuery = _context.Students.AsNoTracking().Where(s => s.ClassId == classId);
        if (!string.IsNullOrEmpty(sectionId) && sectionId != "ALL")
        {
            studentsQuery = studentsQuery.Where(s => s.SectionId == sectionId);
        }

        var studentRows = await studentsQuery
            .OrderBy(s => s.RollNo)
            .Select(s => new { s.Id, RollNo = s.RollNo ?? "", s.FullName })
            .ToListAsync();

        var tupleList = studentRows
            .Select(s => (s.Id, s.RollNo, s.FullName))
            .ToList();

        return _excelService.GenerateExamMarksTemplate(
            examName,
            className,
            sectionName,
            subjectName,
            fullMarks,
            tupleList);
    }

    public async Task<(int Count, List<string> Errors)> BulkUploadMarksAsync(string examId, string classId, string? sectionId, string subjectId, Stream stream)
    {
        var subject = await _context.Subjects.FindAsync(subjectId);
        var fullMarks = subject?.FullMarks ?? 100;

        var parsedMarks = _excelService.ParseExamMarksExcel(stream, fullMarks, out var errors);
        if (errors.Count > 0 && parsedMarks.Count == 0)
        {
            return (0, errors);
        }

        if (parsedMarks.Count > 0)
        {
            var saveRequest = new SaveExamMarksRequest
            {
                ExamId = examId,
                ClassId = classId,
                SectionId = sectionId ?? string.Empty,
                SubjectId = subjectId,
                Marks = parsedMarks
            };

            await SaveMarksAsync(saveRequest);
        }

        return (parsedMarks.Count, errors);
    }

    private static (string Grade, decimal Gp, bool IsPass) CalculateGrade(decimal marks, bool isAbsent = false)
    {
        if (isAbsent) return ("F", 0.0m, false);
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
        BranchId = m.BranchId,
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
