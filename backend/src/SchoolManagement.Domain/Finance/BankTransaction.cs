using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Finance;

public class BankTransaction : BaseEntity
{
    public string SchoolId { get; set; } = string.Empty;
    public string BranchId { get; set; } = string.Empty;
    public string BankAccountId { get; set; } = string.Empty;
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public string TransactionType { get; set; } = "Deposit"; // Deposit, Withdrawal, TransferIn, TransferOut, CounterCashDeposit, ExpenseDebit, PayrollDisbursement
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public string? ReferenceNo { get; set; } // Cheque No, Bank Deposit Slip, bKash TrxID
    public string Description { get; set; } = string.Empty;
    public string? CounterpartyOrAccount { get; set; } // Transfer target or source account name
    public string? DepositSlipAttachment { get; set; }
    public string TransactedBy { get; set; } = string.Empty;

    public BankAccount? BankAccount { get; set; }
}
