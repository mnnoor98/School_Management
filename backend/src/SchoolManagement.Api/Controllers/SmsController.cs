using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.System.DTOs;
using SchoolManagement.Application.System.Services;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class SmsController : ControllerBase
{
    private readonly ISmsService _smsService;
    private readonly ICurrentUserService _currentUser;

    public SmsController(ISmsService smsService, ICurrentUserService currentUser)
    {
        _smsService = smsService;
        _currentUser = currentUser;
    }

    [HttpGet("templates")]
    public async Task<ActionResult<ApiResponse<List<SmsTemplateDto>>>> GetTemplates()
    {
        var list = await _smsService.GetTemplatesAsync();
        return Ok(ApiResponse<List<SmsTemplateDto>>.Ok(list));
    }

    [HttpPost("templates")]
    public async Task<ActionResult<ApiResponse<SmsTemplateDto>>> CreateTemplate([FromBody] CreateSmsTemplateRequest req)
    {
        var (template, error) = await _smsService.CreateTemplateAsync(req);
        if (!string.IsNullOrEmpty(error)) return BadRequest(ApiResponse<SmsTemplateDto>.Fail(error));

        return Ok(ApiResponse<SmsTemplateDto>.Ok(template!, "Template created successfully"));
    }

    [HttpDelete("templates/{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteTemplate(string id)
    {
        var deleted = await _smsService.DeleteTemplateAsync(id);
        if (!deleted) return NotFound(ApiResponse<bool>.Fail("Template not found"));

        return Ok(ApiResponse<bool>.Ok(true, "Template deleted"));
    }

    [HttpGet("logs")]
    public async Task<ActionResult<ApiResponse<List<SmsDispatchLogDto>>>> GetLogs([FromQuery] string? search)
    {
        var list = await _smsService.GetLogsAsync(search);
        return Ok(ApiResponse<List<SmsDispatchLogDto>>.Ok(list));
    }

    [HttpPost("dispatch")]
    public async Task<ActionResult<ApiResponse<SmsDispatchLogDto>>> DispatchSms([FromBody] SendSmsDispatchRequest req)
    {
        var (log, error) = await _smsService.DispatchSmsAsync(req, _currentUser.Username, _currentUser.RoleName);
        if (!string.IsNullOrEmpty(error)) return BadRequest(ApiResponse<SmsDispatchLogDto>.Fail(error));

        return Ok(ApiResponse<SmsDispatchLogDto>.Ok(log!, "SMS broadcast dispatched successfully"));
    }
}
