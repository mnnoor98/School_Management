using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Finance.DTOs;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance.Services;

public class ExpenseService : IExpenseService
{
    private readonly IApplicationDbContext _context;
    private readonly ICampusContext _campus;

    public ExpenseService(IApplicationDbContext context, ICampusContext campus)
    {
        _context = context;
        _campus = campus;
    }

    public async Task<List<ExpenseCategoryDto>> GetCategoriesAsync()
    {
        var categories = await _context.ExpenseCategories
            .OrderBy(c => c.Name)
            .ToListAsync();

        if (categories.Count == 0)
        {
            // Seed institutional default categories for the active campus
            var defaults = new List<ExpenseCategory>
            {
                new() { Name = "Utilities (Electricity, Gas, Water)", Code = "UTIL", Description = "Monthly electricity, natural gas, municipal water & sanitation bills", MonthlyBudgetLimit = 45000 },
                new() { Name = "Campus Internet & Broadband", Code = "INET", Description = "Dedicated optical fiber broadband and Wi-Fi networks", MonthlyBudgetLimit = 8000 },
                new() { Name = "Campus Building & Ground Rent", Code = "RENT", Description = "Institutional campus building lease and premise rent", MonthlyBudgetLimit = 150000 },
                new() { Name = "Exam Paper & Question Printing", Code = "EXAM-PRN", Description = "Term examination question printing, answer scripts and tabulation sheets", MonthlyBudgetLimit = 35000 },
                new() { Name = "Office Stationery & Printing", Code = "STAT", Description = "Whiteboard markers, registers, receipts, carbon papers, toner and files", MonthlyBudgetLimit = 15000 },
                new() { Name = "Computer Lab & IT Hardware Maintenance", Code = "IT-LAB", Description = "Computer repairs, lab accessories, router and power backups", MonthlyBudgetLimit = 25000 },
                new() { Name = "Science Lab Chemicals & Equipment", Code = "SCI-LAB", Description = "Physics, Chemistry and Biology experimental apparatus & consumables", MonthlyBudgetLimit = 20000 },
                new() { Name = "Sanitation, Hygiene & Medical Aid", Code = "SANI", Description = "Cleaning detergents, disinfectants, first aid and health supplies", MonthlyBudgetLimit = 12000 },
                new() { Name = "Sports & Cultural Event Expenses", Code = "EVENT", Description = "Annual sports meet, milad, debate, national day observances and trophies", MonthlyBudgetLimit = 50000 },
                new() { Name = "Marketing, Admission Banners & Leaflets", Code = "MKTG", Description = "Admission campaign banners, festoons, newspapers and prospectuses", MonthlyBudgetLimit = 30000 },
                new() { Name = "Petty Cash & Administrative Refreshments", Code = "PETTY", Description = "Official meeting tea, snacks, courier postage and emergency local transit", MonthlyBudgetLimit = 10000 }
            };

            foreach (var d in defaults)
            {
                d.BranchId = _campus.BranchId;
                d.SchoolId = _campus.SchoolId;
                _context.ExpenseCategories.Add(d);
            }

            await _context.SaveChangesAsync();
            categories = await _context.ExpenseCategories.OrderBy(c => c.Name).ToListAsync();
        }

        return categories.Select(c => new ExpenseCategoryDto
        {
            Id = c.Id,
            BranchId = c.BranchId,
            Name = c.Name,
            Code = c.Code,
            Description = c.Description,
            MonthlyBudgetLimit = c.MonthlyBudgetLimit,
            IsActive = c.IsActive
        }).ToList();
    }

    public async Task<(ExpenseCategoryDto? Category, string? Error)> CreateCategoryAsync(CreateExpenseCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return (null, "Category name is required.");

        var code = string.IsNullOrWhiteSpace(request.Code)
            ? request.Name.Replace(" ", "-").ToUpperInvariant()[..Math.Min(10, request.Name.Length)]
            : request.Code.Trim().ToUpperInvariant();

        var exists = await _context.ExpenseCategories.AnyAsync(c => c.Code == code);
        if (exists)
            return (null, $"Expense category with code '{code}' already exists.");

        var entity = new ExpenseCategory
        {
            BranchId = _campus.BranchId,
            SchoolId = _campus.SchoolId,
            Name = request.Name.Trim(),
            Code = code,
            Description = request.Description?.Trim(),
            MonthlyBudgetLimit = request.MonthlyBudgetLimit,
            IsActive = true
        };

        _context.ExpenseCategories.Add(entity);
        await _context.SaveChangesAsync();

        return (new ExpenseCategoryDto
        {
            Id = entity.Id,
            BranchId = entity.BranchId,
            Name = entity.Name,
            Code = entity.Code,
            Description = entity.Description,
            MonthlyBudgetLimit = entity.MonthlyBudgetLimit,
            IsActive = entity.IsActive
        }, null);
    }

