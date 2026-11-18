using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Student;

public class Student : BaseEntity, ICampusScopedEntity
{
    public string BranchId { get; set; } = "br-01";
    public string SchoolId { get; set; } = "sch-01";
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

    // Guardian Info
    public string GuardianName { get; set; } = string.Empty;
    public string GuardianRelation { get; set; } = "Father";
    public string GuardianPhone { get; set; } = string.Empty;
    public string GuardianOccupation { get; set; } = string.Empty;
    public string GuardianIncome { get; set; } = string.Empty;

    // Extended Personal & Family Details
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

    // Emergency Contact
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelation { get; set; }

    // Additional Academic & Logistics
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

    // Current Academic Info
    public string AcademicYearId { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SectionId { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
    public DateTime AdmissionDate { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Active";

    public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
}
