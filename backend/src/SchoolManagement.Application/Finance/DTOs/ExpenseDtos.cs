namespace SchoolManagement.Application.Finance.DTOs;

public class ExpenseCategoryDto
{
    public string Id { get; set; } = string.Empty;
    public string BranchId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal MonthlyBudgetLimit { get; set; }
    public bool IsActive { get; set; } = true;
}

public class ExpenseVoucherItemDto
{
    public string Id { get; set; } = string.Empty;
    public string ExpenseVoucherId { get; set; } = string.Empty;
    public string Particulars { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
}

public class ExpenseVoucherDto
{
    public string Id { get; set; } = string.Empty;
    public string BranchId { get; set; } = string.Empty;
    public string VoucherNo { get; set; } = string.Empty;
    public DateTime ExpenseDate { get; set; }
    public string ExpenseCategoryId { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string? BankAccountOrChequeNo { get; set; }
    public string PaidTo { get; set; } = string.Empty;
    public string? ContactPhone { get; set; }
    public string? AttachmentUrl { get; set; }
    public string Status { get; set; } = "Paid";
    public string CreatedBy { get; set; } = string.Empty;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovalDate { get; set; }
    public string? Notes { get; set; }
    public List<ExpenseVoucherItemDto> Items { get; set; } = new();
}

public class CreateExpenseCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Description { get; set; }
    public decimal MonthlyBudgetLimit { get; set; } = 0;
}

public class UpdateExpenseCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Description { get; set; }
    public decimal MonthlyBudgetLimit { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}

public class CreateExpenseVoucherItemRequest
{
    public string Particulars { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal? Amount { get; set; }
}

public class CreateExpenseVoucherRequest
{
    public DateTime? ExpenseDate { get; set; }
    public string ExpenseCategoryId { get; set; } = string.Empty;
    public decimal? TotalAmount { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string? BankAccountOrChequeNo { get; set; }
    public string PaidTo { get; set; } = string.Empty;
    public string? ContactPhone { get; set; }
    public string? AttachmentUrl { get; set; }
    public string Status { get; set; } = "Paid";
    public string? Notes { get; set; }
    public List<CreateExpenseVoucherItemRequest> Items { get; set; } = new();
}

public class ApproveExpenseVoucherRequest
{
    public string Action { get; set; } = "Approve"; // Approve or Reject
    public string? Notes { get; set; }
}

public class ExpenseCategorySummaryDto
{
    public string CategoryName { get; set; } = string.Empty;
    public int VoucherCount { get; set; }
    public decimal TotalAmount { get; set; }
}

public class ExpenseSummaryDto
{
    public decimal TodayTotal { get; set; }
    public decimal ThisMonthTotal { get; set; }
    public int PendingApprovalCount { get; set; }
    public decimal PendingApprovalAmount { get; set; }
    public List<ExpenseCategorySummaryDto> ByCategory { get; set; } = new();
    public List<ExpenseVoucherDto> RecentVouchers { get; set; } = new();
}
