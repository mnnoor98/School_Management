using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Finance;

public class PettyCashVoucher : BaseEntity
{
    public string SchoolId { get; set; } = string.Empty;
    public string BranchId { get; set; } = string.Empty;
    public string VoucherNo { get; set; } = string.Empty; // e.g., PCV-2026-0001
    public DateTime VoucherDate { get; set; } = DateTime.UtcNow;
    public string PayeeName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Category { get; set; } = "Office Stationery"; // Refreshment, Office Stationery, Transport, Maintenance, Cleaning, Courier, Emergency
    public string Purpose { get; set; } = string.Empty;
    public string? ReceiptAttachment { get; set; }
    public string Status { get; set; } = "Approved"; // Approved, Reimbursed, Rejected
    public string ApprovedBy { get; set; } = string.Empty;
    public string? ReimbursedFromBankAccountId { get; set; }
    public DateTime? ReimbursedDate { get; set; }
}
