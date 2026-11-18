using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Finance;

public class ExpenseCategory : BaseEntity, ICampusScopedEntity
{
    public string BranchId { get; set; } = "br-01";
    public string SchoolId { get; set; } = "sch-01";
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal MonthlyBudgetLimit { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}
