using SchoolManagement.Application.System.DTOs;

namespace SchoolManagement.Application.System.Services;

public interface INoticeService
{
    Task<List<NoticeDto>> GetNoticesAsync();
    Task<NoticeDto> CreateNoticeAsync(NoticeDto request);
}
