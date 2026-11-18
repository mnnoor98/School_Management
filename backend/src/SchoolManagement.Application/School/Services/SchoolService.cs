using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.School.DTOs;
using SchoolManagement.Domain.Auth;
using SchoolManagement.Domain.School;

namespace SchoolManagement.Application.School.Services;

public class SchoolService : ISchoolService
{
    private readonly IApplicationDbContext _context;
    private readonly ICampusContext _campusContext;

    public SchoolService(IApplicationDbContext context, ICampusContext campusContext)
    {
        _context = context;
        _campusContext = campusContext;
    }

    public async Task<(SchoolEntity? School, List<Branch> Branches, List<AcademicYear> AcademicYears)> GetSchoolProfileAsync()
    {
        var school = await _context.Schools.FirstOrDefaultAsync();
        var branches = await _context.Branches.OrderBy(b => b.Code).ToListAsync();
        var academicYears = await _context.AcademicYears.OrderByDescending(a => a.StartDate).ToListAsync();
        return (school, branches, academicYears);
    }

    public async Task<SchoolEntity> UpdateSchoolAsync(SchoolUpdateRequest request)
    {
        var school = await _context.Schools.FirstOrDefaultAsync();
        if (school == null)
        {
            school = new SchoolEntity
            {
                Id = "sch-01",
                Name = request.Name,
                Code = request.Code,
                Address = request.Address,
                Contact = request.Contact,
                Email = request.Email,
                Website = request.Website,
                Status = request.Status ?? "Active"
            };
            _context.Schools.Add(school);
        }
        else
        {
            school.Name = request.Name;
            school.Code = request.Code;
            school.Address = request.Address;
            school.Contact = request.Contact;
            school.Email = request.Email;
            school.Website = request.Website;
            if (!string.IsNullOrEmpty(request.Status)) school.Status = request.Status;
            school.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return school;
    }

    public async Task<(Branch? Branch, string? Error)> AddBranchAsync(BranchCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Code))
        {
            return (null, "Campus name and code are required.");
        }

        var normalizedCode = request.Code.ToUpper().Trim();
        var exists = await _context.Branches.AnyAsync(b => b.Code == normalizedCode);
        if (exists)
        {
            return (null, $"A campus with code '{normalizedCode}' already exists.");
        }

        var school = await _context.Schools.FirstOrDefaultAsync();
        var schoolId = school?.Id ?? "sch-01";

        var branch = new Branch
        {
            Id = "br-" + Guid.NewGuid().ToString("N").Substring(0, 6),
            SchoolId = schoolId,
            Code = normalizedCode,
            Name = request.Name.Trim(),
            Address = request.Address?.Trim() ?? string.Empty,
            Phone = request.Phone?.Trim() ?? string.Empty,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Branches.Add(branch);

        // If Head Teacher / Principal credentials provided, create user for this branch
        if (!string.IsNullOrWhiteSpace(request.PrincipalUsername) && !string.IsNullOrWhiteSpace(request.PrincipalFullName))
        {
            var principalUsername = request.PrincipalUsername.Trim().ToLower();
            var usernameTaken = await _context.Users.AnyAsync(u => u.Username.ToLower() == principalUsername);
            if (!usernameTaken)
            {
                var principalRole = await _context.Roles.FirstOrDefaultAsync(r => r.SchoolId == schoolId && (r.Code == "PRINCIPAL" || r.Name.Contains("Principal") || r.Name.Contains("Head Teacher")));
                if (principalRole == null)
                {
                    principalRole = new Role
                    {
                        Id = "role-principal-" + Guid.NewGuid().ToString("N").Substring(0, 6),
                        SchoolId = schoolId,
                        Code = "PRINCIPAL",
                        Name = "Principal / Head Teacher",
                        Description = "Campus Principal with campus-level administrative permissions",
                        IsSystem = false,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Roles.Add(principalRole);
                }
                var roleId = principalRole.Id;
                var roleName = principalRole.Name;

                var pwd = string.IsNullOrWhiteSpace(request.PrincipalPassword) ? "password123" : request.PrincipalPassword;
                var pwdHash = BCrypt.Net.BCrypt.HashPassword(pwd);

                var principalUser = new User
                {
                    Id = "usr-" + Guid.NewGuid().ToString("N").Substring(0, 8),
                    Username = principalUsername,
                    FullName = request.PrincipalFullName.Trim(),
                    Email = request.PrincipalEmail?.Trim() ?? $"{principalUsername}@scholarsacademy.edu.bd",
                    PasswordHash = pwdHash,
                    RoleId = roleId,
                    RoleName = roleName,
                    SchoolId = schoolId,
                    BranchId = branch.Id,
                    Avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
                    Phone = request.PrincipalPhone?.Trim() ?? "+880 1700-000000",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                principalUser.UserRoles.Add(new UserRole
                {
                    UserId = principalUser.Id,
                    RoleId = roleId,
                    SchoolId = schoolId
                });

                _context.Users.Add(principalUser);
            }
        }

        await _context.SaveChangesAsync();
        return (branch, null);
    }

    public async Task<(Branch? Branch, string? Error)> UpdateBranchAsync(string id, BranchUpdateRequest request)
    {
        var branch = await _context.Branches.FindAsync(id);
        if (branch == null) return (null, "Branch not found");

        branch.Name = request.Name.Trim();
        branch.Address = request.Address?.Trim() ?? string.Empty;
        branch.Phone = request.Phone?.Trim() ?? string.Empty;
        branch.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return (branch, null);
    }

    public async Task<(Branch? Branch, string? Error)> ToggleBranchAsync(string id)
    {
        var branch = await _context.Branches.FindAsync(id);
        if (branch == null) return (null, "Branch not found");

        branch.IsActive = !branch.IsActive;
        branch.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return (branch, null);
    }

    public async Task<AcademicYear> AddAcademicYearAsync(AcademicYearCreateRequest request)
    {
        var school = await _context.Schools.FirstOrDefaultAsync();
        var schoolId = !string.IsNullOrEmpty(_campusContext?.SchoolId) ? _campusContext.SchoolId : (school?.Id ?? "sch-01");
        var branchId = !string.IsNullOrEmpty(_campusContext?.BranchId) ? _campusContext.BranchId : "br-01";

        if (request.IsCurrent)
        {
            var existing = await _context.AcademicYears.ToListAsync();
            foreach (var ay in existing) ay.IsCurrent = false;
        }

        var year = new AcademicYear
        {
            Id = "ay-" + Guid.NewGuid().ToString("N").Substring(0, 6),
            SchoolId = schoolId,
            BranchId = branchId,
            Name = request.Name,
            StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc),
            EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc),
            IsCurrent = request.IsCurrent,
            IsLocked = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.AcademicYears.Add(year);
        await _context.SaveChangesAsync();
        return year;
    }

    public async Task<(AcademicYear? AcademicYear, string? Error)> ToggleAcademicYearLockAsync(string id)
    {
        var year = await _context.AcademicYears.FindAsync(id);
        if (year == null) return (null, "Academic year not found");

        year.IsLocked = !year.IsLocked;
        year.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return (year, null);
    }

    public async Task<(AcademicYear? AcademicYear, string? Error)> SetCurrentAcademicYearAsync(string id)
    {
        var year = await _context.AcademicYears.FindAsync(id);
        if (year == null) return (null, "Academic year not found");

        var all = await _context.AcademicYears.ToListAsync();
        foreach (var y in all)
        {
            y.IsCurrent = (y.Id == id);
            y.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return (year, null);
    }
}
