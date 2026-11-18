using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Finance;

public class BankAccount : BaseEntity
{
    public string SchoolId { get; set; } = string.Empty;
    public string BranchId { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string BranchName { get; set; } = string.Empty;
    public string AccountType { get; set; } = "Current"; // Current, Savings, CashVault, PettyCash, MobileWallet
    public decimal OpeningBalance { get; set; } = 0.00m;
    public decimal CurrentBalance { get; set; } = 0.00m;
    public string Currency { get; set; } = "BDT";
    public string? RoutingNumber { get; set; }
    public string? SwiftCode { get; set; }
    public bool IsDefaultForTuition { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }

    public ICollection<BankTransaction> Transactions { get; set; } = new List<BankTransaction>();
}
