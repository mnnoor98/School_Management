using SchoolManagement.Application.Finance.DTOs;

namespace SchoolManagement.Application.Finance.Services;

public interface IFeeService
{
    Task<List<FeeTypeDto>> GetFeeTypesAsync();
    Task<List<FeeStructureDto>> GetFeeStructuresAsync();
    Task<List<StudentInvoiceDto>> GetInvoicesAsync(string? studentId, List<string>? allowedStudentIds = null);
    Task<List<FeePaymentDto>> GetPaymentsAsync(string? studentId, string? invoiceId, List<string>? allowedStudentIds = null);

    Task<(FeeTypeDto? FeeType, string? Error)> CreateFeeTypeAsync(CreateFeeTypeRequest request);
    Task<(FeeTypeDto? FeeType, string? Error)> UpdateFeeTypeAsync(string id, UpdateFeeTypeRequest request);
    Task<bool> DeleteFeeTypeAsync(string id);

    Task<(FeeStructureDto? FeeStructure, string? Error)> CreateFeeStructureAsync(CreateFeeStructureRequest request);
    Task<(FeeStructureDto? FeeStructure, string? Error)> UpdateFeeStructureAsync(string id, UpdateFeeStructureRequest request);
    Task<bool> DeleteFeeStructureAsync(string id);

    Task<(BatchGenerateInvoicesResult? Result, string? Error)> GenerateBatchInvoicesAsync(BatchGenerateInvoicesRequest request);
    Task<(FeePaymentDto? Payment, string? Error)> CollectPaymentAsync(CollectFeePaymentRequest request, string collectedBy);
    Task<(FeePaymentDto? Payment, string? Error)> BatchCollectPaymentAsync(BatchCollectFeePaymentRequest request, string collectedBy);
    Task<(StudentInvoiceDto? Invoice, string? Error)> CreateInvoiceAsync(CreateStudentInvoiceRequest request);
    Task<(bool Success, string? Error)> ApplyInvoiceDiscountAsync(string id, ApplyInvoiceDiscountRequest request);
    Task<DailyClosingReconciliationDto> GetDailyClosingReportAsync(DateTime date);
}