    public async Task<(ExpenseCategoryDto? Category, string? Error)> UpdateCategoryAsync(string id, UpdateExpenseCategoryRequest request)
    {
        var entity = await _context.ExpenseCategories.FindAsync(id);
        if (entity == null) return (null, "Category not found.");

        if (!string.IsNullOrWhiteSpace(request.Name)) entity.Name = request.Name.Trim();
        if (!string.IsNullOrWhiteSpace(request.Code)) entity.Code = request.Code.Trim().ToUpperInvariant();
        entity.Description = request.Description?.Trim();
        entity.MonthlyBudgetLimit = request.MonthlyBudgetLimit;
        entity.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        return (new ExpenseCategoryDto
        {
            Id = entity.Id,
            BranchId = entity.BranchId,
            Name = entity.Name,
            Code = entity.Code,
            Description = entity.Description,
            MonthlyBudgetLimit = entity.MonthlyBudgetLimit,
            IsActive = entity.IsActive
        }, null);
    }

    public async Task<bool> DeleteCategoryAsync(string id)
    {
        var entity = await _context.ExpenseCategories.FindAsync(id);
        if (entity == null) return false;

        var hasVouchers = await _context.ExpenseVouchers.AnyAsync(v => v.ExpenseCategoryId == id);
        if (hasVouchers)
        {
            // Soft-deactivate if vouchers exist
            entity.IsActive = false;
        }
        else
        {
            _context.ExpenseCategories.Remove(entity);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<ExpenseVoucherDto>> GetVouchersAsync(DateTime? startDate, DateTime? endDate, string? categoryId, string? status)
    {
        var query = _context.ExpenseVouchers
            .Include(v => v.Items)
            .AsNoTracking();

        if (startDate.HasValue)
        {
            var startUtc = DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc);
            query = query.Where(v => v.ExpenseDate >= startUtc);
        }

        if (endDate.HasValue)
        {
            var endUtc = DateTime.SpecifyKind(endDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
            query = query.Where(v => v.ExpenseDate <= endUtc);
        }

        if (!string.IsNullOrWhiteSpace(categoryId) && categoryId != "ALL")
        {
            query = query.Where(v => v.ExpenseCategoryId == categoryId);
        }

        if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
        {
            query = query.Where(v => v.Status == status);
        }

        var list = await query
            .OrderByDescending(v => v.ExpenseDate)
            .ThenByDescending(v => v.CreatedAt)
            .ToListAsync();

        return list.Select(MapVoucherToDto).ToList();
    }

    public async Task<ExpenseVoucherDto?> GetVoucherByIdAsync(string id)
    {
        var entity = await _context.ExpenseVouchers
            .Include(v => v.Items)
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == id);

        return entity == null ? null : MapVoucherToDto(entity);
    }

    public async Task<(ExpenseVoucherDto? Voucher, string? Error)> CreateVoucherAsync(CreateExpenseVoucherRequest request, string createdBy)
    {
        if (string.IsNullOrWhiteSpace(request.ExpenseCategoryId))
            return (null, "Expense category is required.");

        var category = await _context.ExpenseCategories.FindAsync(request.ExpenseCategoryId);
        if (category == null)
            return (null, "Selected expense category not found.");

        if (string.IsNullOrWhiteSpace(request.PaidTo))
            return (null, "Vendor / Payee name is required.");

        decimal totalAmount = request.TotalAmount ?? 0;

        if (request.Items.Count > 0)
        {
            decimal itemsTotal = request.Items.Sum(i => i.Amount ?? (i.Quantity * i.UnitPrice));
            if (totalAmount <= 0)
            {
                totalAmount = itemsTotal;
            }
        }

        if (totalAmount <= 0)
            return (null, "Expense voucher amount must be greater than zero.");

        var year = DateTime.UtcNow.Year;
        var existingCount = await _context.ExpenseVouchers.CountAsync();
        var voucherNo = $"EXP-{year}-{(existingCount + 1001):D4}";

        var voucher = new ExpenseVoucher
        {
            BranchId = _campus.BranchId,
            SchoolId = _campus.SchoolId,
            VoucherNo = voucherNo,
            ExpenseDate = request.ExpenseDate ?? DateTime.UtcNow,
            ExpenseCategoryId = category.Id,
            CategoryName = category.Name,
            Amount = totalAmount,
            PaymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod) ? "Cash" : request.PaymentMethod,
            BankAccountOrChequeNo = request.BankAccountOrChequeNo?.Trim(),
            PaidTo = request.PaidTo.Trim(),
            ContactPhone = request.ContactPhone?.Trim(),
            AttachmentUrl = request.AttachmentUrl?.Trim(),
            Status = string.IsNullOrWhiteSpace(request.Status) ? "Paid" : request.Status,
            CreatedBy = createdBy,
            Notes = request.Notes?.Trim()
        };

        if (request.Items.Count > 0)
        {
            foreach (var item in request.Items)
            {
                var itemAmt = item.Amount ?? (item.Quantity * item.UnitPrice);
                voucher.Items.Add(new ExpenseVoucherItem
                {
                    BranchId = _campus.BranchId,
                    SchoolId = _campus.SchoolId,
                    Particulars = string.IsNullOrWhiteSpace(item.Particulars) ? category.Name : item.Particulars.Trim(),
                    Quantity = item.Quantity > 0 ? item.Quantity : 1,
                    UnitPrice = item.UnitPrice > 0 ? item.UnitPrice : itemAmt,
                    Amount = itemAmt
                });
            }
        }
        else
        {
            voucher.Items.Add(new ExpenseVoucherItem
            {
                BranchId = _campus.BranchId,
                SchoolId = _campus.SchoolId,
                Particulars = string.IsNullOrWhiteSpace(request.Notes) ? category.Name : request.Notes.Trim(),
                Quantity = 1,
                UnitPrice = totalAmount,
                Amount = totalAmount
            });
        }

        _context.ExpenseVouchers.Add(voucher);
        await _context.SaveChangesAsync();

        return (MapVoucherToDto(voucher), null);
    }

