using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Employee;

public class EmployeePayroll : BaseEntity, ICampusScopedEntity
{
    public string BranchId { get; set; } = "br-01";
    public string SchoolId { get; set; } = "sch-01";

    // Payroll period e.g. "2026-11" or "November 2026"
    public string SalaryMonthYear { get; set; } = string.Empty;
    public DateTime PayPeriodStart { get; set; }
    public DateTime PayPeriodEnd { get; set; }

    public string TeacherId { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;

    // Fixed Structure components
    public decimal BasicPay { get; set; } = 0;
    public decimal HouseRent { get; set; } = 0;
    public decimal MedicalAllowance { get; set; } = 0;
    public decimal Conveyance { get; set; } = 0;
    public decimal SpecialAllowance { get; set; } = 0;
    public decimal GrossSalary { get; set; } = 0;

    // Attendance & working days evaluation
    public int TotalWorkingDays { get; set; } = 30;
    public int DaysPresent { get; set; } = 30;
    public int PaidLeaveDays { get; set; } = 0;
    public int UnpaidLeaveDays { get; set; } = 0;

    // Deductions
    public decimal LeaveDeduction { get; set; } = 0;
    public decimal ProvidentFundDeduction { get; set; } = 0;
    public decimal TaxDeduction { get; set; } = 0;
    public decimal AdvanceSalaryDeduction { get; set; } = 0;
    public decimal OtherDeductions { get; set; } = 0;
    public decimal TotalDeductions { get; set; } = 0;

    // Additions (e.g. Festival/Eid Bonus, Overtime)
    public decimal BonusAmount { get; set; } = 0;
    public string? BonusParticulars { get; set; }

    // Final Net Amount Payable
    public decimal NetPayable { get; set; } = 0;

    // Workflow: "Draft" -> "Approved" -> "Paid"
    public string PaymentStatus { get; set; } = "Draft";
    public string PaymentMethod { get; set; } = "Bank Transfer";
    public string BankName { get; set; } = string.Empty;
    public string BankAccountNo { get; set; } = string.Empty;
    public string? TransactionRef { get; set; }

    public DateTime? DisbursementDate { get; set; }
    public string PreparedBy { get; set; } = "admin";
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovalDate { get; set; }
    public string? Remarks { get; set; }

    // Navigation property
    public virtual Teacher? Teacher { get; set; }
}
