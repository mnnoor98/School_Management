using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Finance;

public class ExpenseVoucherItem : BaseEntity, ICampusScopedEntity
{
    public string BranchId { get; set; } = "br-01";
    public string SchoolId { get; set; } = "sch-01";
    public string ExpenseVoucherId { get; set; } = string.Empty;
    public string Particulars { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; } = 0;
    public decimal Amount { get; set; } = 0;

    public virtual ExpenseVoucher? Voucher { get; set; }
}
