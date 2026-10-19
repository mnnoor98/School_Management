using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.System.DTOs;
using SchoolManagement.Domain.System;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class NoticesController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public NoticesController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<NoticeDto>>>> GetNotices()
    {
        var notices = await _context.Notices
            .AsNoTracking()
            .OrderByDescending(n => n.PublishedDate)
            .Select(n => new NoticeDto
            {
                Id = n.Id,
                Title = n.Title,
                Category = n.Category,
                TargetAudience = n.TargetAudience,
                PublishedDate = n.PublishedDate,
                Content = n.Content,
                IsImportant = n.IsImportant,
                Author = n.Author
            })
            .ToListAsync();

        return Ok(ApiResponse<List<NoticeDto>>.Ok(notices));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<NoticeDto>>> CreateNotice([FromBody] NoticeDto request)
    {
        var notice = new Notice
        {
            Title = request.Title,
            Category = request.Category,
            TargetAudience = request.TargetAudience,
            PublishedDate = DateTime.UtcNow,
            Content = request.Content,
            IsImportant = request.IsImportant,
            Author = request.Author
        };

        _context.Notices.Add(notice);
        await _context.SaveChangesAsync();

        request.Id = notice.Id;
        request.PublishedDate = notice.PublishedDate;

        return Ok(ApiResponse<NoticeDto>.Ok(request, "Notice published successfully"));
    }
}
