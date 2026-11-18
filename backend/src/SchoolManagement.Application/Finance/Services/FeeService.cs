using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Finance.DTOs;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance.Services;

public class FeeService : IFeeService
{
    private readonly IApplicationDbContext _context;
    private readonly ISmsGatewayService _smsGateway;
    private readonly ICampusCacheService _cache;

    public FeeService(
        IApplicationDbContext context,
        ISmsGatewayService smsGateway,
        ICampusCacheService cache)
    {
        _context = context;
        _smsGateway = smsGateway;
        _cache = cache;
    }

    public async Task<List<FeeTypeDto>> GetFeeTypesAsync()
    {
        return await _cache.GetOrCreateAsync("fee_types", async () =>
        {
            return await _context.FeeTypes
                .AsNoTracking()
                .Select(t => new FeeTypeDto
                {
                    Id = t.Id,
                    BranchId = t.BranchId,
                    Name = t.Name,
                    Code = t.Code,
                    Frequency = t.Frequency,
                    Description = t.Description
                })
                .ToListAsync();
        });
    }

    public async Task<List<FeeStructureDto>> GetFeeStructuresAsync()
    {
        return await _cache.GetOrCreateAsync("fee_structures", async () =>
        {
            return await _context.FeeStructures
                .AsNoTracking()
                .Select(s => new FeeStructureDto
                {
                    Id = s.Id,
                    BranchId = s.BranchId,
                    AcademicYearId = s.AcademicYearId,
                    ClassId = s.ClassId,
                    ClassName = s.ClassName,
                    FeeTypeId = s.FeeTypeId,
                    FeeTypeName = s.FeeTypeName,
                    Amount = s.Amount,
                    DueDate = s.DueDate
                })
                .ToListAsync();
        });
    }

    public async Task<List<StudentInvoiceDto>> GetInvoicesAsync(string? studentId, List<string>? allowedStudentIds = null)
    {
        var query = _context.StudentInvoices.AsNoTracking().AsQueryable();

        if (allowedStudentIds != null)
        {
            query = query.Where(i => allowedStudentIds.Contains(i.StudentId));
        }
        else if (!string.IsNullOrEmpty(studentId))
        {
            query = query.Where(i => i.StudentId == studentId);
        }

        return await query
            .OrderByDescending(i => i.DueDate)
            .Select(i => new StudentInvoiceDto
            {
                Id = i.Id,
                BranchId = i.BranchId,
                InvoiceNo = i.InvoiceNo,
                StudentId = i.StudentId,
                StudentName = i.StudentName,
                RollNo = i.RollNo,
                ClassName = i.ClassName,
                SectionName = i.SectionName,
                FeeTypeId = i.FeeTypeId,
                FeeTypeName = i.FeeTypeName,
                TotalAmount = i.TotalAmount,
                DiscountAmount = i.DiscountAmount,
                NetAmount = i.NetAmount,
                PaidAmount = i.PaidAmount,
                DueAmount = i.DueAmount,
                DueDate = i.DueDate,
                Status = i.Status
            })
            .ToListAsync();
    }

    public async Task<List<FeePaymentDto>> GetPaymentsAsync(string? studentId, string? invoiceId, List<string>? allowedStudentIds = null)
    {
        var query = _context.FeePayments.AsNoTracking().AsQueryable();

        if (allowedStudentIds != null)
        {
            query = query.Where(p => allowedStudentIds.Contains(p.StudentId));
        }
        else if (!string.IsNullOrEmpty(studentId))
        {
            query = query.Where(p => p.StudentId == studentId);
        }

        if (!string.IsNullOrEmpty(invoiceId))
        {
            query = query.Where(p => p.InvoiceId == invoiceId);
        }

        return await query
            .OrderByDescending(p => p.PaymentDate)
            .Select(p => MapPaymentToDto(p))
            .ToListAsync();
    }

    public async Task<(FeeTypeDto? FeeType, string? Error)> CreateFeeTypeAsync(CreateFeeTypeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return (null, "Fee Type name is required.");
        }

        var code = string.IsNullOrWhiteSpace(request.Code)
            ? "FEE-" + request.Name.Replace(" ", "").ToUpper()
            : request.Code.Trim().ToUpper();

