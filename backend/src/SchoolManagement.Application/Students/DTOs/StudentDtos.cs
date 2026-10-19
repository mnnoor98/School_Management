namespace SchoolManagement.Application.Students.DTOs;

public class StudentDto
{
    public string Id { get; set; } = string.Empty;
    public string AdmissionNo { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? BanglaName { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string Gender { get; set; } = "Male";
    public string BloodGroup { get; set; } = "O+";
    public string Religion { get; set; } = "Islam";
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string PresentAddress { get; set; } = string.Empty;
    public string PermanentAddress { get; set; } = string.Empty;
    public string PhotoUrl { get; set; } = string.Empty;
    public string GuardianName { get; set; } = string.Empty;
    public string GuardianRelation { get; set; } = "Father";
    public string GuardianPhone { get; set; } = string.Empty;
    public string GuardianOccupation { get; set; } = string.Empty;
    public string GuardianIncome { get; set; } = string.Empty;
    public string AcademicYearId { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SectionId { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
    public DateTime AdmissionDate { get; set; }
    public string Status { get; set; } = "Active";
}

public class AdmissionRequest
{
    public string FullName { get; set; } = string.Empty;
    public string? BanglaName { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string Gender { get; set; } = "Male";
    public string BloodGroup { get; set; } = "O+";
    public string Religion { get; set; } = "Islam";
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string PresentAddress { get; set; } = string.Empty;
    public string PermanentAddress { get; set; } = string.Empty;
    public string PhotoUrl { get; set; } = string.Empty;
    public string GuardianName { get; set; } = string.Empty;
    public string GuardianRelation { get; set; } = "Father";
    public string GuardianPhone { get; set; } = string.Empty;
    public string GuardianOccupation { get; set; } = string.Empty;
    public string GuardianIncome { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string SectionId { get; set; } = string.Empty;
}

public class StudentPromotionRequest
{
    public string TargetAcademicYearId { get; set; } = string.Empty;
    public string TargetClassId { get; set; } = string.Empty;
    public string TargetSectionId { get; set; } = string.Empty;
    public string NewRollNo { get; set; } = string.Empty;
}
