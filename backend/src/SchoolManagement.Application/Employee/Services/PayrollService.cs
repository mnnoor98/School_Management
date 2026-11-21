using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Employee.DTOs;
using SchoolManagement.Domain.Employee;

namespace SchoolManagement.Application.Employee.Services;

public class PayrollService : IPayrollService
{
    private readonly IApplicationDbContext _context;

    public PayrollService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<SalaryStructureDto>> GetSalaryStructuresAsync()
    {
        var list = await _context.SalaryStructures
            .AsNoTracking()
            .Include(s => s.Teacher)
            .OrderBy(s => s.EmployeeName)
            .ToListAsync();

        return list.Select(MapSalaryStructureToDto).ToList();
    }

    public async Task<SalaryStructureDto?> GetSalaryStructureByTeacherIdAsync(string teacherId)
    {
        var s = await _context.SalaryStructures
            .AsNoTracking()
            .Include(x => x.Teacher)
            .FirstOrDefaultAsync(x => x.TeacherId == teacherId);

        return s == null ? null : MapSalaryStructureToDto(s);
    }

    public async Task<SalaryStructureDto> UpsertSalaryStructureAsync(UpsertSalaryStructureRequest request)
    {
        var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.Id == request.TeacherId);
        if (teacher == null)
        {
            throw new InvalidOperationException($"Teacher with ID '{request.TeacherId}' not found.");
        }

        var existing = await _context.SalaryStructures
            .FirstOrDefaultAsync(s => s.TeacherId == request.TeacherId);

        if (existing == null)
        {
            existing = new SalaryStructure
            {
                Id = Guid.NewGuid().ToString(),
                SchoolId = teacher.SchoolId,
                BranchId = teacher.BranchId,
                TeacherId = teacher.Id,
                EmployeeCode = teacher.EmployeeCode,
                EmployeeName = teacher.FullName,
                Designation = teacher.Designation,
                Department = teacher.Department
            };
            _context.SalaryStructures.Add(existing);
        }

        existing.BasicPay = request.BasicPay;
        existing.HouseRent = request.HouseRent;
        existing.MedicalAllowance = request.MedicalAllowance;
        existing.Conveyance = request.Conveyance;
        existing.SpecialAllowance = request.SpecialAllowance;
        existing.ProvidentFundPercent = request.ProvidentFundPercent;
        if (!string.IsNullOrEmpty(request.BankName)) existing.BankName = request.BankName;
        if (!string.IsNullOrEmpty(request.BranchName)) existing.BranchName = request.BranchName;
        if (!string.IsNullOrEmpty(request.BankAccountNo)) existing.BankAccountNo = request.BankAccountNo;
        if (!string.IsNullOrEmpty(request.MobileWalletNo)) existing.MobileWalletNo = request.MobileWalletNo;
        if (request.Notes != null) existing.Notes = request.Notes;
        existing.IsActive = true;

