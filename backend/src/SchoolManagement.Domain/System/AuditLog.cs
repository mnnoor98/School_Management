using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.System;

public class AuditLog : BaseEntity, ICampusScopedEntity
{
    public string BranchId { get; set; } = "br-01";
    public string SchoolId { get; set; } = "sch-01";
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string UserName { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
    public string Action { get; set; } = "Create";
    public string Module { get; set; } = string.Empty;
    public string TargetRecord { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string SchoolScope { get; set; } = "Main Branch";
}
