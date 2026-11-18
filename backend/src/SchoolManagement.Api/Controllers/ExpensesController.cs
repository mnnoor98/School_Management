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
public class ExpensesController : ControllerBase
{
    private readonly IExpenseService _expenseService;
    private readonly ICurrentUserService _currentUser;
    private readonly IWebHostEnvironment _env;

    public ExpensesController(
        IExpenseService expenseService,
        ICurrentUserService currentUser,
        IWebHostEnvironment env)
    {
        _expenseService = expenseService;
        _currentUser = currentUser;
        _env = env;
    }

    [HttpGet("categories")]
    public async Task<ActionResult<ApiResponse<List<ExpenseCategoryDto>>>> GetCategories()
    {
        var list = await _expenseService.GetCategoriesAsync();
        return Ok(ApiResponse<List<ExpenseCategoryDto>>.Ok(list));
    }

    [HttpPost("categories")]
    public async Task<ActionResult<ApiResponse<ExpenseCategoryDto>>> CreateCategory([FromBody] CreateExpenseCategoryRequest request)
    {
        var (category, error) = await _expenseService.CreateCategoryAsync(request);
        if (error != null) return BadRequest(ApiResponse<ExpenseCategoryDto>.Fail(error));
        return Ok(ApiResponse<ExpenseCategoryDto>.Ok(category!));
    }

    [HttpPut("categories/{id}")]
    public async Task<ActionResult<ApiResponse<ExpenseCategoryDto>>> UpdateCategory(string id, [FromBody] UpdateExpenseCategoryRequest request)
    {
        var (category, error) = await _expenseService.UpdateCategoryAsync(id, request);
        if (error != null) return BadRequest(ApiResponse<ExpenseCategoryDto>.Fail(error));
        return Ok(ApiResponse<ExpenseCategoryDto>.Ok(category!));
    }

    [HttpDelete("categories/{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteCategory(string id)
    {
        var deleted = await _expenseService.DeleteCategoryAsync(id);
        return Ok(ApiResponse<bool>.Ok(deleted));
    }

    [HttpGet("vouchers")]
    public async Task<ActionResult<ApiResponse<List<ExpenseVoucherDto>>>> GetVouchers(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? categoryId,
        [FromQuery] string? status)
    {
        var list = await _expenseService.GetVouchersAsync(startDate, endDate, categoryId, status);
        return Ok(ApiResponse<List<ExpenseVoucherDto>>.Ok(list));
    }

    [HttpGet("vouchers/{id}")]
    public async Task<ActionResult<ApiResponse<ExpenseVoucherDto>>> GetVoucherById(string id)
    {
        var voucher = await _expenseService.GetVoucherByIdAsync(id);
        if (voucher == null) return NotFound(ApiResponse<ExpenseVoucherDto>.Fail("Expense voucher not found."));
        return Ok(ApiResponse<ExpenseVoucherDto>.Ok(voucher));
    }

    [HttpPost("vouchers")]
    public async Task<ActionResult<ApiResponse<ExpenseVoucherDto>>> CreateVoucher([FromBody] CreateExpenseVoucherRequest request)
    {
        var user = _currentUser.Username ?? "Accountant";
        var (voucher, error) = await _expenseService.CreateVoucherAsync(request, user);
        if (error != null) return BadRequest(ApiResponse<ExpenseVoucherDto>.Fail(error));
        return Ok(ApiResponse<ExpenseVoucherDto>.Ok(voucher!));
    }

    [HttpPost("vouchers/{id}/approve")]
    public async Task<ActionResult<ApiResponse<ExpenseVoucherDto>>> ApproveVoucher(string id, [FromBody] ApproveExpenseVoucherRequest request)
    {
        var user = _currentUser.Username ?? "Principal";
        var (voucher, error) = await _expenseService.ApproveVoucherAsync(id, request, user);
        if (error != null) return BadRequest(ApiResponse<ExpenseVoucherDto>.Fail(error));
        return Ok(ApiResponse<ExpenseVoucherDto>.Ok(voucher!));
    }

    [HttpDelete("vouchers/{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteVoucher(string id)
    {
        var ok = await _expenseService.DeleteVoucherAsync(id);
        return Ok(ApiResponse<bool>.Ok(ok));
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<ExpenseSummaryDto>>> GetSummary()
    {
        var summary = await _expenseService.GetSummaryAsync();
        return Ok(ApiResponse<ExpenseSummaryDto>.Ok(summary));
    }

    [HttpPost("upload-attachment")]
    public async Task<ActionResult<ApiResponse<string>>> UploadAttachment([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<string>.Fail("No file provided."));

        var uploadsFolder = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads", "expenses");
        if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

        var ext = Path.GetExtension(file.FileName);
        var fileName = $"exp-{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var relativeUrl = $"/uploads/expenses/{fileName}";
        return Ok(ApiResponse<string>.Ok(relativeUrl));
    }
}
