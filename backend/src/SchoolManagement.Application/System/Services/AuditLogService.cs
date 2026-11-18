using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.System.DTOs;
using SchoolManagement.Domain.System;

namespace SchoolManagement.Application.System.Services;

public class AuditLogService : IAuditLogService
{
    private readonly IApplicationDbContext _context;

    public AuditLogService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<AuditLogDto>> GetAuditLogsAsync(int count = 100)
    {
        return await _context.AuditLogs
            .AsNoTracking()
            .OrderByDescending(a => a.Timestamp)
            .Take(count)
            .Select(a => new AuditLogDto
            {
                Id = a.Id,
                BranchId = a.BranchId,
                Timestamp = a.Timestamp,
                UserName = a.UserName,
                UserRole = a.UserRole,
                Action = a.Action,
                Module = a.Module,
                TargetRecord = a.TargetRecord,
                Details = a.Details,
                SchoolScope = a.SchoolScope
            })
            .ToListAsync();
    }

    public async Task LogActionAsync(string userName, string userRole, string action, string module, string targetRecord, string details, string? schoolScope = null)
    {
        _context.AuditLogs.Add(new AuditLog
        {
            Timestamp = DateTime.UtcNow,
            UserName = userName,
            UserRole = userRole,
            Action = action,
            Module = module,
            TargetRecord = targetRecord,
            Details = details,
            SchoolScope = schoolScope ?? ""
        });

        await _context.SaveChangesAsync();
    }

    public async Task<bool> PingDatabaseAsync()
    {
        try
        {
            return await _context.Schools.AsNoTracking().AnyAsync();
        }
        catch
        {
            return false;
        }
    }
}