        var exists = await _context.FeeTypes.AnyAsync(t => t.Name.ToLower() == request.Name.Trim().ToLower() || t.Code.ToUpper() == code);
        if (exists)
        {
            return (null, $"Fee Type with name '{request.Name}' or code '{code}' already exists.");
        }

        var feeType = new FeeType
        {
            Id = "ft-" + Guid.NewGuid().ToString("N")[..8],
            Name = request.Name.Trim(),
            Code = code,
            Frequency = string.IsNullOrWhiteSpace(request.Frequency) ? "Monthly" : request.Frequency,
            Description = request.Description?.Trim() ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        _context.FeeTypes.Add(feeType);
        await _context.SaveChangesAsync();
        _cache.Remove("fee_types");

        return (new FeeTypeDto
        {
            Id = feeType.Id,
            BranchId = feeType.BranchId,
            Name = feeType.Name,
            Code = feeType.Code,
            Frequency = feeType.Frequency,
            Description = feeType.Description
        }, null);
    }

    public async Task<(FeeTypeDto? FeeType, string? Error)> UpdateFeeTypeAsync(string id, UpdateFeeTypeRequest request)
    {
        var feeType = await _context.FeeTypes.FindAsync(id);
        if (feeType == null) return (null, "Fee Type not found");

        feeType.Name = request.Name.Trim();
        if (!string.IsNullOrWhiteSpace(request.Code)) feeType.Code = request.Code.Trim().ToUpper();
        feeType.Frequency = request.Frequency;
        feeType.Description = request.Description?.Trim() ?? string.Empty;
        feeType.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        _cache.Remove("fee_types");

        return (new FeeTypeDto
        {
            Id = feeType.Id,
            BranchId = feeType.BranchId,
            Name = feeType.Name,
            Code = feeType.Code,
            Frequency = feeType.Frequency,
            Description = feeType.Description
        }, null);
    }

    public async Task<bool> DeleteFeeTypeAsync(string id)
    {
        var feeType = await _context.FeeTypes.FindAsync(id);
        if (feeType == null) return false;

        var inUse = await _context.FeeStructures.AnyAsync(s => s.FeeTypeId == id) || await _context.StudentInvoices.AnyAsync(i => i.FeeTypeId == id);
        if (inUse) return false;

        _context.FeeTypes.Remove(feeType);
        await _context.SaveChangesAsync();
        _cache.Remove("fee_types");
        return true;
    }

    private static DateTime ToUtc(DateTime dt) => dt.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(dt, DateTimeKind.Utc) : dt.ToUniversalTime();

    public async Task<(FeeStructureDto? FeeStructure, string? Error)> CreateFeeStructureAsync(CreateFeeStructureRequest request)
    {
        var schoolClass = await _context.Classes.FindAsync(request.ClassId);
        if (schoolClass == null) return (null, "Invalid Class ID.");

        var feeType = await _context.FeeTypes.FindAsync(request.FeeTypeId);
        if (feeType == null) return (null, "Invalid Fee Type ID.");

        var existing = await _context.FeeStructures.FirstOrDefaultAsync(s =>
            s.AcademicYearId == request.AcademicYearId && s.ClassId == request.ClassId && s.FeeTypeId == request.FeeTypeId);

        if (existing != null)
        {
            existing.Amount = request.Amount;
            if (request.DueDate.HasValue) existing.DueDate = ToUtc(request.DueDate.Value);
            existing.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            _cache.Remove("fee_structures");

            return (new FeeStructureDto
            {
                Id = existing.Id,
                BranchId = existing.BranchId,
                AcademicYearId = existing.AcademicYearId,
                ClassId = existing.ClassId,
                ClassName = existing.ClassName,
                FeeTypeId = existing.FeeTypeId,
                FeeTypeName = existing.FeeTypeName,
                Amount = existing.Amount,
                DueDate = existing.DueDate
            }, null);
        }

        var structure = new FeeStructure
        {
            Id = "fs-" + Guid.NewGuid().ToString("N")[..8],
            SchoolId = schoolClass.SchoolId,
            BranchId = schoolClass.BranchId,
            AcademicYearId = request.AcademicYearId,
            ClassId = schoolClass.Id,
            ClassName = schoolClass.Name,
            FeeTypeId = feeType.Id,
            FeeTypeName = feeType.Name,
            Amount = request.Amount,
            DueDate = request.DueDate.HasValue ? ToUtc(request.DueDate.Value) : DateTime.UtcNow.AddMonths(1),
            CreatedAt = DateTime.UtcNow
        };

        _context.FeeStructures.Add(structure);
        await _context.SaveChangesAsync();
        _cache.Remove("fee_structures");

        return (new FeeStructureDto
        {
            Id = structure.Id,
            BranchId = structure.BranchId,
            AcademicYearId = structure.AcademicYearId,
            ClassId = structure.ClassId,
            ClassName = structure.ClassName,
            FeeTypeId = structure.FeeTypeId,
            FeeTypeName = structure.FeeTypeName,
            Amount = structure.Amount,
            DueDate = structure.DueDate
        }, null);
    }

