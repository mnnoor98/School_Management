namespace SchoolManagement.Application.Students.DTOs;

public class StudentDto
{
    public string BranchId { get; set; } = string.Empty;
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
    public string? FatherName { get; set; }
    public string? FatherPhone { get; set; }
    public string? FatherOccupation { get; set; }
    public string? FatherNid { get; set; }
    public string? MotherName { get; set; }
    public string? MotherPhone { get; set; }
    public string? MotherOccupation { get; set; }
    public string? MotherNid { get; set; }
    public string Nationality { get; set; } = "Bangladeshi";
    public string? PreviousSchool { get; set; }
    public string? Division { get; set; }
    public string? District { get; set; }
    public string? Upazila { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string Shift { get; set; } = "Morning";
    public string AdmissionCategory { get; set; } = "Regular";
    public string? LastClassPassed { get; set; }
    public string? LastPassingYear { get; set; }
    public string? LastGpaMarks { get; set; }
    public string? TcNumber { get; set; }
    public string? CoCurricular { get; set; }
    public string? MedicalNotes { get; set; }
    public bool IsHostel { get; set; }
    public bool IsTransport { get; set; }
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
    public string? FatherName { get; set; }
    public string? FatherPhone { get; set; }
    public string? FatherOccupation { get; set; }
    public string? FatherNid { get; set; }
    public string? MotherName { get; set; }
    public string? MotherPhone { get; set; }
    public string? MotherOccupation { get; set; }
    public string? MotherNid { get; set; }
    public string? Nationality { get; set; }
    public string? PreviousSchool { get; set; }
    public string? Division { get; set; }
    public string? District { get; set; }
    public string? Upazila { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? Shift { get; set; }
    public string? AdmissionCategory { get; set; }
    public string? LastClassPassed { get; set; }
    public string? LastPassingYear { get; set; }
    public string? LastGpaMarks { get; set; }
    public string? TcNumber { get; set; }
    public string? CoCurricular { get; set; }
    public string? MedicalNotes { get; set; }
    public bool IsHostel { get; set; }
    public bool IsTransport { get; set; }
    public string ClassId { get; set; } = string.Empty;
    public string SectionId { get; set; } = string.Empty;
    public string? AcademicYearId { get; set; }
    public string? RollNo { get; set; }
    public string? Status { get; set; } = "Active";
}

public class StudentPromotionRequest
{
    public string TargetAcademicYearId { get; set; } = string.Empty;
    public string TargetClassId { get; set; } = string.Empty;
    public string TargetSectionId { get; set; } = string.Empty;
    public string NewRollNo { get; set; } = string.Empty;
}

public class UpdateStudentRequest
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
    public string? FatherName { get; set; }
    public string? FatherPhone { get; set; }
    public string? FatherOccupation { get; set; }
    public string? FatherNid { get; set; }
    public string? MotherName { get; set; }
    public string? MotherPhone { get; set; }
    public string? MotherOccupation { get; set; }
    public string? MotherNid { get; set; }
    public string? Nationality { get; set; }
    public string? PreviousSchool { get; set; }
    public string? Division { get; set; }
    public string? District { get; set; }
    public string? Upazila { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? Shift { get; set; }
    public string? AdmissionCategory { get; set; }
    public string? LastClassPassed { get; set; }
    public string? LastPassingYear { get; set; }
    public string? LastGpaMarks { get; set; }
    public string? TcNumber { get; set; }
    public string? CoCurricular { get; set; }
    public string? MedicalNotes { get; set; }
    public bool IsHostel { get; set; }
    public bool IsTransport { get; set; }
    public string? ClassId { get; set; }
    public string? SectionId { get; set; }
    public string? RollNo { get; set; }
    public string Status { get; set; } = "Active";
}

public class UpdateStudentStatusRequest
{
    public string Status { get; set; } = "Active";
    public string? Reason { get; set; }
}

public class BatchStudentPromotionItem
{
    public string StudentId { get; set; } = string.Empty;
    public string NewRollNo { get; set; } = string.Empty;
    public string? TargetClassId { get; set; }
    public string? TargetSectionId { get; set; }
    public string? Status { get; set; } = "Promoted";
    public string? Remarks { get; set; }
}

public class BatchStudentPromotionRequest
{
    public string TargetAcademicYearId { get; set; } = string.Empty;
    public string TargetClassId { get; set; } = string.Empty;
    public string TargetSectionId { get; set; } = string.Empty;
    public List<BatchStudentPromotionItem> Students { get; set; } = new();
}

public class BulkStudentImportRow
{
    public int RowNumber { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? BanglaName { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string Gender { get; set; } = "Male";
    public string BloodGroup { get; set; } = "O+";
    public string Religion { get; set; } = "Islam";
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string PresentAddress { get; set; } = string.Empty;
    public string PermanentAddress { get; set; } = string.Empty;
    public string GuardianName { get; set; } = string.Empty;
    public string GuardianRelation { get; set; } = "Father";
    public string GuardianPhone { get; set; } = string.Empty;
    public string GuardianOccupation { get; set; } = string.Empty;
    public string GuardianIncome { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
}

public class BulkImportResultDto
{
    public int TotalRows { get; set; }
    public int ImportedCount { get; set; }
    public int SkippedCount { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<string> CreatedAdmissionNos { get; set; } = new();
}

public class LookupOptionDto
{
    public string Id { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class DistrictLookupDto
{
    public string Name { get; set; } = string.Empty;
    public List<string> Upazilas { get; set; } = new();
}

public class DivisionLookupDto
{
    public string Name { get; set; } = string.Empty;
    public List<DistrictLookupDto> Districts { get; set; } = new();
}

public class AdmissionLookupsDto
{
    public List<LookupOptionDto> AcademicYears { get; set; } = new();
    public List<LookupOptionDto> Classes { get; set; } = new();
    public List<LookupOptionDto> Genders { get; set; } = new();
    public List<LookupOptionDto> BloodGroups { get; set; } = new();
    public List<LookupOptionDto> Religions { get; set; } = new();
    public List<LookupOptionDto> Nationalities { get; set; } = new();
    public List<LookupOptionDto> GuardianRelations { get; set; } = new();
    public List<LookupOptionDto> AdmissionCategories { get; set; } = new();
    public List<LookupOptionDto> AcademicShifts { get; set; } = new();
    public List<DivisionLookupDto> Divisions { get; set; } = new();
}
