using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.System.DTOs;
using SchoolManagement.Domain.System;

namespace SchoolManagement.Application.System.Services;

public class SmsService : ISmsService
{
    private readonly IApplicationDbContext _context;

    public SmsService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<SmsTemplateDto>> GetTemplatesAsync()
    {
        return await _context.SmsTemplates
            .AsNoTracking()
            .OrderBy(t => t.Category)
            .ThenBy(t => t.Title)
            .Select(t => new SmsTemplateDto
            {
                Id = t.Id,
                BranchId = t.BranchId,
                Title = t.Title,
                Category = t.Category,
                Content = t.Content
            })
            .ToListAsync();
    }

    public async Task<(SmsTemplateDto? Template, string? Error)> CreateTemplateAsync(CreateSmsTemplateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Content))
            return (null, "Title and Content are required");

        var template = new SmsTemplate
        {
            Title = request.Title.Trim(),
            Category = request.Category,
            Content = request.Content.Trim()
        };

        _context.SmsTemplates.Add(template);
        await _context.SaveChangesAsync();

        var dto = new SmsTemplateDto
        {
            Id = template.Id,
            BranchId = template.BranchId,
            Title = template.Title,
            Category = template.Category,
            Content = template.Content
        };

        return (dto, null);
    }

    public async Task<bool> DeleteTemplateAsync(string id)
    {
        var template = await _context.SmsTemplates.FindAsync(id);
        if (template == null) return false;

        _context.SmsTemplates.Remove(template);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<SmsDispatchLogDto>> GetLogsAsync(string? search)
    {
        var query = _context.SmsDispatchLogs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(l => l.RecipientGroup.ToLower().Contains(q) ||
                                     l.Message.ToLower().Contains(q) ||
                                     l.SenderName.ToLower().Contains(q));
        }

        return await query
            .OrderByDescending(l => l.SentAt)
            .Select(l => new SmsDispatchLogDto
            {
                Id = l.Id,
                BranchId = l.BranchId,
                RecipientGroup = l.RecipientGroup,
                RecipientCount = l.RecipientCount,
                Message = l.Message,
                SenderName = l.SenderName,
                SentAt = l.SentAt,
                Status = l.Status,
                CreditsUsed = l.CreditsUsed
            })
            .ToListAsync();
    }

    public async Task<(SmsDispatchLogDto? Log, string? Error)> DispatchSmsAsync(SendSmsDispatchRequest request, string? username, string? roleName)
    {
        if (string.IsNullOrWhiteSpace(request.RecipientGroup) || string.IsNullOrWhiteSpace(request.Message))
            return (null, "Recipient group and Message are required");

        var count = Math.Max(1, request.RecipientCount);
        var credits = (int)Math.Ceiling((double)request.Message.Length / 160) * count;

        var log = new SmsDispatchLog
        {
            RecipientGroup = request.RecipientGroup.Trim(),
            RecipientCount = count,
            Message = request.Message.Trim(),
            SenderName = username ?? "Principal Office",
            SentAt = DateTime.UtcNow,
            Status = "Delivered",
            CreditsUsed = credits
        };

        _context.SmsDispatchLogs.Add(log);

        _context.AuditLogs.Add(new AuditLog
        {
            Timestamp = DateTime.UtcNow,
            UserName = username ?? "Administrator",
            UserRole = roleName ?? "Staff",
            Action = "Create",
            Module = "SMS Dispatch",
            TargetRecord = request.RecipientGroup,
            Details = $"Dispatched SMS broadcast to {request.RecipientGroup} ({count} recipients, {credits} credits)",
            SchoolScope = log.BranchId
        });

        await _context.SaveChangesAsync();

        var dto = new SmsDispatchLogDto
        {
            Id = log.Id,
            BranchId = log.BranchId,
            RecipientGroup = log.RecipientGroup,
            RecipientCount = log.RecipientCount,
            Message = log.Message,
            SenderName = log.SenderName,
            SentAt = log.SentAt,
            Status = log.Status,
            CreditsUsed = log.CreditsUsed
        };

        return (dto, null);
    }
}
