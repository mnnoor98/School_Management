using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Finance;

public class FeePayment : BaseEntity, ICampusScopedEntity
{
    public string BranchId { get; set; } = "br-01";
    public string SchoolId { get; set; } = "sch-01";
    public string ReceiptNo { get; set; } = string.Empty;
    public string InvoiceId { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public decimal AmountPaid { get; set; } = 0;
    public string PaymentMethod { get; set; } = "Cash";
    public string? TransactionRef { get; set; }
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public string CollectedBy { get; set; } = string.Empty;
    public string? Notes { get; set; }

    public virtual StudentInvoice? Invoice { get; set; }
}
