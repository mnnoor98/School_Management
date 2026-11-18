using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.System.DTOs;
using SchoolManagement.Application.System.Services;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/audit-logs")]
[Authorize]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;

    public AuditLogsController(IAuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<AuditLogDto>>>> GetAuditLogs()
    {
        var logs = await _auditLogService.GetAuditLogsAsync(100);
        return Ok(ApiResponse<List<AuditLogDto>>.Ok(logs));
    }
}
