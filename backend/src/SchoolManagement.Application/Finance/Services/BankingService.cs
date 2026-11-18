using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Finance.DTOs;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance.Services;

public class BankingService : IBankingService
{
    private readonly IApplicationDbContext _context;
    private readonly ICampusContext _campus;
    private readonly ICurrentUserService _currentUser;

    public BankingService(
        IApplicationDbContext context,
        ICampusContext campus,
        ICurrentUserService currentUser)
    {
        _context = context;
        _campus = campus;
        _currentUser = currentUser;
    }

    public async Task EnsureDefaultCampusAccountsSeededAsync()
    {
        var branchId = _campus.BranchId;
        var schoolId = _campus.SchoolId;

        if (string.IsNullOrWhiteSpace(branchId) || string.IsNullOrWhiteSpace(schoolId))
            return;

        var count = await _context.BankAccounts
            .Where(b => b.SchoolId == schoolId && b.BranchId == branchId)
            .CountAsync();

        if (count > 0) return;

        var defaultAccounts = new List<BankAccount>
        {
            new()
            {
                SchoolId = schoolId,
                BranchId = branchId,
                AccountName = "Sonali Bank - Main Operational & Tuition Account",
                AccountNumber = branchId == "br-02" ? "0202-33005511" : "0102-33001824",
                BankName = "Sonali Bank PLC",
                BranchName = branchId == "br-02" ? "Uttara Model Town Branch" : "Dhanmondi Principal Branch",
                AccountType = "Current",
                OpeningBalance = 350000.00m,
                CurrentBalance = 350000.00m,
                Currency = "BDT",
                RoutingNumber = "200260145",
                SwiftCode = "BSONBDDH",
                IsDefaultForTuition = true,
                IsActive = true,
                Notes = "Primary institutional collection & salary clearing bank account."
            },
            new()
            {
                SchoolId = schoolId,
                BranchId = branchId,
                AccountName = "Dutch-Bangla Bank - Digital Tuition & Merchant Gateway",
                AccountNumber = branchId == "br-02" ? "120.120.77192" : "110.120.44892",
                BankName = "Dutch-Bangla Bank PLC",
                BranchName = branchId == "br-02" ? "Sector 7 Uttara Branch" : "Satmasjid Road Branch",
                AccountType = "Savings",
                OpeningBalance = 180000.00m,
                CurrentBalance = 180000.00m,
                Currency = "BDT",
                RoutingNumber = "090261172",
                SwiftCode = "DBBLBDDH",
                IsDefaultForTuition = false,
                IsActive = true,
                Notes = "Online admissions & POS card fee collection terminal account."
            },
            new()
            {
                SchoolId = schoolId,
                BranchId = branchId,
                AccountName = "Campus Cash Counter Safe Vault",
                AccountNumber = $"VAULT-{branchId.ToUpperInvariant()}-MAIN",
                BankName = "Campus Treasury Vault",
                BranchName = branchId == "br-02" ? "Uttara Cash Office" : "Dhanmondi Cash Counter",
                AccountType = "CashVault",
                OpeningBalance = 45000.00m,
                CurrentBalance = 45000.00m,
                Currency = "BDT",
                IsDefaultForTuition = false,
                IsActive = true,
                Notes = "Physical lockbox for unbanked counter receipts awaiting deposit slip."
            },
            new()
            {
                SchoolId = schoolId,
                BranchId = branchId,
                AccountName = "Office Imprest Petty Cash Fund",
                AccountNumber = $"PETTY-{branchId.ToUpperInvariant()}-01",
                BankName = "Imprest Cash Safe",
                BranchName = "Administrative Bursar Room",
                AccountType = "PettyCash",
                OpeningBalance = 20000.00m,
                CurrentBalance = 20000.00m,
                Currency = "BDT",
                IsDefaultForTuition = false,
                IsActive = true,
                Notes = "Fixed petty cash float for minor daily supplies, courier & refreshments."
            }
        };

        _context.BankAccounts.AddRange(defaultAccounts);
        await _context.SaveChangesAsync();
    }

    public async Task<List<BankAccountDto>> GetAccountsAsync()
    {
        await EnsureDefaultCampusAccountsSeededAsync();

        var branchId = _campus.BranchId;
        var schoolId = _campus.SchoolId;

        var accounts = await _context.BankAccounts
            .Where(b => b.SchoolId == schoolId && b.BranchId == branchId)
            .OrderByDescending(b => b.IsDefaultForTuition)
            .ThenBy(b => b.AccountName)
            .ToListAsync();

        return accounts.Select(MapToDto).ToList();
    }

