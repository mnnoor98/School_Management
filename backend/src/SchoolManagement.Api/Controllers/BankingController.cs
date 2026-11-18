using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.Finance.DTOs;
using SchoolManagement.Application.Finance.Services;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/banking")]
[Authorize]
public class BankingController : ControllerBase
{
    private readonly IBankingService _bankingService;

    public BankingController(IBankingService bankingService)
    {
        _bankingService = bankingService;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<TreasurySummaryDto>>> GetSummary()
    {
        var summary = await _bankingService.GetTreasurySummaryAsync();
        return Ok(ApiResponse<TreasurySummaryDto>.Ok(summary));
    }

    [HttpGet("accounts")]
    public async Task<ActionResult<ApiResponse<List<BankAccountDto>>>> GetAccounts()
    {
        var accounts = await _bankingService.GetAccountsAsync();
        return Ok(ApiResponse<List<BankAccountDto>>.Ok(accounts));
    }

    [HttpGet("accounts/{id}")]
    public async Task<ActionResult<ApiResponse<BankAccountDto>>> GetAccountById(string id)
    {
        var account = await _bankingService.GetAccountByIdAsync(id);
        if (account == null)
            return NotFound(ApiResponse<BankAccountDto>.Fail("Bank account not found."));

        return Ok(ApiResponse<BankAccountDto>.Ok(account));
    }

    [HttpPost("accounts")]
    public async Task<ActionResult<ApiResponse<BankAccountDto>>> CreateAccount([FromBody] CreateBankAccountRequest request)
    {
        try
        {
            var account = await _bankingService.CreateAccountAsync(request);
            return Ok(ApiResponse<BankAccountDto>.Ok(account, "Bank account opened successfully."));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<BankAccountDto>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<BankAccountDto>.Fail(ex.Message));
        }
    }

    [HttpPut("accounts/{id}")]
    public async Task<ActionResult<ApiResponse<BankAccountDto>>> UpdateAccount(string id, [FromBody] CreateBankAccountRequest request)
    {
        try
        {
            var account = await _bankingService.UpdateAccountAsync(id, request);
            return Ok(ApiResponse<BankAccountDto>.Ok(account, "Bank account details updated."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<BankAccountDto>.Fail(ex.Message));
        }
    }

    [HttpPost("accounts/{id}/toggle-status")]
    public async Task<ActionResult<ApiResponse<bool>>> ToggleAccountStatus(string id)
    {
        var result = await _bankingService.ToggleAccountStatusAsync(id);
        return Ok(ApiResponse<bool>.Ok(result, "Account status updated."));
    }

    [HttpGet("transactions")]
    public async Task<ActionResult<ApiResponse<List<BankTransactionDto>>>> GetTransactions(
        [FromQuery] string? bankAccountId,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var txs = await _bankingService.GetTransactionsAsync(bankAccountId, fromDate, toDate);
        return Ok(ApiResponse<List<BankTransactionDto>>.Ok(txs));
    }

    [HttpPost("deposit")]
    public async Task<ActionResult<ApiResponse<BankTransactionDto>>> RecordDeposit([FromBody] DepositWithdrawRequest request)
    {
        try
        {
            request.TransactionType = "Deposit";
            var tx = await _bankingService.RecordDepositOrWithdrawalAsync(request);
            return Ok(ApiResponse<BankTransactionDto>.Ok(tx, "Deposit voucher recorded successfully."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<BankTransactionDto>.Fail(ex.Message));
        }
    }

    [HttpPost("withdraw")]
    public async Task<ActionResult<ApiResponse<BankTransactionDto>>> RecordWithdrawal([FromBody] DepositWithdrawRequest request)
    {
        try
        {
            request.TransactionType = "Withdrawal";
            var tx = await _bankingService.RecordDepositOrWithdrawalAsync(request);
            return Ok(ApiResponse<BankTransactionDto>.Ok(tx, "Withdrawal voucher recorded successfully."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<BankTransactionDto>.Fail(ex.Message));
        }
    }

    [HttpPost("transfer")]
    public async Task<ActionResult<ApiResponse<bool>>> Transfer([FromBody] BankTransferRequest request)
    {
        try
        {
            var result = await _bankingService.TransferBetweenAccountsAsync(request);
            return Ok(ApiResponse<bool>.Ok(result, "Fund transfer completed successfully."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<bool>.Fail(ex.Message));
        }
    }

    [HttpGet("petty-cash")]
    public async Task<ActionResult<ApiResponse<List<PettyCashVoucherDto>>>> GetPettyCash([FromQuery] string? status)
    {
        var vouchers = await _bankingService.GetPettyCashVouchersAsync(status);
        return Ok(ApiResponse<List<PettyCashVoucherDto>>.Ok(vouchers));
    }

    [HttpPost("petty-cash")]
    public async Task<ActionResult<ApiResponse<PettyCashVoucherDto>>> CreatePettyCash([FromBody] CreatePettyCashRequest request)
    {
        try
        {
            var voucher = await _bankingService.CreatePettyCashVoucherAsync(request);
            return Ok(ApiResponse<PettyCashVoucherDto>.Ok(voucher, $"Petty cash voucher {voucher.VoucherNo} issued."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<PettyCashVoucherDto>.Fail(ex.Message));
        }
    }

    [HttpPost("petty-cash/{id}/reimburse")]
    public async Task<ActionResult<ApiResponse<bool>>> ReimbursePettyCash(string id, [FromQuery] string bankAccountId)
    {
        try
        {
            var result = await _bankingService.ReimbursePettyCashVoucherAsync(id, bankAccountId);
            return Ok(ApiResponse<bool>.Ok(result, "Petty cash voucher reimbursed from bank account."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<bool>.Fail(ex.Message));
        }
    }
}
