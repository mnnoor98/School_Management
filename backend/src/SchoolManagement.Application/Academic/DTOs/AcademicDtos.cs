namespace SchoolManagement.Application.Academic.DTOs;

public class SchoolClassDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public int SectionCount { get; set; }
    public int StudentCount { get; set; }
}

public class SectionDto
{
    public string Id { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public int CurrentStudentCount { get; set; }
    public string? ClassTeacherId { get; set; }
    public string? ClassTeacherName { get; set; }
}

public class SubjectDto
{
    public string Id { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Compulsory";
    public decimal FullMarks { get; set; }
    public decimal PassMarks { get; set; }
}

public class RoutinePeriodDto
{
    public string Id { get; set; } = string.Empty;
    public string Day { get; set; } = string.Empty;
    public int PeriodNumber { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SectionId { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string SubjectId { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string TeacherId { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public string RoomNo { get; set; } = string.Empty;
}

public class AcademicYearDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public bool IsLocked { get; set; }
}
