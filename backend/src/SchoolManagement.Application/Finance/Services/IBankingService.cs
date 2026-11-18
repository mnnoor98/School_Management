using SchoolManagement.Application.Finance.DTOs;

namespace SchoolManagement.Application.Finance.Services;

public interface IBankingService
{
    Task<List<BankAccountDto>> GetAccountsAsync();
    Task<BankAccountDto?> GetAccountByIdAsync(string id);
    Task<BankAccountDto> CreateAccountAsync(CreateBankAccountRequest request);
    Task<BankAccountDto> UpdateAccountAsync(string id, CreateBankAccountRequest request);
    Task<bool> ToggleAccountStatusAsync(string id);

    Task<List<BankTransactionDto>> GetTransactionsAsync(string? bankAccountId = null, DateTime? fromDate = null, DateTime? toDate = null);
    Task<BankTransactionDto> RecordDepositOrWithdrawalAsync(DepositWithdrawRequest request);
    Task<bool> TransferBetweenAccountsAsync(BankTransferRequest request);

    Task<List<PettyCashVoucherDto>> GetPettyCashVouchersAsync(string? status = null);
    Task<PettyCashVoucherDto> CreatePettyCashVoucherAsync(CreatePettyCashRequest request);
    Task<bool> ApprovePettyCashVoucherAsync(string id);
    Task<bool> ReimbursePettyCashVoucherAsync(string id, string bankAccountId);

    Task<TreasurySummaryDto> GetTreasurySummaryAsync();
    Task EnsureDefaultCampusAccountsSeededAsync();
}
