namespace SchoolManagement.Application.Employee.DTOs;

public class TeacherDto
{
    public string BranchId { get; set; } = string.Empty;
    public string Id { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Qualification { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime JoiningDate { get; set; }
    public string Status { get; set; } = "Active";
    public string Avatar { get; set; } = string.Empty;
    public List<string> AssignedSubjects { get; set; } = new();
}

public class CreateTeacherRequest
{
    public string EmployeeCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Qualification { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime JoiningDate { get; set; }
    public string Status { get; set; } = "Active";
    public string? Avatar { get; set; }
    public List<string> AssignedSubjects { get; set; } = new();
}

public class UpdateTeacherRequest
{
    public string EmployeeCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Qualification { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime JoiningDate { get; set; }
    public string Status { get; set; } = "Active";
    public string? Avatar { get; set; }
    public List<string> AssignedSubjects { get; set; } = new();
}

public class TeacherLeaveApplicationDto
{
    public string Id { get; set; } = string.Empty;
    public string BranchId { get; set; } = string.Empty;
    public string TeacherId { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string LeaveType { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalDays { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public DateTime AppliedOn { get; set; }
    public string? ReviewedBy { get; set; }
    public string? ReviewRemark { get; set; }
}

public class CreateTeacherLeaveRequest
{
    public string TeacherId { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string LeaveType { get; set; } = "Casual Leave";
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalDays { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class ReviewTeacherLeaveRequest
{
    public string Status { get; set; } = "Approved"; // Approved or Rejected
    public string? ReviewRemark { get; set; }
}
