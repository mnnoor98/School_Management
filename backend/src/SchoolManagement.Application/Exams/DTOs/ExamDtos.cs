namespace SchoolManagement.Application.Exams.DTOs;

public class ExamDto
{
    public string BranchId { get; set; } = string.Empty;
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Term { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsPublished { get; set; }
}

public class ExamMarkDto
{
    public string BranchId { get; set; } = string.Empty;
    public string Id { get; set; } = string.Empty;
    public string ExamId { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string SectionId { get; set; } = string.Empty;
    public string SubjectId { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public decimal FullMarks { get; set; }
    public decimal ObtainedMarks { get; set; }
    public decimal TheoryMarks { get; set; }
    public decimal McqMarks { get; set; }
    public decimal PracticalMarks { get; set; }
    public bool IsAbsent { get; set; }
    public string Grade { get; set; } = string.Empty;
    public decimal GradePoint { get; set; }
    public bool IsPass { get; set; }
    public string? Remark { get; set; }
}

public class StudentMarksheetDto
{
    public Students.DTOs.StudentDto Student { get; set; } = new();
    public string ExamName { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
    public List<ExamMarkDto> Marks { get; set; } = new();
    public decimal TotalMarks { get; set; }
    public decimal TotalObtained { get; set; }
    public decimal Gpa { get; set; }
    public string LetterGrade { get; set; } = string.Empty;
    public string Remarks { get; set; } = string.Empty;
    public int PositionInClass { get; set; }
}

public class SaveExamMarksRequest
{
    public string ExamId { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string SectionId { get; set; } = string.Empty;
    public string SubjectId { get; set; } = string.Empty;
    public List<StudentMarkInput> Marks { get; set; } = new();
}

public class StudentMarkInput
{
    public string StudentId { get; set; } = string.Empty;
    public string? StudentName { get; set; }
    public string? RollNo { get; set; }
    public decimal ObtainedMarks { get; set; }
    public decimal TheoryMarks { get; set; }
    public decimal McqMarks { get; set; }
    public decimal PracticalMarks { get; set; }
    public bool IsAbsent { get; set; }
    public string? Remark { get; set; }
}

public class ExamCreateRequest
{
    public string Name { get; set; } = string.Empty;
    public string Term { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsPublished { get; set; } = false;
}

public class ExamUpdateRequest
{
    public string Name { get; set; } = string.Empty;
    public string Term { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsPublished { get; set; }
}
