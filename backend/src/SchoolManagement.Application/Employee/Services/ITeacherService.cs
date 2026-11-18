using SchoolManagement.Application.Employee.DTOs;

namespace SchoolManagement.Application.Employee.Services;

public interface ITeacherService
{
    Task<List<TeacherDto>> GetTeachersAsync(string? search);
    Task<TeacherDto?> GetTeacherByIdAsync(string id);
    Task<(TeacherDto? Teacher, string? Error)> CreateTeacherAsync(CreateTeacherRequest request);
    Task<(TeacherDto? Teacher, string? Error)> UpdateTeacherAsync(string id, UpdateTeacherRequest request);
    Task<bool> DeleteTeacherAsync(string id);
}