    public async Task<BankAccountDto?> GetAccountByIdAsync(string id)
    {
        var branchId = _campus.BranchId;
        var schoolId = _campus.SchoolId;

        var account = await _context.BankAccounts
            .FirstOrDefaultAsync(b => b.Id == id && b.SchoolId == schoolId && b.BranchId == branchId);

        return account == null ? null : MapToDto(account);
    }

    public async Task<BankAccountDto> CreateAccountAsync(CreateBankAccountRequest request)
    {
        var branchId = _campus.BranchId;
        var schoolId = _campus.SchoolId;

        if (string.IsNullOrWhiteSpace(request.AccountName))
            throw new ArgumentException("Account name is required.");
        if (string.IsNullOrWhiteSpace(request.AccountNumber))
            throw new ArgumentException("Account number is required.");
        if (string.IsNullOrWhiteSpace(request.BankName))
            throw new ArgumentException("Bank / Institution name is required.");

        var existing = await _context.BankAccounts
            .AnyAsync(b => b.SchoolId == schoolId && b.BranchId == branchId && b.AccountNumber == request.AccountNumber);
        if (existing)
            throw new InvalidOperationException($"An account with number '{request.AccountNumber}' already exists in this campus.");

        if (request.IsDefaultForTuition)
        {
            var currentDefaults = await _context.BankAccounts
                .Where(b => b.SchoolId == schoolId && b.BranchId == branchId && b.IsDefaultForTuition)
                .ToListAsync();
            foreach (var d in currentDefaults) d.IsDefaultForTuition = false;
        }

        var account = new BankAccount
        {
            SchoolId = schoolId,
            BranchId = branchId,
            AccountName = request.AccountName.Trim(),
            AccountNumber = request.AccountNumber.Trim(),
            BankName = request.BankName.Trim(),
            BranchName = request.BranchName?.Trim() ?? string.Empty,
            AccountType = request.AccountType,
            OpeningBalance = request.OpeningBalance,
            CurrentBalance = request.OpeningBalance,
            Currency = "BDT",
            RoutingNumber = request.RoutingNumber?.Trim(),
            SwiftCode = request.SwiftCode?.Trim(),
            IsDefaultForTuition = request.IsDefaultForTuition,
            IsActive = true,
            Notes = request.Notes
        };

        _context.BankAccounts.Add(account);
        await _context.SaveChangesAsync();

        if (request.OpeningBalance > 0)
        {
            var initialTrx = new BankTransaction
            {
                SchoolId = schoolId,
                BranchId = branchId,
                BankAccountId = account.Id,
                TransactionDate = DateTime.UtcNow,
                TransactionType = "Deposit",
                Amount = request.OpeningBalance,
                BalanceAfter = request.OpeningBalance,
                ReferenceNo = "OPENING-BAL",
                Description = "Initial opening ledger balance balance credit.",
                TransactedBy = _currentUser.UserId ?? "System"
            };
            _context.BankTransactions.Add(initialTrx);
            await _context.SaveChangesAsync();
        }

        return MapToDto(account);
    }

    public async Task<BankAccountDto> UpdateAccountAsync(string id, CreateBankAccountRequest request)
    {
        var branchId = _campus.BranchId;
        var schoolId = _campus.SchoolId;

        var account = await _context.BankAccounts
            .FirstOrDefaultAsync(b => b.Id == id && b.SchoolId == schoolId && b.BranchId == branchId);

        if (account == null)
            throw new KeyNotFoundException("Bank account not found.");

        if (request.IsDefaultForTuition && !account.IsDefaultForTuition)
        {
            var currentDefaults = await _context.BankAccounts
                .Where(b => b.SchoolId == schoolId && b.BranchId == branchId && b.IsDefaultForTuition)
                .ToListAsync();
            foreach (var d in currentDefaults) d.IsDefaultForTuition = false;
        }

        account.AccountName = request.AccountName.Trim();
        account.BankName = request.BankName.Trim();
        account.BranchName = request.BranchName?.Trim() ?? string.Empty;
        account.AccountType = request.AccountType;
        account.RoutingNumber = request.RoutingNumber?.Trim();
        account.SwiftCode = request.SwiftCode?.Trim();
        account.IsDefaultForTuition = request.IsDefaultForTuition;
        account.Notes = request.Notes;
        account.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToDto(account);
    }

