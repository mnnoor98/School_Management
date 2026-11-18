using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.System;

public class SmsTemplate : BaseEntity, ICampusScopedEntity
{
    public string BranchId { get; set; } = "br-01";
    public string SchoolId { get; set; } = "sch-01";
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public string Content { get; set; } = string.Empty;
}
