namespace SchoolManagement.Application.Finance.DTOs;

public class BankAccountDto
{
    public string Id { get; set; } = string.Empty;
    public string BranchId { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string BranchName { get; set; } = string.Empty;
    public string AccountType { get; set; } = "Current"; // Current, Savings, CashVault, PettyCash, MobileWallet
    public decimal OpeningBalance { get; set; }
    public decimal CurrentBalance { get; set; }
    public string Currency { get; set; } = "BDT";
    public string? RoutingNumber { get; set; }
    public string? SwiftCode { get; set; }
    public bool IsDefaultForTuition { get; set; }
    public bool IsActive { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateBankAccountRequest
{
    public string AccountName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string BranchName { get; set; } = string.Empty;
    public string AccountType { get; set; } = "Current";
    public decimal OpeningBalance { get; set; } = 0.00m;
    public string? RoutingNumber { get; set; }
    public string? SwiftCode { get; set; }
    public bool IsDefaultForTuition { get; set; } = false;
    public string? Notes { get; set; }
}

public class BankTransactionDto
{
    public string Id { get; set; } = string.Empty;
    public string BranchId { get; set; } = string.Empty;
    public string BankAccountId { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public DateTime TransactionDate { get; set; }
    public string TransactionType { get; set; } = "Deposit";
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public string? ReferenceNo { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? CounterpartyOrAccount { get; set; }
    public string? DepositSlipAttachment { get; set; }
    public string TransactedBy { get; set; } = string.Empty;
}

public class DepositWithdrawRequest
{
    public string BankAccountId { get; set; } = string.Empty;
    public string TransactionType { get; set; } = "Deposit"; // Deposit, Withdrawal, CounterCashDeposit
    public decimal Amount { get; set; }
    public string? ReferenceNo { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? DepositSlipAttachment { get; set; }
}

public class BankTransferRequest
{
    public string FromBankAccountId { get; set; } = string.Empty;
    public string ToBankAccountId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? ReferenceNo { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class PettyCashVoucherDto
{
    public string Id { get; set; } = string.Empty;
    public string BranchId { get; set; } = string.Empty;
    public string VoucherNo { get; set; } = string.Empty;
    public DateTime VoucherDate { get; set; }
    public string PayeeName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Category { get; set; } = "Office Stationery";
    public string Purpose { get; set; } = string.Empty;
    public string? ReceiptAttachment { get; set; }
    public string Status { get; set; } = "Approved";
    public string ApprovedBy { get; set; } = string.Empty;
    public string? ReimbursedFromBankAccountId { get; set; }
    public DateTime? ReimbursedDate { get; set; }
}

public class CreatePettyCashRequest
{
    public string PayeeName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Category { get; set; } = "Office Stationery";
    public string Purpose { get; set; } = string.Empty;
    public string? ReceiptAttachment { get; set; }
}

public class TreasurySummaryDto
{
    public decimal TotalLiquidFunds { get; set; }
    public decimal TotalBankBalances { get; set; }
    public decimal TotalVaultCash { get; set; }
    public decimal TotalPettyCashBalance { get; set; }
    public decimal TotalMonthlyDeposits { get; set; }
    public decimal TotalMonthlyWithdrawals { get; set; }
    public int ActiveAccountsCount { get; set; }
    public int PendingPettyCashCount { get; set; }
}
