using SchoolManagement.Application.Exams.DTOs;

namespace SchoolManagement.Application.Exams.Services;

public interface IExamService
{
    Task<List<ExamDto>> GetExamsAsync();
    Task<ExamDto?> GetExamByIdAsync(string id);
    Task<ExamDto> CreateExamAsync(ExamCreateRequest request);
    Task<ExamDto?> UpdateExamAsync(string id, ExamUpdateRequest request);
    Task<bool> DeleteExamAsync(string id);

    Task<List<ExamMarkDto>> GetMarksAsync(string examId, string? classId, string? sectionId, string? subjectId, List<string>? allowedStudentIds = null);
    Task<bool> SaveMarksAsync(SaveExamMarksRequest request);
    Task<byte[]> GenerateMarksTemplateAsync(string examId, string classId, string? sectionId, string subjectId);
    Task<(int Count, List<string> Errors)> BulkUploadMarksAsync(string examId, string classId, string? sectionId, string subjectId, Stream stream);
    Task<StudentMarksheetDto?> GetStudentMarksheetAsync(string examId, string studentId);
    Task<List<StudentMarksheetDto>> GetClassMarksheetAsync(string examId, string classId, string sectionId, List<string>? allowedStudentIds = null);

    Task<List<ExamScheduleItemDto>> GetSchedulesAsync(string? examId, string? classId);
    Task<ExamScheduleItemDto?> GetScheduleByIdAsync(string id);
    Task<ExamScheduleItemDto> CreateScheduleAsync(CreateExamScheduleRequest req);
    Task<bool> DeleteScheduleAsync(string id);

    Task<List<AdmitCardDto>> GetAdmitCardsAsync(string examId, string? classId, string? sectionId, string? studentId);
}
