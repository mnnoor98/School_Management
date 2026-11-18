using SchoolManagement.Application.Employee.DTOs;

namespace SchoolManagement.Application.Employee.Services;

public interface IPayrollService
{
    Task<List<SalaryStructureDto>> GetSalaryStructuresAsync();
    Task<SalaryStructureDto?> GetSalaryStructureByTeacherIdAsync(string teacherId);
    Task<SalaryStructureDto> UpsertSalaryStructureAsync(UpsertSalaryStructureRequest request);
    Task<List<EmployeePayrollDto>> GenerateMonthlyPayrollAsync(GeneratePayrollRequest request, string preparedBy);
    Task<List<EmployeePayrollDto>> GetPayrollsAsync(string salaryMonthYear, string? status);
    Task<PayrollSummaryDto> GetPayrollSummaryAsync(string salaryMonthYear);
    Task<EmployeePayrollDto?> ApprovePayrollAsync(string id, string approvedBy);
    Task<int> BatchApprovePayrollAsync(string salaryMonthYear, string approvedBy);
    Task<EmployeePayrollDto?> DisbursePayrollAsync(string id, DisbursePayrollRequest request);
    Task<int> BatchDisbursePayrollAsync(string salaryMonthYear, DisbursePayrollRequest request);
    Task<PaySlipDto?> GetPaySlipAsync(string payrollId);
}
