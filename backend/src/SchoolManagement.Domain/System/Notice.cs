using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.System;

public class Notice : BaseEntity, ISchoolScopedEntity
{
    public string SchoolId { get; set; } = "sch-01";
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public string TargetAudience { get; set; } = "All";
    public DateTime PublishedDate { get; set; } = DateTime.UtcNow;
    public string Content { get; set; } = string.Empty;
    public bool IsImportant { get; set; } = false;
    public string Author { get; set; } = "Principal Office";
}
