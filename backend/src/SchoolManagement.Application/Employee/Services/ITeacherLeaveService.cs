using SchoolManagement.Application.Employee.DTOs;

namespace SchoolManagement.Application.Employee.Services;

public interface ITeacherLeaveService
{
    Task<List<TeacherLeaveApplicationDto>> GetLeavesAsync(string? status, string? leaveType, string? teacherId, string? search);
    Task<TeacherLeaveApplicationDto?> GetLeaveByIdAsync(string id);
    Task<TeacherLeaveApplicationDto> ApplyLeaveAsync(CreateTeacherLeaveRequest req);
    Task<TeacherLeaveApplicationDto?> UpdateStatusAsync(string id, ReviewTeacherLeaveRequest req, string reviewerUsername);
    Task<bool> DeleteLeaveAsync(string id);
}
