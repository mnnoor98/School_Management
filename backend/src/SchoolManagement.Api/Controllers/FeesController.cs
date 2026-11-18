using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.Finance.DTOs;
using SchoolManagement.Application.Finance.Services;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class FeesController : ControllerBase
{
    private readonly IFeeService _feeService;
    private readonly ICurrentUserService _currentUser;
    private readonly IStudentAccessService _studentAccess;

    public FeesController(
        IFeeService feeService,
        ICurrentUserService currentUser,
        IStudentAccessService studentAccess)
    {
        _feeService = feeService;
        _currentUser = currentUser;
        _studentAccess = studentAccess;
    }

    [HttpGet("types")]
    public async Task<ActionResult<ApiResponse<List<FeeTypeDto>>>> GetFeeTypes()
    {
        var types = await _feeService.GetFeeTypesAsync();
        return Ok(ApiResponse<List<FeeTypeDto>>.Ok(types));
    }

    [HttpGet("structures")]
    public async Task<ActionResult<ApiResponse<List<FeeStructureDto>>>> GetFeeStructures()
    {
        var structures = await _feeService.GetFeeStructuresAsync();
        return Ok(ApiResponse<List<FeeStructureDto>>.Ok(structures));
    }

    [HttpGet("invoices")]
    public async Task<ActionResult<ApiResponse<List<StudentInvoiceDto>>>> GetInvoices([FromQuery] string? studentId)
    {
        var allowedIds = await _studentAccess.GetAllowedStudentIdsAsync();
        var list = await _feeService.GetInvoicesAsync(studentId, allowedIds);
        return Ok(ApiResponse<List<StudentInvoiceDto>>.Ok(list));
    }

    [HttpGet("payments")]
    public async Task<ActionResult<ApiResponse<List<FeePaymentDto>>>> GetPayments([FromQuery] string? studentId, [FromQuery] string? invoiceId)
    {
        var allowedIds = await _studentAccess.GetAllowedStudentIdsAsync();
        var list = await _feeService.GetPaymentsAsync(studentId, invoiceId, allowedIds);
        return Ok(ApiResponse<List<FeePaymentDto>>.Ok(list));
    }

    [HttpPost("collect")]
    public async Task<ActionResult<ApiResponse<FeePaymentDto>>> CollectFeePayment([FromBody] CollectFeePaymentRequest request)
    {
        if (await _studentAccess.IsRestrictedUserAsync()) return Forbid();

        var collectedBy = _currentUser.Username ?? "Cashier";
        var (payment, error) = await _feeService.CollectPaymentAsync(request, collectedBy);
        if (!string.IsNullOrEmpty(error))
        {
            return BadRequest(ApiResponse<FeePaymentDto>.Fail(error));
        }

        return Ok(ApiResponse<FeePaymentDto>.Ok(payment!, "Payment posted and receipt generated"));
    }

    [HttpPost("collect-batch")]
    public async Task<ActionResult<ApiResponse<FeePaymentDto>>> BatchCollectFeePayment([FromBody] BatchCollectFeePaymentRequest request)
    {
        if (await _studentAccess.IsRestrictedUserAsync()) return Forbid();

        var collectedBy = _currentUser.Username ?? "Cashier";
        var (payment, error) = await _feeService.BatchCollectPaymentAsync(request, collectedBy);
        if (!string.IsNullOrEmpty(error))
        {
            return BadRequest(ApiResponse<FeePaymentDto>.Fail(error));
        }

        return Ok(ApiResponse<FeePaymentDto>.Ok(payment!, "Batch payment posted and receipt generated"));
    }

    [HttpPost("invoices")]
    public async Task<ActionResult<ApiResponse<StudentInvoiceDto>>> CreateStudentInvoice([FromBody] CreateStudentInvoiceRequest request)
    {
        if (await _studentAccess.IsRestrictedUserAsync()) return Forbid();

        var (invoice, error) = await _feeService.CreateInvoiceAsync(request);
        if (!string.IsNullOrEmpty(error))
        {
            return BadRequest(ApiResponse<StudentInvoiceDto>.Fail(error));
        }

        return Ok(ApiResponse<StudentInvoiceDto>.Ok(invoice!, "Invoice created successfully"));
    }

    [HttpPost("types")]
    public async Task<ActionResult<ApiResponse<FeeTypeDto>>> CreateFeeType([FromBody] CreateFeeTypeRequest request)
    {
        if (await _studentAccess.IsRestrictedUserAsync()) return Forbid();

        var (type, error) = await _feeService.CreateFeeTypeAsync(request);
        if (!string.IsNullOrEmpty(error))
        {
            return BadRequest(ApiResponse<FeeTypeDto>.Fail(error));
        }

        return Ok(ApiResponse<FeeTypeDto>.Ok(type!, "Fee type created successfully"));
    }

    [HttpPut("types/{id}")]
    public async Task<ActionResult<ApiResponse<FeeTypeDto>>> UpdateFeeType(string id, [FromBody] UpdateFeeTypeRequest request)
    {
        if (await _studentAccess.IsRestrictedUserAsync()) return Forbid();

        var (type, error) = await _feeService.UpdateFeeTypeAsync(id, request);
        if (!string.IsNullOrEmpty(error))
        {
            return NotFound(ApiResponse<FeeTypeDto>.Fail(error));
        }

        return Ok(ApiResponse<FeeTypeDto>.Ok(type!, "Fee type updated successfully"));
    }

    [HttpDelete("types/{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteFeeType(string id)
    {
        if (await _studentAccess.IsRestrictedUserAsync()) return Forbid();

        var deleted = await _feeService.DeleteFeeTypeAsync(id);
        if (!deleted)
        {
            return BadRequest(ApiResponse<bool>.Fail("Cannot delete this fee type because it is linked to fee structures or student invoices."));
        }

        return Ok(ApiResponse<bool>.Ok(true, "Fee type deleted successfully"));
    }

    [HttpPost("structures")]
    public async Task<ActionResult<ApiResponse<FeeStructureDto>>> SetFeeStructure([FromBody] CreateFeeStructureRequest request)
    {
        if (await _studentAccess.IsRestrictedUserAsync()) return Forbid();

        var (structure, error) = await _feeService.CreateFeeStructureAsync(request);
        if (!string.IsNullOrEmpty(error))
        {
            return BadRequest(ApiResponse<FeeStructureDto>.Fail(error));
        }

        return Ok(ApiResponse<FeeStructureDto>.Ok(structure!, "Fee structure configured"));
    }

    [HttpPut("structures/{id}")]
    public async Task<ActionResult<ApiResponse<FeeStructureDto>>> UpdateFeeStructure(string id, [FromBody] UpdateFeeStructureRequest request)
    {
        if (await _studentAccess.IsRestrictedUserAsync()) return Forbid();

        var (structure, error) = await _feeService.UpdateFeeStructureAsync(id, request);
        if (!string.IsNullOrEmpty(error))
        {
            return NotFound(ApiResponse<FeeStructureDto>.Fail(error));
        }

        return Ok(ApiResponse<FeeStructureDto>.Ok(structure!, "Fee structure updated"));
    }

    [HttpDelete("structures/{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteFeeStructure(string id)
    {
        if (await _studentAccess.IsRestrictedUserAsync()) return Forbid();

        var deleted = await _feeService.DeleteFeeStructureAsync(id);
        if (!deleted) return NotFound(ApiResponse<bool>.Fail("Fee structure not found"));

        return Ok(ApiResponse<bool>.Ok(true, "Fee structure removed"));
    }

    [HttpPost("invoices/generate-batch")]
    public async Task<ActionResult<ApiResponse<BatchGenerateInvoicesResult>>> BatchGenerateInvoices([FromBody] BatchGenerateInvoicesRequest request)
    {
        if (await _studentAccess.IsRestrictedUserAsync()) return Forbid();

        var (result, error) = await _feeService.GenerateBatchInvoicesAsync(request);
        if (!string.IsNullOrEmpty(error))
        {
            return BadRequest(ApiResponse<BatchGenerateInvoicesResult>.Fail(error));
        }

        return Ok(ApiResponse<BatchGenerateInvoicesResult>.Ok(result!));
    }

    [HttpPut("invoices/{id}/discount")]
    public async Task<ActionResult<ApiResponse<bool>>> ApplyInvoiceDiscount(string id, [FromBody] ApplyInvoiceDiscountRequest request)
    {
        if (await _studentAccess.IsRestrictedUserAsync()) return Forbid();

        var (success, error) = await _feeService.ApplyInvoiceDiscountAsync(id, request);
        if (!success)
        {
            return BadRequest(ApiResponse<bool>.Fail(error ?? "Could not apply discount."));
        }

        return Ok(ApiResponse<bool>.Ok(true, "Discount applied successfully"));
    }

    [HttpGet("reconciliation/daily-closing")]
    public async Task<ActionResult<ApiResponse<DailyClosingReconciliationDto>>> GetDailyClosingReconciliation([FromQuery] DateTime? date)
    {
        var targetDate = date ?? DateTime.UtcNow;
        var report = await _feeService.GetDailyClosingReportAsync(targetDate);
        return Ok(ApiResponse<DailyClosingReconciliationDto>.Ok(report, "Daily accounts closing report generated"));
    }
}