    public async Task<(FeeStructureDto? FeeStructure, string? Error)> UpdateFeeStructureAsync(string id, UpdateFeeStructureRequest request)
    {
        var structure = await _context.FeeStructures.FindAsync(id);
        if (structure == null) return (null, "Fee structure not found");

        structure.Amount = request.Amount;
        if (request.DueDate.HasValue) structure.DueDate = ToUtc(request.DueDate.Value);
        structure.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        _cache.Remove("fee_structures");

        return (new FeeStructureDto
        {
            Id = structure.Id,
            BranchId = structure.BranchId,
            AcademicYearId = structure.AcademicYearId,
            ClassId = structure.ClassId,
            ClassName = structure.ClassName,
            FeeTypeId = structure.FeeTypeId,
            FeeTypeName = structure.FeeTypeName,
            Amount = structure.Amount,
            DueDate = structure.DueDate
        }, null);
    }

    public async Task<bool> DeleteFeeStructureAsync(string id)
    {
        var structure = await _context.FeeStructures.FindAsync(id);
        if (structure == null) return false;

        _context.FeeStructures.Remove(structure);
        await _context.SaveChangesAsync();
        _cache.Remove("fee_structures");
        return true;
    }

    public async Task<(BatchGenerateInvoicesResult? Result, string? Error)> GenerateBatchInvoicesAsync(BatchGenerateInvoicesRequest request)
    {
        var feeType = await _context.FeeTypes.FindAsync(request.FeeTypeId);
        if (feeType == null) return (null, "Invalid Fee Type ID.");

        var studentQuery = _context.Students.AsNoTracking().Where(s => s.Status == "Active");
        if (!string.IsNullOrEmpty(request.ClassId) && request.ClassId != "ALL")
        {
            studentQuery = studentQuery.Where(s => s.ClassId == request.ClassId);
        }

        var students = await studentQuery.ToListAsync();
        if (students.Count == 0)
        {
            return (new BatchGenerateInvoicesResult
            {
                TotalGenerated = 0,
                TotalSkipped = 0,
                TotalAmount = 0,
                Message = "No active enrolled students found for the selected criteria."
            }, null);
        }

        var structures = await _context.FeeStructures.AsNoTracking()
            .Where(s => s.FeeTypeId == request.FeeTypeId && (string.IsNullOrEmpty(request.AcademicYearId) || s.AcademicYearId == request.AcademicYearId))
            .ToDictionaryAsync(s => s.ClassId, s => s.Amount);

        int generated = 0;
        int skipped = 0;
        decimal totalAmount = 0;

        var existingInvoices = await _context.StudentInvoices.AsNoTracking()
            .Where(i => i.FeeTypeId == request.FeeTypeId)
            .ToListAsync();

        var existingStudentIds = existingInvoices
            .Where(i => i.FeeTypeName.Contains(request.MonthYear) || (i.DueDate.Month == request.DueDate.Month && i.DueDate.Year == request.DueDate.Year))
            .Select(i => i.StudentId)
            .ToHashSet();

        int seedCounter = (new Random()).Next(100, 999);

        foreach (var student in students)
        {
            if (existingStudentIds.Contains(student.Id))
            {
                skipped++;
                continue;
            }

            decimal amount = structures.TryGetValue(student.ClassId, out var feeAmt) && feeAmt > 0 ? feeAmt : 2500m;
            string invNumber = $"INV-{request.DueDate:yyyyMM}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

            var invoice = new StudentInvoice
            {
                Id = "inv-" + Guid.NewGuid().ToString("N")[..8],
                BranchId = student.BranchId,
                SchoolId = student.SchoolId,
                InvoiceNo = invNumber,
                StudentId = student.Id,
                StudentName = student.FullName,
                RollNo = student.RollNo,
                ClassName = student.ClassName,
                SectionName = student.SectionName,
                FeeTypeId = feeType.Id,
                FeeTypeName = $"{feeType.Name} ({request.MonthYear})",
                TotalAmount = amount,
                DiscountAmount = 0,
                NetAmount = amount,
                PaidAmount = 0,
                DueAmount = amount,
                DueDate = ToUtc(request.DueDate),
                Status = "Unpaid",
                CreatedAt = DateTime.UtcNow
            };

            _context.StudentInvoices.Add(invoice);
            generated++;
            totalAmount += amount;
        }

        if (generated > 0)
        {
            await _context.SaveChangesAsync();
        }

        return (new BatchGenerateInvoicesResult
        {
            TotalGenerated = generated,
            TotalSkipped = skipped,
            TotalAmount = totalAmount,
            Message = $"Successfully generated {generated} invoices (৳ {totalAmount:N0}). {skipped} students already had invoices."
        }, null);
    }

