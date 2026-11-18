namespace SchoolManagement.Application.Finance.DTOs;

public class FeeTypeDto
{
    public string BranchId { get; set; } = string.Empty;
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Frequency { get; set; } = "Monthly";
    public string Description { get; set; } = string.Empty;
}

public class FeeStructureDto
{
    public string BranchId { get; set; } = string.Empty;
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
    public string BranchId { get; set; } = string.Empty;
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
    public string BranchId { get; set; } = string.Empty;
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

public class BatchCollectFeePaymentItem
{
    public string InvoiceId { get; set; } = string.Empty;
    public decimal AmountPaid { get; set; }
}

public class BatchCollectFeePaymentRequest
{
    public string StudentId { get; set; } = string.Empty;
    public List<BatchCollectFeePaymentItem> Items { get; set; } = new();
    public string PaymentMethod { get; set; } = "Cash";
    public string? TransactionRef { get; set; }
    public string? Notes { get; set; }
    public decimal? Discount { get; set; }
    public decimal? LateFee { get; set; }
}

public class CreateStudentInvoiceRequest
{
    public string StudentId { get; set; } = string.Empty;
    public string FeeTypeId { get; set; } = string.Empty;
    public decimal? CustomAmount { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Notes { get; set; }
}

public class CreateFeeTypeRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Frequency { get; set; } = "Monthly";
    public string Description { get; set; } = string.Empty;
}

public class UpdateFeeTypeRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Frequency { get; set; } = "Monthly";
    public string Description { get; set; } = string.Empty;
}

public class CreateFeeStructureRequest
{
    public string AcademicYearId { get; set; } = "ay-2026";
    public string ClassId { get; set; } = string.Empty;
    public string FeeTypeId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime? DueDate { get; set; }
}

public class UpdateFeeStructureRequest
{
    public decimal Amount { get; set; }
    public DateTime? DueDate { get; set; }
}

public class BatchGenerateInvoicesRequest
{
    public string AcademicYearId { get; set; } = "ay-2026";
    public string? ClassId { get; set; }
    public string FeeTypeId { get; set; } = string.Empty;
    public string MonthYear { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
}

public class BatchGenerateInvoicesResult
{
    public int TotalGenerated { get; set; }
    public int TotalSkipped { get; set; }
    public decimal TotalAmount { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class ApplyInvoiceDiscountRequest
{
    public decimal DiscountAmount { get; set; }
}

public class InitiateOnlinePaymentRequest
{
    public string InvoiceId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "bKash";
    public string? CustomerPhone { get; set; }
}

public class InitiateOnlinePaymentResponse
{
    public string GatewayUrl { get; set; } = string.Empty;
    public string TransactionId { get; set; } = string.Empty;
    public string InvoiceId { get; set; } = string.Empty;
    public string InvoiceNo { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "bKash";
    public string Status { get; set; } = "Initiated";
}

public class ExecuteOnlinePaymentRequest
{
    public string TransactionId { get; set; } = string.Empty;
    public string InvoiceId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "bKash";
    public string? TransactionRef { get; set; }
}

public class FeeTypeBreakdownDto
{
    public string FeeTypeName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public int PaymentCount { get; set; }
}

public class CashierClosingSummaryDto
{
    public string CashierName { get; set; } = string.Empty;
    public decimal CashAmount { get; set; }
    public decimal OnlineAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public int ReceiptCount { get; set; }
}

public class DailyClosingReconciliationDto
{
    public DateTime Date { get; set; }
    public decimal TotalCollected { get; set; }
    public decimal CashTotal { get; set; }
    public decimal BkashTotal { get; set; }
    public decimal NagadTotal { get; set; }
    public decimal CardTotal { get; set; }
    public int ReceiptCount { get; set; }
    public List<FeeTypeBreakdownDto> BreakdownByFeeType { get; set; } = new();
    public List<CashierClosingSummaryDto> CashierSummary { get; set; } = new();
    public List<FeePaymentDto> Payments { get; set; } = new();
}

