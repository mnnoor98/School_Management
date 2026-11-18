using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Employee.DTOs;
using SchoolManagement.Domain.Employee;

namespace SchoolManagement.Application.Employee.Services;

public class TeacherService : ITeacherService
{
    private readonly IApplicationDbContext _context;

    public TeacherService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<TeacherDto>> GetTeachersAsync(string? search)
    {
        var query = _context.Teachers.AsNoTracking().AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            search = search.Trim().ToLower();
            query = query.Where(t => t.FullName.ToLower().Contains(search) || t.EmployeeCode.ToLower().Contains(search) || t.Department.ToLower().Contains(search));
        }

        var teachersFromDb = await query
            .OrderBy(t => t.FullName)
            .ToListAsync();

        return teachersFromDb.Select(t => new TeacherDto
        {
            Id = t.Id,
            BranchId = t.BranchId,
            EmployeeCode = t.EmployeeCode,
            FullName = t.FullName,
            Designation = t.Designation,
            Department = t.Department,
            Qualification = t.Qualification,
            Email = t.Email,
            Phone = t.Phone,
            JoiningDate = t.JoiningDate,
            Status = t.Status,
            Avatar = t.Avatar,
            AssignedSubjects = DeserializeSubjects(t.AssignedSubjectsJson)
        }).ToList();
    }

    public async Task<TeacherDto?> GetTeacherByIdAsync(string id)
    {
        var t = await _context.Teachers.FindAsync(id);
        if (t == null) return null;

        return new TeacherDto
        {
            Id = t.Id,
            BranchId = t.BranchId,
            EmployeeCode = t.EmployeeCode,
            FullName = t.FullName,
            Designation = t.Designation,
            Department = t.Department,
            Qualification = t.Qualification,
            Email = t.Email,
            Phone = t.Phone,
            JoiningDate = t.JoiningDate,
            Status = t.Status,
            Avatar = t.Avatar,
            AssignedSubjects = DeserializeSubjects(t.AssignedSubjectsJson)
        };
    }

    public async Task<(TeacherDto? Teacher, string? Error)> CreateTeacherAsync(CreateTeacherRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.EmployeeCode))
        {
            return (null, "Full name and employee code are required.");
        }

        var exists = await _context.Teachers.AnyAsync(t => t.EmployeeCode.ToLower() == request.EmployeeCode.Trim().ToLower());
        if (exists)
        {
            return (null, $"Teacher with employee code '{request.EmployeeCode}' already exists.");
        }

        var defaultAvatar = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80";

        var teacher = new Teacher
        {
            EmployeeCode = request.EmployeeCode.Trim(),
            FullName = request.FullName.Trim(),
            Designation = request.Designation.Trim(),
            Department = request.Department.Trim(),
            Qualification = request.Qualification.Trim(),
            Email = request.Email.Trim(),
            Phone = request.Phone.Trim(),
            JoiningDate = DateTime.SpecifyKind(request.JoiningDate, DateTimeKind.Utc),
            Status = request.Status,
            Avatar = string.IsNullOrWhiteSpace(request.Avatar) ? defaultAvatar : request.Avatar,
            AssignedSubjectsJson = JsonSerializer.Serialize(request.AssignedSubjects ?? new List<string>())
        };

        _context.Teachers.Add(teacher);
        await _context.SaveChangesAsync();

        var dto = new TeacherDto
        {
            Id = teacher.Id,
            BranchId = teacher.BranchId,
            EmployeeCode = teacher.EmployeeCode,
            FullName = teacher.FullName,
            Designation = teacher.Designation,
            Department = teacher.Department,
            Qualification = teacher.Qualification,
            Email = teacher.Email,
            Phone = teacher.Phone,
            JoiningDate = teacher.JoiningDate,
            Status = teacher.Status,
            Avatar = teacher.Avatar,
            AssignedSubjects = request.AssignedSubjects ?? new List<string>()
        };

        return (dto, null);
    }

    public async Task<(TeacherDto? Teacher, string? Error)> UpdateTeacherAsync(string id, UpdateTeacherRequest request)
    {
        var teacher = await _context.Teachers.FindAsync(id);
        if (teacher == null) return (null, "Teacher not found");

        var codeExists = await _context.Teachers.AnyAsync(t => t.Id != id && t.EmployeeCode.ToLower() == request.EmployeeCode.Trim().ToLower());
        if (codeExists)
        {
            return (null, $"Teacher with employee code '{request.EmployeeCode}' already exists.");
        }

        teacher.EmployeeCode = request.EmployeeCode.Trim();
        teacher.FullName = request.FullName.Trim();
        teacher.Designation = request.Designation.Trim();
        teacher.Department = request.Department.Trim();
        teacher.Qualification = request.Qualification.Trim();
        teacher.Email = request.Email.Trim();
        teacher.Phone = request.Phone.Trim();
        teacher.JoiningDate = DateTime.SpecifyKind(request.JoiningDate, DateTimeKind.Utc);
        teacher.Status = request.Status;
        if (!string.IsNullOrWhiteSpace(request.Avatar)) teacher.Avatar = request.Avatar;
        teacher.AssignedSubjectsJson = JsonSerializer.Serialize(request.AssignedSubjects ?? new List<string>());
        teacher.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var dto = new TeacherDto
        {
            Id = teacher.Id,
            BranchId = teacher.BranchId,
            EmployeeCode = teacher.EmployeeCode,
            FullName = teacher.FullName,
            Designation = teacher.Designation,
            Department = teacher.Department,
            Qualification = teacher.Qualification,
            Email = teacher.Email,
            Phone = teacher.Phone,
            JoiningDate = teacher.JoiningDate,
            Status = teacher.Status,
            Avatar = teacher.Avatar,
            AssignedSubjects = request.AssignedSubjects ?? new List<string>()
        };

        return (dto, null);
    }

    public async Task<bool> DeleteTeacherAsync(string id)
    {
        var teacher = await _context.Teachers.FindAsync(id);
        if (teacher == null) return false;

        _context.Teachers.Remove(teacher);
        await _context.SaveChangesAsync();
        return true;
    }

    private static List<string> DeserializeSubjects(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new List<string>();
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }
}
