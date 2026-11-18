using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Employee;

public class Teacher : BaseEntity, ICampusScopedEntity
{
    public string BranchId { get; set; } = "br-01";
    public string SchoolId { get; set; } = "sch-01";
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
    public string AssignedSubjectsJson { get; set; } = "[]";
}
