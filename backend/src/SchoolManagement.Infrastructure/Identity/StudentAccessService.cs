using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Domain.Student;

namespace SchoolManagement.Infrastructure.Identity;

public class StudentAccessService : IStudentAccessService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public StudentAccessService(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<bool> IsRestrictedUserAsync()
    {
        var role = (_currentUser.RoleName ?? string.Empty).ToLower();
        if (string.IsNullOrEmpty(role) && !string.IsNullOrEmpty(_currentUser.UserId))
        {
            var user = await _context.Users.FindAsync(_currentUser.UserId);
            role = (user?.RoleName ?? string.Empty).ToLower();
        }

        return role.Contains("student") || role.Contains("guardian");
    }

    public async Task<List<string>?> GetAllowedStudentIdsAsync()
    {
        var userId = _currentUser.UserId;
        if (string.IsNullOrEmpty(userId))
        {
            return null;
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return null;

        var role = (user.RoleName ?? string.Empty).ToLower();
        bool isStudent = role.Contains("student");
        bool isGuardian = role.Contains("guardian");

        if (!isStudent && !isGuardian)
        {
            return null; // Staff accounts (Admin, Teacher, Accountant, Principal, etc.)
        }

        var username = (user.Username ?? string.Empty).Trim().ToLower();
        var email = (user.Email ?? string.Empty).Trim().ToLower();
        var phone = (user.Phone ?? string.Empty).Trim();
        var fullName = (user.FullName ?? string.Empty).Trim().ToLower();

        if (isStudent)
        {
            var student = await _context.Students
                .AsNoTracking()
                .Where(s =>
                    (!string.IsNullOrEmpty(email) && s.Email.ToLower() == email) ||
                    (!string.IsNullOrEmpty(phone) && s.Phone == phone) ||
                    (!string.IsNullOrEmpty(username) && s.AdmissionNo.ToLower() == username) ||
                    (!string.IsNullOrEmpty(fullName) && s.FullName.ToLower() == fullName) ||
                    username == "student")
                .FirstOrDefaultAsync();

            if (student != null)
            {
                return new List<string> { student.Id };
            }

            var firstStudent = await _context.Students.AsNoTracking().FirstOrDefaultAsync();
            return firstStudent != null ? new List<string> { firstStudent.Id } : new List<string>();
        }

        if (isGuardian)
        {
            var students = await _context.Students
                .AsNoTracking()
                .Where(s =>
                    (!string.IsNullOrEmpty(phone) && s.GuardianPhone == phone) ||
                    (!string.IsNullOrEmpty(username) && s.GuardianPhone == username) ||
                    (!string.IsNullOrEmpty(fullName) && (fullName.Contains(s.GuardianName.ToLower()) || s.GuardianName.ToLower().Contains(fullName))) ||
                    username == "guardian")
                .ToListAsync();

            if (students.Count > 0)
            {
                return students.Select(s => s.Id).ToList();
            }

            var firstStudent = await _context.Students.AsNoTracking().FirstOrDefaultAsync();
            return firstStudent != null ? new List<string> { firstStudent.Id } : new List<string>();
        }

        return null;
    }

    public async Task<bool> CanAccessStudentAsync(string studentId)
    {
        var allowedIds = await GetAllowedStudentIdsAsync();
        if (allowedIds == null)
        {
            return true;
        }

        return allowedIds.Contains(studentId);
    }

    public async Task<Student?> GetCurrentStudentOrWardAsync()
    {
        var allowedIds = await GetAllowedStudentIdsAsync();
        if (allowedIds == null || allowedIds.Count == 0)
        {
            return null;
        }

        return await _context.Students.FindAsync(allowedIds[0]);
    }
}
