using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.System.DTOs;
using SchoolManagement.Domain.System;

namespace SchoolManagement.Application.System.Services;

public class NoticeService : INoticeService
{
    private readonly IApplicationDbContext _context;

    public NoticeService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<NoticeDto>> GetNoticesAsync()
    {
        return await _context.Notices
            .AsNoTracking()
            .OrderByDescending(n => n.PublishedDate)
            .Select(n => new NoticeDto
            {
                Id = n.Id,
                BranchId = n.BranchId,
                Title = n.Title,
                Category = n.Category,
                TargetAudience = n.TargetAudience,
                PublishedDate = n.PublishedDate,
                Content = n.Content,
                IsImportant = n.IsImportant,
                Author = n.Author
            })
            .ToListAsync();
    }

    public async Task<NoticeDto> CreateNoticeAsync(NoticeDto request)
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
        return request;
    }
}