    public async Task<(ExpenseVoucherDto? Voucher, string? Error)> ApproveVoucherAsync(string id, ApproveExpenseVoucherRequest request, string approvedBy)
    {
        var entity = await _context.ExpenseVouchers
            .Include(v => v.Items)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (entity == null) return (null, "Voucher not found.");

        if (request.Action.Equals("Reject", StringComparison.OrdinalIgnoreCase))
        {
            entity.Status = "Rejected";
            entity.Notes = string.IsNullOrWhiteSpace(entity.Notes)
                ? $"Rejected by {approvedBy}: {request.Notes}"
                : $"{entity.Notes} | Rejected by {approvedBy}: {request.Notes}";
        }
        else
        {
            entity.Status = "Approved";
            entity.ApprovedBy = approvedBy;
            entity.ApprovalDate = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(request.Notes))
            {
                entity.Notes = string.IsNullOrWhiteSpace(entity.Notes)
                    ? $"Approved note: {request.Notes}"
                    : $"{entity.Notes} | Approved note: {request.Notes}";
            }
        }

        await _context.SaveChangesAsync();
        return (MapVoucherToDto(entity), null);
    }

    public async Task<bool> DeleteVoucherAsync(string id)
    {
        var entity = await _context.ExpenseVouchers.FindAsync(id);
        if (entity == null) return false;

        _context.ExpenseVouchers.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ExpenseSummaryDto> GetSummaryAsync()
    {
        var today = DateTime.UtcNow.Date;
        var startOfMonth = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var vouchers = await _context.ExpenseVouchers
            .Include(v => v.Items)
            .AsNoTracking()
            .ToListAsync();

        var validVouchers = vouchers.Where(v => v.Status != "Rejected").ToList();

        var todayTotal = validVouchers
            .Where(v => v.ExpenseDate.Date == today)
            .Sum(v => v.Amount);

        var monthTotal = validVouchers
            .Where(v => v.ExpenseDate >= startOfMonth)
            .Sum(v => v.Amount);

        var pendingApprovals = vouchers
            .Where(v => v.Status is "PendingApproval" or "Draft")
            .ToList();

        var byCategory = validVouchers
            .GroupBy(v => v.CategoryName)
            .Select(g => new ExpenseCategorySummaryDto
            {
                CategoryName = g.Key,
                VoucherCount = g.Count(),
                TotalAmount = g.Sum(x => x.Amount)
            })
            .OrderByDescending(x => x.TotalAmount)
            .ToList();

        var recent = vouchers
            .OrderByDescending(v => v.ExpenseDate)
            .ThenByDescending(v => v.CreatedAt)
            .Take(10)
            .Select(MapVoucherToDto)
            .ToList();

        return new ExpenseSummaryDto
        {
            TodayTotal = todayTotal,
            ThisMonthTotal = monthTotal,
            PendingApprovalCount = pendingApprovals.Count,
            PendingApprovalAmount = pendingApprovals.Sum(v => v.Amount),
            ByCategory = byCategory,
            RecentVouchers = recent
        };
    }

    private static ExpenseVoucherDto MapVoucherToDto(ExpenseVoucher v) => new()
    {
        Id = v.Id,
        BranchId = v.BranchId,
        VoucherNo = v.VoucherNo,
        ExpenseDate = v.ExpenseDate,
        ExpenseCategoryId = v.ExpenseCategoryId,
        CategoryName = v.CategoryName,
        Amount = v.Amount,
        PaymentMethod = v.PaymentMethod,
        BankAccountOrChequeNo = v.BankAccountOrChequeNo,
        PaidTo = v.PaidTo,
        ContactPhone = v.ContactPhone,
        AttachmentUrl = v.AttachmentUrl,
        Status = v.Status,
        CreatedBy = v.CreatedBy,
        ApprovedBy = v.ApprovedBy,
        ApprovalDate = v.ApprovalDate,
        Notes = v.Notes,
        Items = v.Items.Select(i => new ExpenseVoucherItemDto
        {
            Id = i.Id,
            ExpenseVoucherId = i.ExpenseVoucherId,
            Particulars = i.Particulars,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            Amount = i.Amount
        }).ToList()
    };
}