    public async Task<bool> ToggleAccountStatusAsync(string id)
    {
        var branchId = _campus.BranchId;
        var schoolId = _campus.SchoolId;

        var account = await _context.BankAccounts
            .FirstOrDefaultAsync(b => b.Id == id && b.SchoolId == schoolId && b.BranchId == branchId);

        if (account == null) return false;

        account.IsActive = !account.IsActive;
        account.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<BankTransactionDto>> GetTransactionsAsync(string? bankAccountId = null, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var branchId = _campus.BranchId;
        var schoolId = _campus.SchoolId;

        var query = _context.BankTransactions
            .Include(t => t.BankAccount)
            .Where(t => t.SchoolId == schoolId && t.BranchId == branchId);

        if (!string.IsNullOrWhiteSpace(bankAccountId) && bankAccountId != "ALL")
        {
            query = query.Where(t => t.BankAccountId == bankAccountId);
        }

        if (fromDate.HasValue)
        {
            var start = fromDate.Value.Date;
            query = query.Where(t => t.TransactionDate >= start);
        }

        if (toDate.HasValue)
        {
            var end = toDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(t => t.TransactionDate <= end);
        }

        var list = await query
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.CreatedAt)
            .Take(250)
            .ToListAsync();

        return list.Select(t => new BankTransactionDto
        {
            Id = t.Id,
            BranchId = t.BranchId,
            BankAccountId = t.BankAccountId,
            AccountName = t.BankAccount?.AccountName ?? "Unknown Account",
            AccountNumber = t.BankAccount?.AccountNumber ?? string.Empty,
            BankName = t.BankAccount?.BankName ?? string.Empty,
            TransactionDate = t.TransactionDate,
            TransactionType = t.TransactionType,
            Amount = t.Amount,
            BalanceAfter = t.BalanceAfter,
            ReferenceNo = t.ReferenceNo,
            Description = t.Description,
            CounterpartyOrAccount = t.CounterpartyOrAccount,
            DepositSlipAttachment = t.DepositSlipAttachment,
            TransactedBy = t.TransactedBy
        }).ToList();
    }

    public async Task<BankTransactionDto> RecordDepositOrWithdrawalAsync(DepositWithdrawRequest request)
    {
        var branchId = _campus.BranchId;
        var schoolId = _campus.SchoolId;

        if (request.Amount <= 0)
            throw new ArgumentException("Amount must be greater than zero.");

        var account = await _context.BankAccounts
            .FirstOrDefaultAsync(b => b.Id == request.BankAccountId && b.SchoolId == schoolId && b.BranchId == branchId);

        if (account == null)
            throw new KeyNotFoundException("Target bank account not found.");

        var isDeposit = request.TransactionType.Equals("Deposit", StringComparison.OrdinalIgnoreCase)
                     || request.TransactionType.Equals("CounterCashDeposit", StringComparison.OrdinalIgnoreCase);

        if (!isDeposit && account.CurrentBalance < request.Amount)
        {
            throw new InvalidOperationException($"Insufficient funds in {account.AccountName}. Current balance is ৳ {account.CurrentBalance:N2}.");
        }

        if (isDeposit)
        {
            account.CurrentBalance += request.Amount;
        }
        else
        {
            account.CurrentBalance -= request.Amount;
        }
        account.UpdatedAt = DateTime.UtcNow;

        var trx = new BankTransaction
        {
            SchoolId = schoolId,
            BranchId = branchId,
            BankAccountId = account.Id,
            TransactionDate = DateTime.UtcNow,
            TransactionType = request.TransactionType,
            Amount = request.Amount,
            BalanceAfter = account.CurrentBalance,
            ReferenceNo = request.ReferenceNo?.Trim(),
            Description = request.Description?.Trim() ?? (isDeposit ? "Direct Bank Deposit" : "Direct Cash Withdrawal"),
            DepositSlipAttachment = request.DepositSlipAttachment,
            TransactedBy = _currentUser.UserId ?? "System"
        };

        _context.BankTransactions.Add(trx);
        await _context.SaveChangesAsync();

        return new BankTransactionDto
        {
            Id = trx.Id,
            BranchId = trx.BranchId,
            BankAccountId = trx.BankAccountId,
            AccountName = account.AccountName,
            AccountNumber = account.AccountNumber,
            BankName = account.BankName,
            TransactionDate = trx.TransactionDate,
            TransactionType = trx.TransactionType,
            Amount = trx.Amount,
            BalanceAfter = trx.BalanceAfter,
            ReferenceNo = trx.ReferenceNo,
            Description = trx.Description,
            DepositSlipAttachment = trx.DepositSlipAttachment,
            TransactedBy = trx.TransactedBy
        };
    }

