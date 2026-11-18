using SchoolManagement.Application.School.DTOs;
using SchoolManagement.Domain.School;

namespace SchoolManagement.Application.School.Services;

public interface ISchoolService
{
    Task<(SchoolEntity? School, List<Branch> Branches, List<AcademicYear> AcademicYears)> GetSchoolProfileAsync();
    Task<SchoolEntity> UpdateSchoolAsync(SchoolUpdateRequest request);
    Task<(Branch? Branch, string? Error)> AddBranchAsync(BranchCreateRequest request);
    Task<(Branch? Branch, string? Error)> UpdateBranchAsync(string id, BranchUpdateRequest request);
    Task<(Branch? Branch, string? Error)> ToggleBranchAsync(string id);
    Task<AcademicYear> AddAcademicYearAsync(AcademicYearCreateRequest request);
    Task<(AcademicYear? AcademicYear, string? Error)> ToggleAcademicYearLockAsync(string id);
    Task<(AcademicYear? AcademicYear, string? Error)> SetCurrentAcademicYearAsync(string id);
}
