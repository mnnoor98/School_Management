namespace SchoolManagement.Application.Employee.DTOs;

public class SalaryStructureDto
{
    public string Id { get; set; } = string.Empty;
    public string BranchId { get; set; } = string.Empty;
    public string TeacherId { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;

    public decimal BasicPay { get; set; }
    public decimal HouseRent { get; set; }
    public decimal MedicalAllowance { get; set; }
    public decimal Conveyance { get; set; }
    public decimal SpecialAllowance { get; set; }
    public decimal GrossSalary { get; set; }

    public decimal ProvidentFundPercent { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string BranchName { get; set; } = string.Empty;
    public string BankAccountNo { get; set; } = string.Empty;
    public string MobileWalletNo { get; set; } = string.Empty;

    public bool IsActive { get; set; }
    public string? Notes { get; set; }
}

public class UpsertSalaryStructureRequest
{
    public string TeacherId { get; set; } = string.Empty;
    public decimal BasicPay { get; set; }
    public decimal HouseRent { get; set; }
    public decimal MedicalAllowance { get; set; }
    public decimal Conveyance { get; set; }
    public decimal SpecialAllowance { get; set; }
    public decimal ProvidentFundPercent { get; set; }
    public string? BankName { get; set; }
    public string? BranchName { get; set; }
    public string? BankAccountNo { get; set; }
    public string? MobileWalletNo { get; set; }
    public string? Notes { get; set; }
}

public class EmployeePayrollDto
{
    public string Id { get; set; } = string.Empty;
    public string BranchId { get; set; } = string.Empty;
    public string SalaryMonthYear { get; set; } = string.Empty;
    public DateTime PayPeriodStart { get; set; }
    public DateTime PayPeriodEnd { get; set; }

    public string TeacherId { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;

    public decimal BasicPay { get; set; }
    public decimal HouseRent { get; set; }
    public decimal MedicalAllowance { get; set; }
    public decimal Conveyance { get; set; }
    public decimal SpecialAllowance { get; set; }
    public decimal GrossSalary { get; set; }

    public int TotalWorkingDays { get; set; }
    public int DaysPresent { get; set; }
    public int PaidLeaveDays { get; set; }
    public int UnpaidLeaveDays { get; set; }

    public decimal LeaveDeduction { get; set; }
    public decimal ProvidentFundDeduction { get; set; }
    public decimal TaxDeduction { get; set; }
    public decimal AdvanceSalaryDeduction { get; set; }
    public decimal OtherDeductions { get; set; }
    public decimal TotalDeductions { get; set; }

    public decimal BonusAmount { get; set; }
    public string? BonusParticulars { get; set; }
    public decimal NetPayable { get; set; }

    public string PaymentStatus { get; set; } = "Draft";
    public string PaymentMethod { get; set; } = "Bank Transfer";
    public string BankName { get; set; } = string.Empty;
    public string BankAccountNo { get; set; } = string.Empty;
    public string? TransactionRef { get; set; }

    public DateTime? DisbursementDate { get; set; }
    public string PreparedBy { get; set; } = string.Empty;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovalDate { get; set; }
    public string? Remarks { get; set; }
}

public class GeneratePayrollRequest
{
    public string SalaryMonthYear { get; set; } = string.Empty; // e.g. "2026-11"
    public decimal BonusAmount { get; set; } = 0;
    public string? BonusParticulars { get; set; }
}

public class DisbursePayrollRequest
{
    public string PaymentMethod { get; set; } = "Bank Transfer";
    public DateTime? DisbursementDate { get; set; }
    public string? TransactionRef { get; set; }
    public string? Remarks { get; set; }
}

public class PayrollSummaryDto
{
    public string SalaryMonthYear { get; set; } = string.Empty;
    public int TotalEmployees { get; set; }
    public decimal TotalGrossPayroll { get; set; }
    public decimal TotalDeductions { get; set; }
    public decimal TotalNetPayable { get; set; }
    public decimal TotalDisbursed { get; set; }
    public int PendingApprovalCount { get; set; }
    public int PendingDisbursementCount { get; set; }
    public int FullyPaidCount { get; set; }
}

public class PaySlipDto
{
    public EmployeePayrollDto Payroll { get; set; } = null!;
    public string SchoolName { get; set; } = string.Empty;
    public string SchoolAddress { get; set; } = string.Empty;
    public string CampusName { get; set; } = string.Empty;
    public string NetPayableInWords { get; set; } = string.Empty;
}
