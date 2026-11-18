using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.Employee.DTOs;
using SchoolManagement.Application.Employee.Services;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class PayrollController : ControllerBase
{
    private readonly IPayrollService _payrollService;
    private readonly ICurrentUserService _currentUser;

    public PayrollController(IPayrollService payrollService, ICurrentUserService currentUser)
    {
        _payrollService = payrollService;
        _currentUser = currentUser;
    }

    [HttpGet("structures")]
    public async Task<ActionResult<ApiResponse<List<SalaryStructureDto>>>> GetSalaryStructures()
    {
        var list = await _payrollService.GetSalaryStructuresAsync();
        return Ok(ApiResponse<List<SalaryStructureDto>>.Ok(list));
    }

    [HttpGet("structures/{teacherId}")]
    public async Task<ActionResult<ApiResponse<SalaryStructureDto>>> GetSalaryStructureByTeacherId(string teacherId)
    {
        var structure = await _payrollService.GetSalaryStructureByTeacherIdAsync(teacherId);
        if (structure == null) return NotFound(ApiResponse<SalaryStructureDto>.Fail("Salary structure not found for teacher."));
        return Ok(ApiResponse<SalaryStructureDto>.Ok(structure));
    }

    [HttpPost("structures")]
    public async Task<ActionResult<ApiResponse<SalaryStructureDto>>> UpsertSalaryStructure([FromBody] UpsertSalaryStructureRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TeacherId))
        {
            return BadRequest(ApiResponse<SalaryStructureDto>.Fail("TeacherId is required."));
        }

        try
        {
            var result = await _payrollService.UpsertSalaryStructureAsync(request);
            return Ok(ApiResponse<SalaryStructureDto>.Ok(result, "Salary structure configured successfully."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<SalaryStructureDto>.Fail(ex.Message));
        }
    }

    [HttpGet("sheets")]
    public async Task<ActionResult<ApiResponse<List<EmployeePayrollDto>>>> GetPayrolls(
        [FromQuery] string? monthYear,
        [FromQuery] string? status)
    {
        var targetMonth = string.IsNullOrWhiteSpace(monthYear) ? DateTime.UtcNow.ToString("yyyy-MM") : monthYear;
        var list = await _payrollService.GetPayrollsAsync(targetMonth, status);
        return Ok(ApiResponse<List<EmployeePayrollDto>>.Ok(list));
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<PayrollSummaryDto>>> GetPayrollSummary([FromQuery] string? monthYear)
    {
        var targetMonth = string.IsNullOrWhiteSpace(monthYear) ? DateTime.UtcNow.ToString("yyyy-MM") : monthYear;
        var summary = await _payrollService.GetPayrollSummaryAsync(targetMonth);
        return Ok(ApiResponse<PayrollSummaryDto>.Ok(summary));
    }

    [HttpPost("generate")]
    public async Task<ActionResult<ApiResponse<List<EmployeePayrollDto>>>> GenerateMonthlyPayroll([FromBody] GeneratePayrollRequest request)
    {
        var preparedBy = _currentUser.UserId ?? "admin";
        try
        {
            var list = await _payrollService.GenerateMonthlyPayrollAsync(request, preparedBy);
            return Ok(ApiResponse<List<EmployeePayrollDto>>.Ok(list, $"Generated payroll for {list.Count} campus staff/teachers."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<List<EmployeePayrollDto>>.Fail(ex.Message));
        }
    }

    [HttpPost("{id}/approve")]
    public async Task<ActionResult<ApiResponse<EmployeePayrollDto>>> ApprovePayroll(string id)
    {
        var approvedBy = _currentUser.UserId ?? "admin";
        var payroll = await _payrollService.ApprovePayrollAsync(id, approvedBy);
        if (payroll == null) return NotFound(ApiResponse<EmployeePayrollDto>.Fail("Payroll record not found."));
        return Ok(ApiResponse<EmployeePayrollDto>.Ok(payroll, "Payroll record approved successfully."));
    }

    [HttpPost("approve-month")]
    public async Task<ActionResult<ApiResponse<int>>> BatchApprovePayroll([FromBody] GeneratePayrollRequest request)
    {
        var targetMonth = string.IsNullOrWhiteSpace(request.SalaryMonthYear) ? DateTime.UtcNow.ToString("yyyy-MM") : request.SalaryMonthYear;
        var approvedBy = _currentUser.UserId ?? "admin";
        var count = await _payrollService.BatchApprovePayrollAsync(targetMonth, approvedBy);
        return Ok(ApiResponse<int>.Ok(count, $"Approved {count} payroll records for {targetMonth}."));
    }

    [HttpPost("{id}/disburse")]
    public async Task<ActionResult<ApiResponse<EmployeePayrollDto>>> DisbursePayroll(string id, [FromBody] DisbursePayrollRequest request)
    {
        var payroll = await _payrollService.DisbursePayrollAsync(id, request);
        if (payroll == null) return NotFound(ApiResponse<EmployeePayrollDto>.Fail("Payroll record not found."));
        return Ok(ApiResponse<EmployeePayrollDto>.Ok(payroll, "Salary disbursed successfully."));
    }

    [HttpPost("disburse-month")]
    public async Task<ActionResult<ApiResponse<int>>> BatchDisbursePayroll(
        [FromQuery] string monthYear,
        [FromBody] DisbursePayrollRequest request)
    {
        var targetMonth = string.IsNullOrWhiteSpace(monthYear) ? DateTime.UtcNow.ToString("yyyy-MM") : monthYear;
        var count = await _payrollService.BatchDisbursePayrollAsync(targetMonth, request);
        return Ok(ApiResponse<int>.Ok(count, $"Disbursed salaries for {count} records in {targetMonth}."));
    }

    [HttpGet("{id}/payslip")]
    public async Task<ActionResult<ApiResponse<PaySlipDto>>> GetPaySlip(string id)
    {
        var slip = await _payrollService.GetPaySlipAsync(id);
        if (slip == null) return NotFound(ApiResponse<PaySlipDto>.Fail("Pay slip not found."));
        return Ok(ApiResponse<PaySlipDto>.Ok(slip));
    }
}