    public async Task<bool> TransferBetweenAccountsAsync(BankTransferRequest request)
    {
        var branchId = _campus.BranchId;
        var schoolId = _campus.SchoolId;

        if (request.Amount <= 0)
            throw new ArgumentException("Transfer amount must be greater than zero.");
        if (request.FromBankAccountId == request.ToBankAccountId)
            throw new ArgumentException("Source and destination bank accounts cannot be the same.");

        var fromAcc = await _context.BankAccounts
            .FirstOrDefaultAsync(b => b.Id == request.FromBankAccountId && b.SchoolId == schoolId && b.BranchId == branchId);
        var toAcc = await _context.BankAccounts
            .FirstOrDefaultAsync(b => b.Id == request.ToBankAccountId && b.SchoolId == schoolId && b.BranchId == branchId);

        if (fromAcc == null || toAcc == null)
            throw new KeyNotFoundException("Source or destination bank account not found.");

        if (fromAcc.CurrentBalance < request.Amount)
            throw new InvalidOperationException($"Insufficient balance in {fromAcc.AccountName}. Available: ৳ {fromAcc.CurrentBalance:N2}.");

        fromAcc.CurrentBalance -= request.Amount;
        toAcc.CurrentBalance += request.Amount;
        fromAcc.UpdatedAt = DateTime.UtcNow;
        toAcc.UpdatedAt = DateTime.UtcNow;

        var trxOut = new BankTransaction
        {
            SchoolId = schoolId,
            BranchId = branchId,
            BankAccountId = fromAcc.Id,
            TransactionDate = DateTime.UtcNow,
            TransactionType = "TransferOut",
            Amount = request.Amount,
            BalanceAfter = fromAcc.CurrentBalance,
            ReferenceNo = request.ReferenceNo?.Trim(),
            Description = $"Transfer to {toAcc.AccountName}: {request.Description}".Trim(),
            CounterpartyOrAccount = toAcc.AccountName,
            TransactedBy = _currentUser.UserId ?? "System"
        };

        var trxIn = new BankTransaction
        {
            SchoolId = schoolId,
            BranchId = branchId,
            BankAccountId = toAcc.Id,
            TransactionDate = DateTime.UtcNow,
            TransactionType = "TransferIn",
            Amount = request.Amount,
            BalanceAfter = toAcc.CurrentBalance,
            ReferenceNo = request.ReferenceNo?.Trim(),
            Description = $"Transfer from {fromAcc.AccountName}: {request.Description}".Trim(),
            CounterpartyOrAccount = fromAcc.AccountName,
            TransactedBy = _currentUser.UserId ?? "System"
        };

        _context.BankTransactions.AddRange(trxOut, trxIn);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<PettyCashVoucherDto>> GetPettyCashVouchersAsync(string? status = null)
    {
        var branchId = _campus.BranchId;
        var schoolId = _campus.SchoolId;

        var query = _context.PettyCashVouchers
            .Where(p => p.SchoolId == schoolId && p.BranchId == branchId);

        if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
        {
            query = query.Where(p => p.Status == status);
        }

        var list = await query
            .OrderByDescending(p => p.VoucherDate)
            .ThenByDescending(p => p.CreatedAt)
            .ToListAsync();

        return list.Select(p => new PettyCashVoucherDto
        {
            Id = p.Id,
            BranchId = p.BranchId,
            VoucherNo = p.VoucherNo,
            VoucherDate = p.VoucherDate,
            PayeeName = p.PayeeName,
            Amount = p.Amount,
            Category = p.Category,
            Purpose = p.Purpose,
            ReceiptAttachment = p.ReceiptAttachment,
            Status = p.Status,
            ApprovedBy = p.ApprovedBy,
            ReimbursedFromBankAccountId = p.ReimbursedFromBankAccountId,
            ReimbursedDate = p.ReimbursedDate
        }).ToList();
    }

    public async Task<PettyCashVoucherDto> CreatePettyCashVoucherAsync(CreatePettyCashRequest request)
    {
        var branchId = _campus.BranchId;
        var schoolId = _campus.SchoolId;

        if (request.Amount <= 0)
            throw new ArgumentException("Voucher amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(request.PayeeName))
            throw new ArgumentException("Payee name is required.");
        if (string.IsNullOrWhiteSpace(request.Purpose))
            throw new ArgumentException("Expense purpose is required.");

        var pettyAcc = await _context.BankAccounts
            .FirstOrDefaultAsync(b => b.SchoolId == schoolId && b.BranchId == branchId && b.AccountType == "PettyCash");

        if (pettyAcc != null && pettyAcc.CurrentBalance < request.Amount)
        {
            throw new InvalidOperationException($"Petty cash safe only has ৳ {pettyAcc.CurrentBalance:N2}. Please reimburse the petty cash fund first.");
        }

        var year = DateTime.UtcNow.Year;
        var count = await _context.PettyCashVouchers
            .Where(p => p.SchoolId == schoolId && p.BranchId == branchId && p.CreatedAt.Year == year)
            .CountAsync();
        var voucherNo = $"PCV-{year}-{(count + 1):D4}";

        var voucher = new PettyCashVoucher
        {
            SchoolId = schoolId,
            BranchId = branchId,
            VoucherNo = voucherNo,
            VoucherDate = DateTime.UtcNow,
            PayeeName = request.PayeeName.Trim(),
            Amount = request.Amount,
            Category = request.Category,
            Purpose = request.Purpose.Trim(),
            ReceiptAttachment = request.ReceiptAttachment,
            Status = "Approved",
            ApprovedBy = _currentUser.UserId ?? "usr-admin"
        };

        _context.PettyCashVouchers.Add(voucher);

        if (pettyAcc != null)
        {
            pettyAcc.CurrentBalance -= request.Amount;
            pettyAcc.UpdatedAt = DateTime.UtcNow;

            var trx = new BankTransaction
            {
                SchoolId = schoolId,
                BranchId = branchId,
                BankAccountId = pettyAcc.Id,
                TransactionDate = DateTime.UtcNow,
                TransactionType = "ExpenseDebit",
                Amount = request.Amount,
                BalanceAfter = pettyAcc.CurrentBalance,
                ReferenceNo = voucherNo,
                Description = $"Petty cash disbursement for {request.Category}: {request.Purpose}",
                CounterpartyOrAccount = request.PayeeName,
                TransactedBy = _currentUser.UserId ?? "System"
            };
            _context.BankTransactions.Add(trx);
        }

        await _context.SaveChangesAsync();

        return new PettyCashVoucherDto
        {
            Id = voucher.Id,
            BranchId = voucher.BranchId,
            VoucherNo = voucher.VoucherNo,
            VoucherDate = voucher.VoucherDate,
            PayeeName = voucher.PayeeName,
            Amount = voucher.Amount,
            Category = voucher.Category,
            Purpose = voucher.Purpose,
            ReceiptAttachment = voucher.ReceiptAttachment,
            Status = voucher.Status,
            ApprovedBy = voucher.ApprovedBy
        };
    }

    public async Task<bool> ApprovePettyCashVoucherAsync(string id)
    {
        var branchId = _campus.BranchId;
        var schoolId = _campus.SchoolId;

        var voucher = await _context.PettyCashVouchers
            .FirstOrDefaultAsync(p => p.Id == id && p.SchoolId == schoolId && p.BranchId == branchId);

        if (voucher == null) return false;

        voucher.Status = "Approved";
        voucher.ApprovedBy = _currentUser.UserId ?? "usr-admin";
        voucher.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReimbursePettyCashVoucherAsync(string id, string bankAccountId)
    {
        var branchId = _campus.BranchId;
        var schoolId = _campus.SchoolId;

        var voucher = await _context.PettyCashVouchers
            .FirstOrDefaultAsync(p => p.Id == id && p.SchoolId == schoolId && p.BranchId == branchId);

        if (voucher == null) return false;

        var bankAcc = await _context.BankAccounts
            .FirstOrDefaultAsync(b => b.Id == bankAccountId && b.SchoolId == schoolId && b.BranchId == branchId);
        var pettyAcc = await _context.BankAccounts
            .FirstOrDefaultAsync(b => b.SchoolId == schoolId && b.BranchId == branchId && b.AccountType == "PettyCash");

        if (bankAcc == null || pettyAcc == null)
            throw new KeyNotFoundException("Reimbursing bank or petty cash account not found.");

        if (bankAcc.CurrentBalance < voucher.Amount)
            throw new InvalidOperationException($"Insufficient funds in {bankAcc.AccountName} to reimburse ৳ {voucher.Amount:N2}.");

        bankAcc.CurrentBalance -= voucher.Amount;
        pettyAcc.CurrentBalance += voucher.Amount;

        voucher.Status = "Reimbursed";
        voucher.ReimbursedFromBankAccountId = bankAcc.Id;
        voucher.ReimbursedDate = DateTime.UtcNow;
        voucher.UpdatedAt = DateTime.UtcNow;

        var bankTrx = new BankTransaction
        {
            SchoolId = schoolId,
            BranchId = branchId,
            BankAccountId = bankAcc.Id,
            TransactionDate = DateTime.UtcNow,
            TransactionType = "TransferOut",
            Amount = voucher.Amount,
            BalanceAfter = bankAcc.CurrentBalance,
            ReferenceNo = $"REIMB-{voucher.VoucherNo}",
            Description = $"Petty cash voucher reimbursement for {voucher.VoucherNo} ({voucher.Purpose})",
            CounterpartyOrAccount = pettyAcc.AccountName,
            TransactedBy = _currentUser.UserId ?? "System"
        };

        var pettyTrx = new BankTransaction
        {
            SchoolId = schoolId,
            BranchId = branchId,
            BankAccountId = pettyAcc.Id,
            TransactionDate = DateTime.UtcNow,
            TransactionType = "TransferIn",
            Amount = voucher.Amount,
            BalanceAfter = pettyAcc.CurrentBalance,
            ReferenceNo = $"REIMB-{voucher.VoucherNo}",
            Description = $"Float replenishment from {bankAcc.AccountName}",
            CounterpartyOrAccount = bankAcc.AccountName,
            TransactedBy = _currentUser.UserId ?? "System"
        };

        _context.BankTransactions.AddRange(bankTrx, pettyTrx);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<TreasurySummaryDto> GetTreasurySummaryAsync()
    {
        await EnsureDefaultCampusAccountsSeededAsync();

        var branchId = _campus.BranchId;
        var schoolId = _campus.SchoolId;

        var accounts = await _context.BankAccounts
            .Where(b => b.SchoolId == schoolId && b.BranchId == branchId && b.IsActive)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var firstDayOfMonth = new DateTime(now.Year, now.Month, 1);

        var monthlyTrx = await _context.BankTransactions
            .Where(t => t.SchoolId == schoolId && t.BranchId == branchId && t.TransactionDate >= firstDayOfMonth)
            .ToListAsync();

        var bankBalances = accounts
            .Where(a => a.AccountType == "Current" || a.AccountType == "Savings" || a.AccountType == "MobileWallet")
            .Sum(a => a.CurrentBalance);

        var vaultCash = accounts
            .Where(a => a.AccountType == "CashVault")
            .Sum(a => a.CurrentBalance);

        var pettyCash = accounts
            .Where(a => a.AccountType == "PettyCash")
            .Sum(a => a.CurrentBalance);

        var deposits = monthlyTrx
            .Where(t => t.TransactionType == "Deposit" || t.TransactionType == "TransferIn" || t.TransactionType == "CounterCashDeposit")
            .Sum(t => t.Amount);

        var withdrawals = monthlyTrx
            .Where(t => t.TransactionType == "Withdrawal" || t.TransactionType == "TransferOut" || t.TransactionType == "ExpenseDebit" || t.TransactionType == "PayrollDisbursement")
            .Sum(t => t.Amount);

        var pendingPetty = await _context.PettyCashVouchers
            .Where(p => p.SchoolId == schoolId && p.BranchId == branchId && p.Status == "Approved")
            .CountAsync();

        return new TreasurySummaryDto
        {
            TotalLiquidFunds = bankBalances + vaultCash + pettyCash,
            TotalBankBalances = bankBalances,
            TotalVaultCash = vaultCash,
            TotalPettyCashBalance = pettyCash,
            TotalMonthlyDeposits = deposits,
            TotalMonthlyWithdrawals = withdrawals,
            ActiveAccountsCount = accounts.Count,
            PendingPettyCashCount = pendingPetty
        };
    }

    private static BankAccountDto MapToDto(BankAccount a) => new()
    {
        Id = a.Id,
        BranchId = a.BranchId,
        AccountName = a.AccountName,
        AccountNumber = a.AccountNumber,
        BankName = a.BankName,
        BranchName = a.BranchName,
        AccountType = a.AccountType,
        OpeningBalance = a.OpeningBalance,
        CurrentBalance = a.CurrentBalance,
        Currency = a.Currency,
        RoutingNumber = a.RoutingNumber,
        SwiftCode = a.SwiftCode,
        IsDefaultForTuition = a.IsDefaultForTuition,
        IsActive = a.IsActive,
        Notes = a.Notes,
        CreatedAt = a.CreatedAt
    };
}
