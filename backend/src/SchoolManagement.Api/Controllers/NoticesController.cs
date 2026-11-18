using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.System.DTOs;
using SchoolManagement.Application.System.Services;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class NoticesController : ControllerBase
{
    private readonly INoticeService _noticeService;

    public NoticesController(INoticeService noticeService)
    {
        _noticeService = noticeService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<NoticeDto>>>> GetNotices()
    {
        var notices = await _noticeService.GetNoticesAsync();
        return Ok(ApiResponse<List<NoticeDto>>.Ok(notices));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<NoticeDto>>> CreateNotice([FromBody] NoticeDto request)
    {
        var created = await _noticeService.CreateNoticeAsync(request);
        return Ok(ApiResponse<NoticeDto>.Ok(created, "Notice published successfully"));
    }
}
