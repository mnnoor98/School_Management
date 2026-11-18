using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Academic.DTOs;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Academic.Services;

public class AcademicService : IAcademicService
{
    private readonly IApplicationDbContext _context;
    private readonly ICampusCacheService _cache;

    public AcademicService(IApplicationDbContext context, ICampusCacheService cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<List<AcademicYearDto>> GetAcademicYearsAsync()
    {
        return await _cache.GetOrCreateAsync("academic_years", async () =>
        {
            var list = await _context.AcademicYears
                .AsNoTracking()
                .Select(y => new AcademicYearDto
                {
                    Id = y.Id,
                    BranchId = y.BranchId,
                    Name = y.Name,
                    StartDate = y.StartDate,
                    EndDate = y.EndDate,
                    IsCurrent = y.IsCurrent,
                    IsLocked = y.IsLocked
                })
                .ToListAsync();

            if (list.Count == 0)
            {
                list = await _context.AcademicYears
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .OrderByDescending(y => y.StartDate)
                    .Select(y => new AcademicYearDto
                    {
                        Id = y.Id,
                        BranchId = y.BranchId,
                        Name = y.Name,
                        StartDate = y.StartDate,
                        EndDate = y.EndDate,
                        IsCurrent = y.IsCurrent,
                        IsLocked = y.IsLocked
                    })
                    .ToListAsync();
            }

            return list;
        });
    }

    public async Task<List<SchoolClassDto>> GetClassesAsync()
    {
        return await _cache.GetOrCreateAsync("classes", async () =>
        {
            return await _context.Classes
                .AsNoTracking()
                .Include(c => c.Sections)
                .OrderBy(c => c.SortOrder)
                .Select(c => new SchoolClassDto
                {
                    Id = c.Id,
                    BranchId = c.BranchId,
                    Name = c.Name,
                    Code = c.Code,
                    SortOrder = c.SortOrder,
                    IsActive = c.IsActive,
                    SectionCount = c.Sections.Count,
                    StudentCount = _context.Students.Count(s => s.ClassId == c.Id)
                })
                .ToListAsync();
        });
    }

    public async Task<List<SectionDto>> GetSectionsAsync(string? classId)
    {
        var cacheKey = string.IsNullOrEmpty(classId) ? "sections_all" : $"sections_{classId}";
        return await _cache.GetOrCreateAsync(cacheKey, async () =>
        {
            var query = _context.Sections.AsNoTracking().AsQueryable();
            if (!string.IsNullOrEmpty(classId))
            {
                query = query.Where(s => s.ClassId == classId);
            }

            return await query
                .Select(s => new SectionDto
                {
                    Id = s.Id,
                    BranchId = s.BranchId,
                    ClassId = s.ClassId,
                    ClassName = s.ClassName,
                    Name = s.Name,
                    Capacity = s.Capacity,
                    CurrentStudentCount = _context.Students.Count(st => st.SectionId == s.Id),
                    ClassTeacherId = s.ClassTeacherId,
                    ClassTeacherName = s.ClassTeacherName
                })
                .ToListAsync();
        });
    }

    public async Task<List<SubjectDto>> GetSubjectsAsync(string? classId)
    {
        return await _cache.GetOrCreateAsync("subjects_all", async () =>
        {
            var query = _context.Subjects.AsNoTracking().AsQueryable();

            return await query
                .Select(s => new SubjectDto
                {
                    Id = s.Id,
                    BranchId = s.BranchId,
                    Code = s.Code,
                    Name = s.Name,
                    Type = s.Type,
                    FullMarks = s.FullMarks,
                    PassMarks = s.PassMarks
                })
                .ToListAsync();
        });
    }

    public async Task<List<RoutinePeriodDto>> GetRoutinesAsync(string? classId, string? sectionId, string? dayOfWeek)
    {
        var query = _context.RoutinePeriods.AsNoTracking().AsQueryable();

        if (!string.IsNullOrEmpty(classId)) query = query.Where(r => r.ClassId == classId);
        if (!string.IsNullOrEmpty(sectionId)) query = query.Where(r => r.SectionId == sectionId);
        if (!string.IsNullOrEmpty(dayOfWeek)) query = query.Where(r => r.Day == dayOfWeek);

        return await query
            .OrderBy(r => r.PeriodNumber)
            .Select(r => new RoutinePeriodDto
            {
                Id = r.Id,
                BranchId = r.BranchId,
                Day = r.Day,
                PeriodNumber = r.PeriodNumber,
                StartTime = r.StartTime,
                EndTime = r.EndTime,
                ClassId = r.ClassId,
                ClassName = r.ClassName,
                SectionId = r.SectionId,
                SectionName = r.SectionName,
                SubjectId = r.SubjectId,
                SubjectName = r.SubjectName,
                TeacherId = r.TeacherId,
                TeacherName = r.TeacherName,
                RoomNo = r.RoomNo
            })
            .ToListAsync();
    }

    public async Task<List<RoutinePeriodDto>> GetRoutineTimetableAsync(string? classId, string? sectionId)
    {
        return await GetRoutinesAsync(classId, sectionId, null);
    }

    public async Task<(SchoolClassDto? Class, string? Error)> CreateClassAsync(CreateSchoolClassRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Code))
            return (null, "Name and code are required");

