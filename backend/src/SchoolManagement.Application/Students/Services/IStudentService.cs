using SchoolManagement.Application.Students.DTOs;

namespace SchoolManagement.Application.Students.Services;

public interface IStudentService
{
    Task<List<StudentDto>> GetStudentsAsync(string? classId, string? sectionId, string? search, List<string>? allowedStudentIds = null);
    Task<StudentDto?> GetStudentByIdAsync(string id);
    Task<StudentDto> AdmitStudentAsync(AdmissionRequest request);
    Task<StudentDto?> UpdateStudentAsync(string id, UpdateStudentRequest request);
    Task<StudentDto?> UpdateStudentStatusAsync(string id, string status, string? reason);
    Task<bool> DeleteStudentAsync(string id);
    Task<bool> PromoteStudentAsync(string id, StudentPromotionRequest request);
    Task<int> BatchPromoteAsync(BatchStudentPromotionRequest request);
    byte[] DownloadImportTemplate();
    Task<(BulkImportResultDto? Result, string? Error)> BulkImportStudentsAsync(Stream stream, string fileName, string classId, string sectionId, string? academicYearId);
    Task<AdmissionLookupsDto> GetAdmissionLookupsAsync();
}