    public async Task<(FeePaymentDto? Payment, string? Error)> CollectPaymentAsync(CollectFeePaymentRequest request, string collectedBy)
    {
        var invoice = await _context.StudentInvoices.FindAsync(request.InvoiceId);
        if (invoice == null) return (null, "Invoice not found");

        if (request.AmountPaid <= 0)
        {
            return (null, "Payment amount must be greater than zero.");
        }

        if (request.AmountPaid > invoice.DueAmount)
        {
            return (null, $"Payment amount cannot exceed the pending due amount (৳ {invoice.DueAmount:N0}).");
        }

        invoice.PaidAmount += request.AmountPaid;
        invoice.DueAmount = Math.Max(0, invoice.NetAmount - invoice.PaidAmount);
        invoice.Status = invoice.DueAmount == 0 ? "Paid" : "Partial";
        invoice.UpdatedAt = DateTime.UtcNow;

        string receiptNo;
        int rAttempt = 0;
        do
        {
            var suffix = Random.Shared.Next(10000, 99999);
            receiptNo = $"RCPT-{DateTime.UtcNow:yyyyMM}-{suffix}";
            rAttempt++;
        } while (await _context.FeePayments.IgnoreQueryFilters().AnyAsync(p => p.ReceiptNo == receiptNo) && rAttempt < 20);

        var payment = new FeePayment
        {
            Id = "pmt-" + Guid.NewGuid().ToString("N")[..8],
            BranchId = invoice.BranchId,
            SchoolId = invoice.SchoolId,
            ReceiptNo = receiptNo,
            InvoiceId = invoice.Id,
            StudentId = invoice.StudentId,
            StudentName = invoice.StudentName,
            RollNo = invoice.RollNo,
            ClassName = invoice.ClassName,
            AmountPaid = request.AmountPaid,
            PaymentMethod = request.PaymentMethod,
            TransactionRef = request.TransactionRef,
            PaymentDate = DateTime.UtcNow,
            CollectedBy = collectedBy,
            Notes = request.Notes
        };

        _context.FeePayments.Add(payment);

        await PostTreasuryLedgerEntryAsync(payment, payment.AmountPaid, payment.PaymentMethod, collectedBy);

        _context.AuditLogs.Add(new SchoolManagement.Domain.System.AuditLog
        {
            BranchId = payment.BranchId,
            SchoolId = payment.SchoolId,
            Action = "Create",
            Module = "Fee Collection",
            TargetRecord = receiptNo,
            Details = $"Collected BDT {payment.AmountPaid:N0} for {payment.StudentName} ({payment.ClassName}, Roll #{payment.RollNo}) via {request.PaymentMethod}",
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        try
        {
            var student = await _context.Students.FindAsync(payment.StudentId);
            if (student != null && !string.IsNullOrWhiteSpace(student.GuardianPhone))
            {
                var text = $"Dear Guardian, fee payment of BDT {payment.AmountPaid:N0} received for {student.FullName}. Receipt: {payment.ReceiptNo}. - Accounts Office";
                await _smsGateway.SendSmsAsync(student.GuardianPhone, text);
            }
        }
        catch { }

        return (MapPaymentToDto(payment), null);
    }

    public async Task<(FeePaymentDto? Payment, string? Error)> BatchCollectPaymentAsync(BatchCollectFeePaymentRequest request, string collectedBy)
    {
        if (request.Items == null || !request.Items.Any())
        {
            return (null, "No invoice items provided for payment.");
        }

        var invoiceIds = request.Items.Select(i => i.InvoiceId).ToList();
        var invoices = await _context.StudentInvoices.Where(i => invoiceIds.Contains(i.Id)).ToListAsync();
        if (!invoices.Any())
        {
            return (null, "None of the specified invoices were found in database.");
        }

        var firstInvoice = invoices.First();
        var student = await _context.Students.FindAsync(request.StudentId) ??
                      await _context.Students.FindAsync(firstInvoice.StudentId);

        decimal totalPaid = 0;
        foreach (var item in request.Items)
        {
            var inv = invoices.FirstOrDefault(i => i.Id == item.InvoiceId);
            if (inv == null || item.AmountPaid <= 0) continue;

            var payAmt = Math.Min(item.AmountPaid, inv.DueAmount);
            inv.PaidAmount += payAmt;
            inv.DueAmount = Math.Max(0, inv.NetAmount - inv.PaidAmount);
            inv.Status = inv.DueAmount == 0 ? "Paid" : "Partial";
            inv.UpdatedAt = DateTime.UtcNow;
            totalPaid += payAmt;
        }

        if (totalPaid <= 0)
        {
            return (null, "Total payment amount must be greater than zero.");
        }

        string receiptNo;
        int rAttempt = 0;
        do
        {
            var suffix = Random.Shared.Next(10000, 99999);
            receiptNo = $"RCPT-{DateTime.UtcNow:yyyyMM}-{suffix}";
            rAttempt++;
        } while (await _context.FeePayments.IgnoreQueryFilters().AnyAsync(p => p.ReceiptNo == receiptNo) && rAttempt < 20);

        var payment = new FeePayment
        {
            Id = "pmt-" + Guid.NewGuid().ToString("N")[..8],
            BranchId = firstInvoice.BranchId,
            SchoolId = firstInvoice.SchoolId,
            ReceiptNo = receiptNo,
            InvoiceId = string.Join(",", invoiceIds),
            StudentId = student?.Id ?? firstInvoice.StudentId,
            StudentName = student?.FullName ?? firstInvoice.StudentName,
            RollNo = student?.RollNo ?? firstInvoice.RollNo,
            ClassName = student?.ClassName ?? firstInvoice.ClassName,
            AmountPaid = totalPaid,
            PaymentMethod = request.PaymentMethod,
            TransactionRef = request.TransactionRef,
            PaymentDate = DateTime.UtcNow,
            CollectedBy = collectedBy,
            Notes = request.Notes ?? $"Multi-invoice receipt for {request.Items.Count} fee items"
        };

        _context.FeePayments.Add(payment);

        await PostTreasuryLedgerEntryAsync(payment, payment.AmountPaid, payment.PaymentMethod, collectedBy);

        _context.AuditLogs.Add(new SchoolManagement.Domain.System.AuditLog
        {
            BranchId = payment.BranchId,
            SchoolId = payment.SchoolId,
            Action = "Create",
            Module = "Fee Collection",
            TargetRecord = receiptNo,
            Details = $"Collected BDT {totalPaid:N0} for {payment.StudentName} ({payment.ClassName}, Roll #{payment.RollNo}) via {request.PaymentMethod}",
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        try
        {
            if (student != null && !string.IsNullOrWhiteSpace(student.GuardianPhone))
            {
                var text = $"Dear Guardian, fee payment of BDT {totalPaid:N0} received for {student.FullName}. Receipt: {receiptNo}. - Accounts Office";
                await _smsGateway.SendSmsAsync(student.GuardianPhone, text);
            }
        }
        catch { }

        return (MapPaymentToDto(payment), null);
    }

    public async Task<(StudentInvoiceDto? Invoice, string? Error)> CreateInvoiceAsync(CreateStudentInvoiceRequest request)
    {
        var student = await _context.Students.FindAsync(request.StudentId);
        if (student == null) return (null, "Student not found in active campus.");

        var feeType = await _context.FeeTypes.FindAsync(request.FeeTypeId);
        if (feeType == null) return (null, "Fee Type not found.");

        decimal amount = request.CustomAmount ?? 0;
        if (amount <= 0)
        {
            var structure = await _context.FeeStructures
                .FirstOrDefaultAsync(s => s.ClassId == student.ClassId && s.FeeTypeId == request.FeeTypeId);
            amount = structure?.Amount ?? 2500;
        }

        string invoiceNo;
        int invAttempt = 0;
        do
        {
            var suffix = Random.Shared.Next(10000, 99999);
            invoiceNo = $"INV-{DateTime.UtcNow:yyyyMM}-{suffix}";
            invAttempt++;
        } while (await _context.StudentInvoices.IgnoreQueryFilters().AnyAsync(i => i.InvoiceNo == invoiceNo) && invAttempt < 20);

        var invoice = new StudentInvoice
        {
            Id = "inv-" + Guid.NewGuid().ToString("N")[..8],
            BranchId = student.BranchId,
            SchoolId = student.SchoolId,
            InvoiceNo = invoiceNo,
            StudentId = student.Id,
            StudentName = student.FullName,
            RollNo = student.RollNo,
            ClassName = student.ClassName,
            SectionName = student.SectionName,
            FeeTypeId = feeType.Id,
            FeeTypeName = $"{feeType.Name} ({DateTime.UtcNow:MMMM yyyy})",
            TotalAmount = amount,
            DiscountAmount = 0,
            NetAmount = amount,
            PaidAmount = 0,
            DueAmount = amount,
            DueDate = ToUtc(request.DueDate ?? DateTime.UtcNow.AddDays(15)),
            Status = "Unpaid",
            CreatedAt = DateTime.UtcNow
        };

        _context.StudentInvoices.Add(invoice);

        _context.AuditLogs.Add(new SchoolManagement.Domain.System.AuditLog
        {
            BranchId = student.BranchId,
            SchoolId = student.SchoolId,
            Action = "Create",
            Module = "Fee Collection",
            TargetRecord = invoiceNo,
            Details = $"Generated fee invoice of BDT {amount:N0} ({invoice.FeeTypeName}) for {student.FullName}",
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return (MapInvoiceToDto(invoice), null);
    }

    public async Task<(bool Success, string? Error)> ApplyInvoiceDiscountAsync(string id, ApplyInvoiceDiscountRequest request)
    {
        var invoice = await _context.StudentInvoices.FindAsync(id);
        if (invoice == null) return (false, "Invoice not found");

        if (request.DiscountAmount < 0 || request.DiscountAmount > invoice.TotalAmount)
        {
            return (false, "Discount cannot exceed total invoice amount.");
        }

        invoice.DiscountAmount = request.DiscountAmount;
        invoice.NetAmount = Math.Max(0, invoice.TotalAmount - invoice.DiscountAmount);
        invoice.DueAmount = Math.Max(0, invoice.NetAmount - invoice.PaidAmount);
        invoice.Status = invoice.DueAmount == 0 ? "Paid" : (invoice.PaidAmount > 0 ? "Partial" : "Unpaid");
        invoice.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<DailyClosingReconciliationDto> GetDailyClosingReportAsync(DateTime date)
    {
        var startOfDay = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        var endOfDay = startOfDay.AddDays(1);

        var payments = await _context.FeePayments
            .AsNoTracking()
            .Where(p => p.PaymentDate >= startOfDay && p.PaymentDate < endOfDay)
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();

        var total = payments.Sum(p => p.AmountPaid);
        var cashTotal = payments.Where(p => p.PaymentMethod.Equals("Cash", StringComparison.OrdinalIgnoreCase)).Sum(p => p.AmountPaid);
        var bkashTotal = payments.Where(p => p.PaymentMethod.Contains("bKash", StringComparison.OrdinalIgnoreCase)).Sum(p => p.AmountPaid);
        var nagadTotal = payments.Where(p => p.PaymentMethod.Contains("Nagad", StringComparison.OrdinalIgnoreCase)).Sum(p => p.AmountPaid);
        var cardTotal = payments.Where(p => p.PaymentMethod.Contains("Card", StringComparison.OrdinalIgnoreCase)).Sum(p => p.AmountPaid);

        var cashierSummary = payments
            .GroupBy(p => p.CollectedBy)
            .Select(g => new CashierClosingSummaryDto
            {
                CashierName = g.Key,
                CashAmount = g.Where(p => p.PaymentMethod.Equals("Cash", StringComparison.OrdinalIgnoreCase)).Sum(p => p.AmountPaid),
                OnlineAmount = g.Where(p => !p.PaymentMethod.Equals("Cash", StringComparison.OrdinalIgnoreCase)).Sum(p => p.AmountPaid),
                TotalAmount = g.Sum(p => p.AmountPaid),
                ReceiptCount = g.Count()
            })
            .ToList();

        var invoiceIds = payments.Select(p => p.InvoiceId).Distinct().ToList();
        var invoices = await _context.StudentInvoices
            .AsNoTracking()
            .Where(i => invoiceIds.Contains(i.Id))
            .ToDictionaryAsync(i => i.Id, i => i.FeeTypeName);

        var feeTypeBreakdown = payments
            .GroupBy(p => invoices.TryGetValue(p.InvoiceId, out var type) ? type : "General Tuition")
            .Select(g => new FeeTypeBreakdownDto
            {
                FeeTypeName = g.Key,
                TotalAmount = g.Sum(p => p.AmountPaid),
                PaymentCount = g.Count()
            })
            .ToList();

        return new DailyClosingReconciliationDto
        {
            Date = startOfDay,
            TotalCollected = total,
            CashTotal = cashTotal,
            BkashTotal = bkashTotal,
            NagadTotal = nagadTotal,
            CardTotal = cardTotal,
            ReceiptCount = payments.Count,
            BreakdownByFeeType = feeTypeBreakdown,
            CashierSummary = cashierSummary,
            Payments = payments.Select(MapPaymentToDto).ToList()
        };
    }

    private async Task PostTreasuryLedgerEntryAsync(FeePayment payment, decimal amountPaid, string paymentMethod, string collectedBy)
    {
        try
        {
            var branchId = payment.BranchId;
            var schoolId = payment.SchoolId;
            var isCash = string.Equals(paymentMethod, "Cash", StringComparison.OrdinalIgnoreCase);

            // 1. Identify target treasury / bank account
            BankAccount? targetAccount = null;

            if (isCash)
            {
                // Match physical safe vault for this campus
                targetAccount = await _context.BankAccounts
                    .FirstOrDefaultAsync(b => b.BranchId == branchId && b.AccountType == "CashVault" && b.IsActive);
            }
            else
            {
                // Digital or Bank (bKash/Nagad/Rocket/Online)
                var isMobile = paymentMethod.Contains("bKash", StringComparison.OrdinalIgnoreCase) ||
                               paymentMethod.Contains("Nagad", StringComparison.OrdinalIgnoreCase) ||
                               paymentMethod.Contains("Rocket", StringComparison.OrdinalIgnoreCase) ||
                               paymentMethod.Contains("Online", StringComparison.OrdinalIgnoreCase);

                if (isMobile)
                {
                    targetAccount = await _context.BankAccounts
                        .FirstOrDefaultAsync(b => b.BranchId == branchId && (b.AccountType == "MobileWallet" || b.AccountName.Contains("Dutch-Bangla") || b.AccountName.Contains("Digital")) && b.IsActive);
                }

                if (targetAccount == null)
                {
                    targetAccount = await _context.BankAccounts
                        .FirstOrDefaultAsync(b => b.BranchId == branchId && b.IsDefaultForTuition && b.IsActive);
                }
            }

            // Fallback: any active bank account for this branch
            if (targetAccount == null)
            {
                targetAccount = await _context.BankAccounts
                    .FirstOrDefaultAsync(b => b.BranchId == branchId && b.IsActive);
            }

            // If still null, create default Cash Vault for this campus to maintain 100% integrity
            if (targetAccount == null)
            {
                targetAccount = new BankAccount
                {
                    SchoolId = schoolId,
                    BranchId = branchId,
                    AccountName = isCash ? "Campus Cash Counter Safe Vault" : "Sonali Bank - Main Tuition Account",
                    AccountNumber = isCash ? $"VAULT-{branchId.ToUpperInvariant()}-MAIN" : "0102-33001824",
                    BankName = isCash ? "Campus Treasury Vault" : "Sonali Bank PLC",
                    BranchName = "Principal Cash Office",
                    AccountType = isCash ? "CashVault" : "Current",
                    OpeningBalance = 0m,
                    CurrentBalance = 0m,
                    Currency = "BDT",
                    IsDefaultForTuition = !isCash,
                    IsActive = true,
                    Notes = "Auto-initialized campus treasury vault for fee collections."
                };
                _context.BankAccounts.Add(targetAccount);
            }

            // 2. Increment target account balance in real-time
            targetAccount.CurrentBalance += amountPaid;

            // 3. Record BankTransaction double-entry credit
            var txType = isCash ? "CounterCashDeposit" : "Deposit";
            var bankTx = new BankTransaction
            {
                Id = "btx-" + Guid.NewGuid().ToString("N")[..8],
                SchoolId = schoolId,
                BranchId = branchId,
                BankAccountId = targetAccount.Id,
                TransactionDate = DateTime.UtcNow,
                TransactionType = txType,
                Amount = amountPaid,
                BalanceAfter = targetAccount.CurrentBalance,
                ReferenceNo = !string.IsNullOrWhiteSpace(payment.TransactionRef) ? payment.TransactionRef : payment.ReceiptNo,
                Description = $"Tuition/Fee receipt {payment.ReceiptNo} - {payment.StudentName} ({payment.ClassName}, Roll #{payment.RollNo})",
                CounterpartyOrAccount = payment.StudentName,
                DepositSlipAttachment = null,
                TransactedBy = string.IsNullOrWhiteSpace(collectedBy) ? "Cashier" : collectedBy
            };

            _context.BankTransactions.Add(bankTx);
        }
        catch (Exception ex)
        {
            // Non-blocking log to ensure fee payment completes even if banking mapping edge-case occurs
            Console.WriteLine($"[TreasuryLedgerBridge Error]: {ex.Message}");
        }
    }

    private static FeePaymentDto MapPaymentToDto(FeePayment payment) => new()
    {
        Id = payment.Id,
        BranchId = payment.BranchId,
        ReceiptNo = payment.ReceiptNo,
        InvoiceId = payment.InvoiceId,
        StudentId = payment.StudentId,
        StudentName = payment.StudentName,
        RollNo = payment.RollNo,
        ClassName = payment.ClassName,
        AmountPaid = payment.AmountPaid,
        PaymentMethod = payment.PaymentMethod,
        TransactionRef = payment.TransactionRef,
        PaymentDate = payment.PaymentDate,
        CollectedBy = payment.CollectedBy,
        Notes = payment.Notes
    };

    private static StudentInvoiceDto MapInvoiceToDto(StudentInvoice i) => new()
    {
        Id = i.Id,
        BranchId = i.BranchId,
        InvoiceNo = i.InvoiceNo,
        StudentId = i.StudentId,
        StudentName = i.StudentName,
        RollNo = i.RollNo,
        ClassName = i.ClassName,
        SectionName = i.SectionName,
        FeeTypeId = i.FeeTypeId,
        FeeTypeName = i.FeeTypeName,
        TotalAmount = i.TotalAmount,
        DiscountAmount = i.DiscountAmount,
        NetAmount = i.NetAmount,
        PaidAmount = i.PaidAmount,
        DueAmount = i.DueAmount,
        DueDate = i.DueDate,
        Status = i.Status
    };
}