        var exists = await _context.Classes.AnyAsync(c => c.Code.ToLower() == request.Code.Trim().ToLower());
        if (exists)
            return (null, "Class code already exists");

        var entity = new SchoolClass
        {
            Name = request.Name.Trim(),
            Code = request.Code.Trim(),
            SortOrder = request.SortOrder,
            IsActive = request.IsActive ?? true
        };

        _context.Classes.Add(entity);
        await _context.SaveChangesAsync();
        _cache.Remove("classes");

        var dto = new SchoolClassDto
        {
            Id = entity.Id,
            BranchId = entity.BranchId,
            Name = entity.Name,
            Code = entity.Code,
            SortOrder = entity.SortOrder,
            IsActive = entity.IsActive,
            SectionCount = 0,
            StudentCount = 0
        };

        return (dto, null);
    }

    public async Task<(SchoolClassDto? Class, string? Error)> UpdateClassAsync(string id, UpdateSchoolClassRequest request)
    {
        var entity = await _context.Classes.Include(c => c.Sections).FirstOrDefaultAsync(c => c.Id == id);
        if (entity == null) return (null, "Class not found");

        if (!string.IsNullOrWhiteSpace(request.Code))
        {
            var exists = await _context.Classes.AnyAsync(c => c.Id != id && c.Code.ToLower() == request.Code.Trim().ToLower());
            if (exists) return (null, "Class code already exists");
            entity.Code = request.Code.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            entity.Name = request.Name.Trim();
        }

        if (request.SortOrder.HasValue)
        {
            entity.SortOrder = request.SortOrder.Value;
        }

        if (request.IsActive.HasValue)
        {
            entity.IsActive = request.IsActive.Value;
        }

        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        _cache.Remove("classes");

        var dto = new SchoolClassDto
        {
            Id = entity.Id,
            BranchId = entity.BranchId,
            Name = entity.Name,
            Code = entity.Code,
            SortOrder = entity.SortOrder,
            IsActive = entity.IsActive,
            SectionCount = entity.Sections.Count,
            StudentCount = _context.Students.Count(s => s.ClassId == entity.Id)
        };

        return (dto, null);
    }

    public async Task<bool> DeleteClassAsync(string id)
    {
        var entity = await _context.Classes.FindAsync(id);
        if (entity == null) return false;

        _context.Classes.Remove(entity);
        await _context.SaveChangesAsync();
        _cache.Remove("classes");
        return true;
    }

    public async Task<(SectionDto? Section, string? Error)> CreateSectionAsync(CreateSectionRequest request)
    {
        var parentClass = await _context.Classes.FindAsync(request.ClassId);
        if (parentClass == null) return (null, "Parent class not found");

        var entity = new Section
        {
            ClassId = request.ClassId,
            ClassName = parentClass.Name,
            Name = request.Name.Trim(),
            Capacity = request.Capacity,
            ClassTeacherId = request.ClassTeacherId,
            ClassTeacherName = request.ClassTeacherName
        };

        _context.Sections.Add(entity);
        await _context.SaveChangesAsync();
        _cache.Remove("classes");
        _cache.Remove("sections_all");
        _cache.Remove($"sections_{request.ClassId}");

        var dto = new SectionDto
        {
            Id = entity.Id,
            BranchId = entity.BranchId,
            ClassId = entity.ClassId,
            ClassName = entity.ClassName,
            Name = entity.Name,
            Capacity = entity.Capacity,
            CurrentStudentCount = 0,
            ClassTeacherId = entity.ClassTeacherId,
            ClassTeacherName = entity.ClassTeacherName
        };

        return (dto, null);
    }

    public async Task<(SectionDto? Section, string? Error)> UpdateSectionAsync(string id, UpdateSectionRequest request)
    {
        var entity = await _context.Sections.FindAsync(id);
        if (entity == null) return (null, "Section not found");

        entity.Name = request.Name.Trim();
        entity.Capacity = request.Capacity;
        entity.ClassTeacherId = request.ClassTeacherId;
        entity.ClassTeacherName = request.ClassTeacherName;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        _cache.Remove("sections_all");
        _cache.Remove($"sections_{entity.ClassId}");

        var dto = new SectionDto
        {
            Id = entity.Id,
            BranchId = entity.BranchId,
            ClassId = entity.ClassId,
            ClassName = entity.ClassName,
            Name = entity.Name,
            Capacity = entity.Capacity,
            CurrentStudentCount = _context.Students.Count(s => s.SectionId == entity.Id),
            ClassTeacherId = entity.ClassTeacherId,
            ClassTeacherName = entity.ClassTeacherName
        };

        return (dto, null);
    }

    public async Task<bool> DeleteSectionAsync(string id)
    {
        var entity = await _context.Sections.FindAsync(id);
        if (entity == null) return false;

        var classId = entity.ClassId;
        _context.Sections.Remove(entity);
        await _context.SaveChangesAsync();
        _cache.Remove("classes");
        _cache.Remove("sections_all");
        _cache.Remove($"sections_{classId}");
        return true;
    }

    public async Task<(SubjectDto? Subject, string? Error)> CreateSubjectAsync(CreateSubjectRequest request)
    {
        var entity = new Subject
        {
            Code = request.Code.Trim(),
            Name = request.Name.Trim(),
            Type = request.Type,
            FullMarks = request.FullMarks,
            PassMarks = request.PassMarks
        };

        _context.Subjects.Add(entity);
        await _context.SaveChangesAsync();
        _cache.Remove("subjects_all");

        var dto = new SubjectDto
        {
            Id = entity.Id,
            BranchId = entity.BranchId,
            Code = entity.Code,
            Name = entity.Name,
            Type = entity.Type,
            FullMarks = entity.FullMarks,
            PassMarks = entity.PassMarks
        };

        return (dto, null);
    }

    public async Task<(SubjectDto? Subject, string? Error)> UpdateSubjectAsync(string id, UpdateSubjectRequest request)
    {
        var entity = await _context.Subjects.FindAsync(id);
        if (entity == null) return (null, "Subject not found");

        entity.Name = request.Name.Trim();
        entity.Type = request.Type;
        entity.FullMarks = request.FullMarks;
        entity.PassMarks = request.PassMarks;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        _cache.Remove("subjects_all");

        var dto = new SubjectDto
        {
            Id = entity.Id,
            BranchId = entity.BranchId,
            Code = entity.Code,
            Name = entity.Name,
            Type = entity.Type,
            FullMarks = entity.FullMarks,
            PassMarks = entity.PassMarks
        };

        return (dto, null);
    }

    public async Task<bool> DeleteSubjectAsync(string id)
    {
        var entity = await _context.Subjects.FindAsync(id);
        if (entity == null) return false;

        _context.Subjects.Remove(entity);
        await _context.SaveChangesAsync();
        _cache.Remove("subjects_all");
        return true;
    }

    public async Task<RoutinePeriodDto> CreateRoutineAsync(RoutinePeriodDto request)
    {
        var entity = new RoutinePeriod
        {
            Day = request.Day,
            PeriodNumber = request.PeriodNumber,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            ClassId = request.ClassId,
            ClassName = request.ClassName,
            SectionId = request.SectionId,
            SectionName = request.SectionName,
            SubjectId = request.SubjectId,
            SubjectName = request.SubjectName,
            TeacherId = request.TeacherId,
            TeacherName = request.TeacherName,
            RoomNo = request.RoomNo
        };

        _context.RoutinePeriods.Add(entity);
        await _context.SaveChangesAsync();

        request.Id = entity.Id;
        return request;
    }

    public async Task<bool> SaveRoutinesAsync(List<RoutinePeriodDto> periods)
    {
        if (periods == null || periods.Count == 0) return true;

        var first = periods[0];
        var existing = await _context.RoutinePeriods
            .Where(r => r.ClassId == first.ClassId && r.SectionId == first.SectionId)
            .ToListAsync();

        _context.RoutinePeriods.RemoveRange(existing);

        foreach (var p in periods)
        {
            _context.RoutinePeriods.Add(new RoutinePeriod
            {
                Day = p.Day,
                PeriodNumber = p.PeriodNumber,
                StartTime = p.StartTime,
                EndTime = p.EndTime,
                ClassId = p.ClassId,
                ClassName = p.ClassName,
                SectionId = p.SectionId,
                SectionName = p.SectionName,
                SubjectId = p.SubjectId,
                SubjectName = p.SubjectName,
                TeacherId = p.TeacherId,
                TeacherName = p.TeacherName,
                RoomNo = p.RoomNo
            });
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteRoutinePeriodAsync(string id)
    {
        var period = await _context.RoutinePeriods.FindAsync(id);
        if (period == null) return false;

        _context.RoutinePeriods.Remove(period);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<ClassSubjectMappingDto>> GetClassSubjectsAsync(string classId)
    {
        var mappings = await _context.ClassSubjectMappings
            .AsNoTracking()
            .Where(m => m.ClassId == classId)
            .ToListAsync();

        var subjects = await _context.Subjects.AsNoTracking().ToListAsync();
        var subjectDict = subjects.ToDictionary(s => s.Id);

        return mappings.Select(m =>
        {
            subjectDict.TryGetValue(m.SubjectId, out var sub);
            return new ClassSubjectMappingDto
            {
                Id = m.Id,
                BranchId = m.BranchId,
                ClassId = m.ClassId,
                ClassName = m.ClassName,
                SubjectId = m.SubjectId,
                SubjectName = sub?.Name ?? m.SubjectName,
                SubjectCode = sub?.Code,
                SubjectType = sub?.Type ?? "Compulsory",
                FullMarks = sub?.FullMarks ?? 100,
                PassMarks = sub?.PassMarks ?? 33,
                TeacherId = m.TeacherId,
                TeacherName = m.TeacherName
            };
        }).ToList();
    }

    public async Task<bool> AssignClassSubjectsAsync(string classId, List<string> subjectIds)
    {
        var schoolClass = await _context.Classes.FindAsync(classId);
        if (schoolClass == null) return false;

        var existing = await _context.ClassSubjectMappings
            .Where(m => m.ClassId == classId)
            .ToListAsync();

        _context.ClassSubjectMappings.RemoveRange(existing);

        if (subjectIds != null && subjectIds.Count > 0)
        {
            var subjects = await _context.Subjects
                .Where(s => subjectIds.Contains(s.Id))
                .ToListAsync();

            foreach (var sub in subjects)
            {
                _context.ClassSubjectMappings.Add(new ClassSubjectMapping
                {
                    Id = "csm-" + Guid.NewGuid().ToString("N")[..8],
                    SchoolId = schoolClass.SchoolId,
                    BranchId = schoolClass.BranchId,
                    ClassId = schoolClass.Id,
                    ClassName = schoolClass.Name,
                    SubjectId = sub.Id,
                    SubjectName = sub.Name,
                    TeacherId = string.Empty,
                    TeacherName = string.Empty,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }
}
