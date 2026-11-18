namespace SchoolManagement.Application.Common.Interfaces;

public class SmsDispatchResult
{
    public bool Success { get; set; } = true;
    public string MessageId { get; set; } = string.Empty;
    public string Status { get; set; } = "Delivered";
    public int CreditsDeducted { get; set; } = 1;
    public string? ErrorMessage { get; set; }
}

public interface ISmsGatewayService
{
    string ProviderName { get; }
    Task<SmsDispatchResult> SendSmsAsync(string recipientPhone, string messageText, CancellationToken cancellationToken = default);
    Task<SmsDispatchResult> SendBulkSmsAsync(IEnumerable<string> recipientPhones, string messageText, CancellationToken cancellationToken = default);
    Task<decimal> GetBalanceAsync(CancellationToken cancellationToken = default);
}
