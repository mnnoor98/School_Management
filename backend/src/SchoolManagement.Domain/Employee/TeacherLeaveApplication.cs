using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Employee;

public class TeacherLeaveApplication : BaseEntity, ICampusScopedEntity
{
    public string BranchId { get; set; } = "br-01";
    public string SchoolId { get; set; } = "sch-01";
    public string TeacherId { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string LeaveType { get; set; } = "Casual Leave";
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalDays { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public DateTime AppliedOn { get; set; } = DateTime.UtcNow;
    public string? ReviewedBy { get; set; }
    public string? ReviewRemark { get; set; }
}
