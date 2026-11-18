using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Finance;

public class ExpenseVoucher : BaseEntity, ICampusScopedEntity
{
    public string BranchId { get; set; } = "br-01";
    public string SchoolId { get; set; } = "sch-01";
    public string VoucherNo { get; set; } = string.Empty; // e.g. EXP-2026-0001
    public DateTime ExpenseDate { get; set; } = DateTime.UtcNow;
    
    public string ExpenseCategoryId { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    
    public decimal Amount { get; set; } = 0;
    public string PaymentMethod { get; set; } = "Cash"; // Cash, Bank Cheque, bKash, Nagad
    public string? BankAccountOrChequeNo { get; set; }
    
    public string PaidTo { get; set; } = string.Empty; // Vendor / Payee / Person name
    public string? ContactPhone { get; set; }
    public string? AttachmentUrl { get; set; } // Cashmemo / Receipt photo
    
    public string Status { get; set; } = "Paid"; // Draft, PendingApproval, Approved, Paid, Rejected
    public string CreatedBy { get; set; } = string.Empty;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovalDate { get; set; }
    public string? Notes { get; set; }

    public virtual ExpenseCategory? Category { get; set; }
    public virtual ICollection<ExpenseVoucherItem> Items { get; set; } = new List<ExpenseVoucherItem>();
}
