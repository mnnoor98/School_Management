using SchoolManagement.Domain.Common;

namespace SchoolManagement.Domain.Employee;

public class SalaryStructure : BaseEntity, ICampusScopedEntity
{
    public string BranchId { get; set; } = "br-01";
    public string SchoolId { get; set; } = "sch-01";
    public string TeacherId { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;

    // Base salary & regular allowances (in BDT)
    public decimal BasicPay { get; set; } = 0;
    public decimal HouseRent { get; set; } = 0;
    public decimal MedicalAllowance { get; set; } = 0;
    public decimal Conveyance { get; set; } = 0;
    public decimal SpecialAllowance { get; set; } = 0;

    // Provident Fund deduction % (e.g. 5.00 for 5%)
    public decimal ProvidentFundPercent { get; set; } = 0;

    // Bank Disbursement details
    public string BankName { get; set; } = "Dutch-Bangla Bank Ltd";
    public string BranchName { get; set; } = "Dhanmondi Branch";
    public string BankAccountNo { get; set; } = string.Empty;
    public string MobileWalletNo { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }

    public decimal GrossSalary => BasicPay + HouseRent + MedicalAllowance + Conveyance + SpecialAllowance;

    // Navigation property
    public virtual Teacher? Teacher { get; set; }
}
