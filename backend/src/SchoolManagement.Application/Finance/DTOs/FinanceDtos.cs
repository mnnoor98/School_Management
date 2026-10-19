namespace SchoolManagement.Application.Finance.DTOs;

public class FeeTypeDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Frequency { get; set; } = "Monthly";
    public string Description { get; set; } = string.Empty;
}

public class FeeStructureDto
{
    public string Id { get; set; } = string.Empty;
    public string AcademicYearId { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string FeeTypeId { get; set; } = string.Empty;
    public string FeeTypeName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
}

public class StudentInvoiceDto
{
    public string Id { get; set; } = string.Empty;
    public string InvoiceNo { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string FeeTypeId { get; set; } = string.Empty;
    public string FeeTypeName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal NetAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal DueAmount { get; set; }
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = "Unpaid";
}

public class FeePaymentDto
{
    public string Id { get; set; } = string.Empty;
    public string ReceiptNo { get; set; } = string.Empty;
    public string InvoiceId { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public decimal AmountPaid { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string? TransactionRef { get; set; }
    public DateTime PaymentDate { get; set; }
    public string CollectedBy { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class CollectFeePaymentRequest
{
    public string InvoiceId { get; set; } = string.Empty;
    public decimal AmountPaid { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string? TransactionRef { get; set; }
    public string? Notes { get; set; }
}