        await _context.SaveChangesAsync();
        return MapSalaryStructureToDto(existing);
    }

    public async Task<List<EmployeePayrollDto>> GenerateMonthlyPayrollAsync(GeneratePayrollRequest request, string preparedBy)
    {
        if (string.IsNullOrWhiteSpace(request.SalaryMonthYear))
        {
            request.SalaryMonthYear = DateTime.UtcNow.ToString("yyyy-MM");
        }

        var (startDate, endDate) = ParseMonthYear(request.SalaryMonthYear);
        var totalWorkingDays = DateTime.DaysInMonth(startDate.Year, startDate.Month);

        // 1. Fetch active teachers
        var teachers = await _context.Teachers
            .Where(t => t.Status == "Active")
            .ToListAsync();

        // 2. Fetch existing salary structures
        var structures = await _context.SalaryStructures
            .Where(s => s.IsActive)
            .ToDictionaryAsync(s => s.TeacherId);

        // 3. Fetch approved leaves for the month
        var leaves = await _context.TeacherLeaveApplications
            .Where(l => l.Status == "Approved" && l.StartDate <= endDate && l.EndDate >= startDate)
            .ToListAsync();

        // 4. Fetch existing payroll records for month
        var existingPayrolls = await _context.EmployeePayrolls
            .Where(p => p.SalaryMonthYear == request.SalaryMonthYear)
            .ToDictionaryAsync(p => p.TeacherId);

        var results = new List<EmployeePayroll>();

        foreach (var teacher in teachers)
        {
            // If already generated and marked as Paid, do not overwrite
            if (existingPayrolls.TryGetValue(teacher.Id, out var existing) && existing.PaymentStatus == "Paid")
            {
                results.Add(existing);
                continue;
            }

            // Ensure Salary Structure exists, or seed standard realistic default
            if (!structures.TryGetValue(teacher.Id, out var structure))
            {
                structure = CreateDefaultSalaryStructure(teacher);
                _context.SalaryStructures.Add(structure);
                structures[teacher.Id] = structure;
            }

            // Calculate attendance & leaves
            var teacherLeaves = leaves.Where(l => l.TeacherId == teacher.Id).ToList();
            int paidLeaveDays = teacherLeaves.Where(l => l.LeaveType != "Unpaid Leave" && l.LeaveType != "Leave Without Pay").Sum(l => l.TotalDays);
            int unpaidLeaveDays = teacherLeaves.Where(l => l.LeaveType == "Unpaid Leave" || l.LeaveType == "Leave Without Pay").Sum(l => l.TotalDays);
            int daysPresent = Math.Max(0, totalWorkingDays - (paidLeaveDays + unpaidLeaveDays));

            // Deductions & Pay calculations
            var dailyRate = totalWorkingDays > 0 ? (structure.BasicPay / totalWorkingDays) : (structure.BasicPay / 30m);
            var leaveDeduction = Math.Round(dailyRate * unpaidLeaveDays, 2);
            var pfDeduction = Math.Round(structure.BasicPay * (structure.ProvidentFundPercent / 100m), 2);
            var totalDeductions = leaveDeduction + pfDeduction;
            var grossSalary = structure.GrossSalary;
            var netPayable = Math.Max(0, grossSalary + request.BonusAmount - totalDeductions);

            if (existing == null)
            {
                existing = new EmployeePayroll
                {
                    Id = Guid.NewGuid().ToString(),
                    SchoolId = teacher.SchoolId,
                    BranchId = teacher.BranchId,
                    SalaryMonthYear = request.SalaryMonthYear,
                    PayPeriodStart = startDate,
                    PayPeriodEnd = endDate,
                    TeacherId = teacher.Id,
                    EmployeeCode = teacher.EmployeeCode,
                    EmployeeName = teacher.FullName,
                    Designation = teacher.Designation,
                    Department = teacher.Department,
                    PaymentStatus = "Draft",
                    PreparedBy = preparedBy
                };
                _context.EmployeePayrolls.Add(existing);
            }

            existing.BasicPay = structure.BasicPay;
            existing.HouseRent = structure.HouseRent;
            existing.MedicalAllowance = structure.MedicalAllowance;
            existing.Conveyance = structure.Conveyance;
            existing.SpecialAllowance = structure.SpecialAllowance;
            existing.GrossSalary = grossSalary;
            existing.TotalWorkingDays = totalWorkingDays;
            existing.DaysPresent = daysPresent;
            existing.PaidLeaveDays = paidLeaveDays;
            existing.UnpaidLeaveDays = unpaidLeaveDays;
            existing.LeaveDeduction = leaveDeduction;
            existing.ProvidentFundDeduction = pfDeduction;
            existing.TotalDeductions = totalDeductions;
            existing.BonusAmount = request.BonusAmount;
            existing.BonusParticulars = request.BonusParticulars;
            existing.NetPayable = netPayable;
            existing.PaymentMethod = string.IsNullOrEmpty(structure.BankAccountNo) ? "Cash" : "Bank Transfer";
            existing.BankName = structure.BankName;
            existing.BankAccountNo = structure.BankAccountNo;

            results.Add(existing);
        }

        await _context.SaveChangesAsync();
        return results.Select(MapEmployeePayrollToDto).ToList();
    }

    public async Task<List<EmployeePayrollDto>> GetPayrollsAsync(string salaryMonthYear, string? status)
    {
        if (string.IsNullOrWhiteSpace(salaryMonthYear))
        {
            salaryMonthYear = DateTime.UtcNow.ToString("yyyy-MM");
        }

        var query = _context.EmployeePayrolls
            .AsNoTracking()
            .Where(p => p.SalaryMonthYear == salaryMonthYear);

        if (!string.IsNullOrEmpty(status) && status != "ALL")
        {
            query = query.Where(p => p.PaymentStatus == status);
        }

        var list = await query
            .OrderBy(p => p.EmployeeName)
            .ToListAsync();

        return list.Select(MapEmployeePayrollToDto).ToList();
    }

    public async Task<PayrollSummaryDto> GetPayrollSummaryAsync(string salaryMonthYear)
    {
        if (string.IsNullOrWhiteSpace(salaryMonthYear))
        {
            salaryMonthYear = DateTime.UtcNow.ToString("yyyy-MM");
        }

        var list = await _context.EmployeePayrolls
            .AsNoTracking()
            .Where(p => p.SalaryMonthYear == salaryMonthYear)
            .ToListAsync();

        return new PayrollSummaryDto
        {
            SalaryMonthYear = salaryMonthYear,
            TotalEmployees = list.Count,
            TotalGrossPayroll = list.Sum(p => p.GrossSalary),
            TotalDeductions = list.Sum(p => p.TotalDeductions),
            TotalNetPayable = list.Sum(p => p.NetPayable),
            TotalDisbursed = list.Where(p => p.PaymentStatus == "Paid").Sum(p => p.NetPayable),
            PendingApprovalCount = list.Count(p => p.PaymentStatus == "Draft"),
            PendingDisbursementCount = list.Count(p => p.PaymentStatus == "Approved"),
            FullyPaidCount = list.Count(p => p.PaymentStatus == "Paid")
        };
    }

    public async Task<EmployeePayrollDto?> ApprovePayrollAsync(string id, string approvedBy)
    {
        var payroll = await _context.EmployeePayrolls.FindAsync(id);
        if (payroll == null) return null;

        payroll.PaymentStatus = "Approved";
        payroll.ApprovedBy = approvedBy;
        payroll.ApprovalDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapEmployeePayrollToDto(payroll);
    }

    public async Task<int> BatchApprovePayrollAsync(string salaryMonthYear, string approvedBy)
    {
        var list = await _context.EmployeePayrolls
            .Where(p => p.SalaryMonthYear == salaryMonthYear && p.PaymentStatus == "Draft")
            .ToListAsync();

        foreach (var p in list)
        {
            p.PaymentStatus = "Approved";
            p.ApprovedBy = approvedBy;
            p.ApprovalDate = DateTime.UtcNow;
        }

        return await _context.SaveChangesAsync();
    }

    public async Task<EmployeePayrollDto?> DisbursePayrollAsync(string id, DisbursePayrollRequest request)
    {
        var payroll = await _context.EmployeePayrolls.FindAsync(id);
        if (payroll == null) return null;

        payroll.PaymentStatus = "Paid";
        payroll.PaymentMethod = request.PaymentMethod;
        payroll.DisbursementDate = request.DisbursementDate ?? DateTime.UtcNow;
        if (!string.IsNullOrEmpty(request.TransactionRef)) payroll.TransactionRef = request.TransactionRef;
        if (!string.IsNullOrEmpty(request.Remarks)) payroll.Remarks = request.Remarks;

        await _context.SaveChangesAsync();
        return MapEmployeePayrollToDto(payroll);
    }

    public async Task<int> BatchDisbursePayrollAsync(string salaryMonthYear, DisbursePayrollRequest request)
    {
        var list = await _context.EmployeePayrolls
            .Where(p => p.SalaryMonthYear == salaryMonthYear && p.PaymentStatus == "Approved")
            .ToListAsync();

        var disburseDate = request.DisbursementDate ?? DateTime.UtcNow;

        foreach (var p in list)
        {
            p.PaymentStatus = "Paid";
            p.PaymentMethod = request.PaymentMethod;
            p.DisbursementDate = disburseDate;
            if (!string.IsNullOrEmpty(request.TransactionRef)) p.TransactionRef = request.TransactionRef;
            if (!string.IsNullOrEmpty(request.Remarks)) p.Remarks = request.Remarks;
        }

        return await _context.SaveChangesAsync();
    }

    public async Task<PaySlipDto?> GetPaySlipAsync(string payrollId)
    {
        var p = await _context.EmployeePayrolls
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == payrollId);

        if (p == null) return null;

        var school = await _context.Schools.AsNoTracking().FirstOrDefaultAsync();
        var branch = await _context.Branches.AsNoTracking().FirstOrDefaultAsync(b => b.Id == p.BranchId);

        return new PaySlipDto
        {
            Payroll = MapEmployeePayrollToDto(p),
            SchoolName = school?.Name ?? "Scholars International Academy",
            SchoolAddress = school?.Address ?? "Plot 14, Road 2, Block-E, Dhaka 1212, Bangladesh",
            CampusName = branch?.Name ?? "Main Campus",
            NetPayableInWords = ConvertNumberToWords((long)p.NetPayable) + " Taka Only"
        };
    }

    // Helper: Seed default structure based on designation
    private static SalaryStructure CreateDefaultSalaryStructure(Teacher t)
    {
        decimal basic = 20000;
        decimal house = 8000;
        decimal med = 2500;
        decimal conv = 2500;
        decimal spec = 2000;

        var desig = (t.Designation ?? string.Empty).ToLower();
        if (desig.Contains("professor") || desig.Contains("principal") || desig.Contains("head"))
        {
            basic = 28000; house = 12000; med = 3000; conv = 3000; spec = 4000;
        }
        else if (desig.Contains("senior") || desig.Contains("assistant"))
        {
            basic = 24000; house = 10000; med = 2500; conv = 2500; spec = 3000;
        }

        return new SalaryStructure
        {
            Id = Guid.NewGuid().ToString(),
            SchoolId = t.SchoolId,
            BranchId = t.BranchId,
            TeacherId = t.Id,
            EmployeeCode = t.EmployeeCode,
            EmployeeName = t.FullName,
            Designation = t.Designation ?? string.Empty,
            Department = t.Department ?? string.Empty,
            BasicPay = basic,
            HouseRent = house,
            MedicalAllowance = med,
            Conveyance = conv,
            SpecialAllowance = spec,
            ProvidentFundPercent = 5.0m,
            BankName = "Dutch-Bangla Bank Ltd",
            BranchName = "Dhanmondi Branch",
            BankAccountNo = $"DBBL-110.{new Random().Next(100000, 999999)}",
            IsActive = true
        };
    }

    private static (DateTime start, DateTime end) ParseMonthYear(string monthYear)
    {
        if (DateTime.TryParse(monthYear + "-01", out var date))
        {
            var start = new DateTime(date.Year, date.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var end = new DateTime(date.Year, date.Month, DateTime.DaysInMonth(date.Year, date.Month), 23, 59, 59, DateTimeKind.Utc);
            return (start, end);
        }
        var now = DateTime.UtcNow;
        return (new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc),
                new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month), 23, 59, 59, DateTimeKind.Utc));
    }

    private static SalaryStructureDto MapSalaryStructureToDto(SalaryStructure s) => new()
    {
        Id = s.Id,
        BranchId = s.BranchId,
        TeacherId = s.TeacherId,
        EmployeeCode = s.EmployeeCode,
        EmployeeName = s.EmployeeName,
        Designation = s.Designation,
        Department = s.Department,
        BasicPay = s.BasicPay,
        HouseRent = s.HouseRent,
        MedicalAllowance = s.MedicalAllowance,
        Conveyance = s.Conveyance,
        SpecialAllowance = s.SpecialAllowance,
        GrossSalary = s.GrossSalary,
        ProvidentFundPercent = s.ProvidentFundPercent,
        BankName = s.BankName,
        BranchName = s.BranchName,
        BankAccountNo = s.BankAccountNo,
        MobileWalletNo = s.MobileWalletNo,
        IsActive = s.IsActive,
        Notes = s.Notes
    };

    private static EmployeePayrollDto MapEmployeePayrollToDto(EmployeePayroll p) => new()
    {
        Id = p.Id,
        BranchId = p.BranchId,
        SalaryMonthYear = p.SalaryMonthYear,
        PayPeriodStart = p.PayPeriodStart,
        PayPeriodEnd = p.PayPeriodEnd,
        TeacherId = p.TeacherId,
        EmployeeCode = p.EmployeeCode,
        EmployeeName = p.EmployeeName,
        Designation = p.Designation,
        Department = p.Department,
        BasicPay = p.BasicPay,
        HouseRent = p.HouseRent,
        MedicalAllowance = p.MedicalAllowance,
        Conveyance = p.Conveyance,
        SpecialAllowance = p.SpecialAllowance,
        GrossSalary = p.GrossSalary,
        TotalWorkingDays = p.TotalWorkingDays,
        DaysPresent = p.DaysPresent,
        PaidLeaveDays = p.PaidLeaveDays,
        UnpaidLeaveDays = p.UnpaidLeaveDays,
        LeaveDeduction = p.LeaveDeduction,
        ProvidentFundDeduction = p.ProvidentFundDeduction,
        TaxDeduction = p.TaxDeduction,
        AdvanceSalaryDeduction = p.AdvanceSalaryDeduction,
        OtherDeductions = p.OtherDeductions,
        TotalDeductions = p.TotalDeductions,
        BonusAmount = p.BonusAmount,
        BonusParticulars = p.BonusParticulars,
        NetPayable = p.NetPayable,
        PaymentStatus = p.PaymentStatus,
        PaymentMethod = p.PaymentMethod,
        BankName = p.BankName,
        BankAccountNo = p.BankAccountNo,
        TransactionRef = p.TransactionRef,
        DisbursementDate = p.DisbursementDate,
        PreparedBy = p.PreparedBy,
        ApprovedBy = p.ApprovedBy,
        ApprovalDate = p.ApprovalDate,
        Remarks = p.Remarks
    };

    private static string ConvertNumberToWords(long number)
    {
        if (number == 0) return "Zero";
        if (number < 0) return "Minus " + ConvertNumberToWords(Math.Abs(number));

        string words = "";

        if ((number / 10000000) > 0)
        {
            words += ConvertNumberToWords(number / 10000000) + " Crore ";
            number %= 10000000;
        }

        if ((number / 100000) > 0)
        {
            words += ConvertNumberToWords(number / 100000) + " Lakh ";
            number %= 100000;
        }

        if ((number / 1000) > 0)
        {
            words += ConvertNumberToWords(number / 1000) + " Thousand ";
            number %= 1000;
        }

        if ((number / 100) > 0)
        {
            words += ConvertNumberToWords(number / 100) + " Hundred ";
            number %= 100;
        }

        if (number > 0)
        {
            var unitsMap = new[] { "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen" };
            var tensMap = new[] { "Zero", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety" };

            if (number < 20)
                words += unitsMap[number];
            else
            {
                words += tensMap[number / 10];
                if ((number % 10) > 0)
                    words += " " + unitsMap[number % 10];
            }
        }

        return words.Trim();
    }
}
