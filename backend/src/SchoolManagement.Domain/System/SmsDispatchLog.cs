using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.System;

public class SmsDispatchLog : BaseEntity, ICampusScopedEntity
{
    public string BranchId { get; set; } = "br-01";
    public string SchoolId { get; set; } = "sch-01";
    public string RecipientGroup { get; set; } = string.Empty;
    public int RecipientCount { get; set; }
    public string Message { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Delivered";
    public int CreditsUsed { get; set; } = 1;
}
