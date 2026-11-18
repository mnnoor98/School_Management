using SchoolManagement.Domain.Student;

namespace SchoolManagement.Application.Common.Interfaces;

public interface IStudentAccessService
{
    Task<bool> IsRestrictedUserAsync();
    Task<List<string>?> GetAllowedStudentIdsAsync();
    Task<bool> CanAccessStudentAsync(string studentId);
    Task<Student?> GetCurrentStudentOrWardAsync();
}
