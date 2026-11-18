namespace SchoolManagement.Application.System.DTOs;

public class SmsTemplateDto
{
    public string Id { get; set; } = string.Empty;
    public string BranchId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public string Content { get; set; } = string.Empty;
}

public class CreateSmsTemplateRequest
{
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public string Content { get; set; } = string.Empty;
}

public class SmsDispatchLogDto
{
    public string Id { get; set; } = string.Empty;
    public string BranchId { get; set; } = string.Empty;
    public string RecipientGroup { get; set; } = string.Empty;
    public int RecipientCount { get; set; }
    public string Message { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
    public string Status { get; set; } = "Delivered";
    public int CreditsUsed { get; set; }
}

public class SendSmsDispatchRequest
{
    public string RecipientGroup { get; set; } = string.Empty;
    public int RecipientCount { get; set; }
    public string Message { get; set; } = string.Empty;
}
