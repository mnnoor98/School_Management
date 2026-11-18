using SchoolManagement.Application.System.DTOs;

namespace SchoolManagement.Application.System.Services;

public interface ISmsService
{
    Task<List<SmsTemplateDto>> GetTemplatesAsync();
    Task<(SmsTemplateDto? Template, string? Error)> CreateTemplateAsync(CreateSmsTemplateRequest request);
    Task<bool> DeleteTemplateAsync(string id);
    Task<List<SmsDispatchLogDto>> GetLogsAsync(string? search);
    Task<(SmsDispatchLogDto? Log, string? Error)> DispatchSmsAsync(SendSmsDispatchRequest request, string? username, string? roleName);
}
