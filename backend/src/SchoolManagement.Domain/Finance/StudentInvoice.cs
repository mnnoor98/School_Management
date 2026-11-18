using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Finance;

public class StudentInvoice : BaseEntity, ICampusScopedEntity
{
    public string BranchId { get; set; } = "br-01";
    public string SchoolId { get; set; } = "sch-01";
    public string InvoiceNo { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string FeeTypeId { get; set; } = string.Empty;
    public string FeeTypeName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; } = 0;
    public decimal DiscountAmount { get; set; } = 0;
    public decimal NetAmount { get; set; } = 0;
    public decimal PaidAmount { get; set; } = 0;
    public decimal DueAmount { get; set; } = 0;
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = "Unpaid";

    public virtual ICollection<FeePayment> Payments { get; set; } = new List<FeePayment>();
}
