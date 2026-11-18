using SchoolManagement.Application.Finance.DTOs;

namespace SchoolManagement.Application.Finance.Services;

public interface IExpenseService
{
    Task<List<ExpenseCategoryDto>> GetCategoriesAsync();
    Task<(ExpenseCategoryDto? Category, string? Error)> CreateCategoryAsync(CreateExpenseCategoryRequest request);
    Task<(ExpenseCategoryDto? Category, string? Error)> UpdateCategoryAsync(string id, UpdateExpenseCategoryRequest request);
    Task<bool> DeleteCategoryAsync(string id);

    Task<List<ExpenseVoucherDto>> GetVouchersAsync(DateTime? startDate, DateTime? endDate, string? categoryId, string? status);
    Task<ExpenseVoucherDto?> GetVoucherByIdAsync(string id);
    Task<(ExpenseVoucherDto? Voucher, string? Error)> CreateVoucherAsync(CreateExpenseVoucherRequest request, string createdBy);
    Task<(ExpenseVoucherDto? Voucher, string? Error)> ApproveVoucherAsync(string id, ApproveExpenseVoucherRequest request, string approvedBy);
    Task<bool> DeleteVoucherAsync(string id);

    Task<ExpenseSummaryDto> GetSummaryAsync();
}
