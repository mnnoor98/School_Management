using SchoolManagement.Application.Academic.DTOs;

namespace SchoolManagement.Application.Academic.Services;

public interface IAcademicService
{
    Task<List<AcademicYearDto>> GetAcademicYearsAsync();
    Task<List<SchoolClassDto>> GetClassesAsync();
    Task<List<SectionDto>> GetSectionsAsync(string? classId);
    Task<List<SubjectDto>> GetSubjectsAsync(string? classId);
    Task<List<RoutinePeriodDto>> GetRoutinesAsync(string? classId, string? sectionId, string? dayOfWeek);
    Task<List<RoutinePeriodDto>> GetRoutineTimetableAsync(string? classId, string? sectionId);

    Task<(SchoolClassDto? Class, string? Error)> CreateClassAsync(CreateSchoolClassRequest request);
    Task<(SchoolClassDto? Class, string? Error)> UpdateClassAsync(string id, UpdateSchoolClassRequest request);
    Task<bool> DeleteClassAsync(string id);

    Task<(SectionDto? Section, string? Error)> CreateSectionAsync(CreateSectionRequest request);
    Task<(SectionDto? Section, string? Error)> UpdateSectionAsync(string id, UpdateSectionRequest request);
    Task<bool> DeleteSectionAsync(string id);

    Task<(SubjectDto? Subject, string? Error)> CreateSubjectAsync(CreateSubjectRequest request);
    Task<(SubjectDto? Subject, string? Error)> UpdateSubjectAsync(string id, UpdateSubjectRequest request);
    Task<bool> DeleteSubjectAsync(string id);

    Task<RoutinePeriodDto> CreateRoutineAsync(RoutinePeriodDto request);
    Task<bool> SaveRoutinesAsync(List<RoutinePeriodDto> periods);
    Task<bool> DeleteRoutinePeriodAsync(string id);

    Task<List<ClassSubjectMappingDto>> GetClassSubjectsAsync(string classId);
    Task<bool> AssignClassSubjectsAsync(string classId, List<string> subjectIds);
}
