using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.Finance.DTOs;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class FeesController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public FeesController(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet("types")]
    public async Task<ActionResult<ApiResponse<List<FeeTypeDto>>>> GetFeeTypes()
    {
        var types = await _context.FeeTypes
            .AsNoTracking()
            .Select(t => new FeeTypeDto
            {
                Id = t.Id,
                Name = t.Name,
                Code = t.Code,
                Frequency = t.Frequency,
                Description = t.Description
            })
            .ToListAsync();

        return Ok(ApiResponse<List<FeeTypeDto>>.Ok(types));
    }

    [HttpGet("structures")]
    public async Task<ActionResult<ApiResponse<List<FeeStructureDto>>>> GetFeeStructures()
    {
        var structures = await _context.FeeStructures
            .AsNoTracking()
            .Select(s => new FeeStructureDto
            {
                Id = s.Id,
                AcademicYearId = s.AcademicYearId,
                ClassId = s.ClassId,
                ClassName = s.ClassName,
                FeeTypeId = s.FeeTypeId,
                FeeTypeName = s.FeeTypeName,
                Amount = s.Amount,
                DueDate = s.DueDate
            })
            .ToListAsync();

        return Ok(ApiResponse<List<FeeStructureDto>>.Ok(structures));
    }

    [HttpGet("invoices")]
    public async Task<ActionResult<ApiResponse<List<StudentInvoiceDto>>>> GetInvoices([FromQuery] string? studentId)
    {
        var query = _context.StudentInvoices.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(studentId)) query = query.Where(i => i.StudentId == studentId);

        var list = await query
            .OrderByDescending(i => i.DueDate)
            .Select(i => new StudentInvoiceDto
            {
                Id = i.Id,
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

        return Ok(ApiResponse<List<StudentInvoiceDto>>.Ok(list));
    }

    [HttpPost("payments")]
    public async Task<ActionResult<ApiResponse<FeePaymentDto>>> CollectPayment([FromBody] CollectFeePaymentRequest request)
    {
        var invoice = await _context.StudentInvoices.FindAsync(request.InvoiceId);
        if (invoice == null) return NotFound(ApiResponse<FeePaymentDto>.Fail("Invoice not found"));

        if (request.AmountPaid <= 0)
        {
            return BadRequest(ApiResponse<FeePaymentDto>.Fail("Payment amount must be greater than zero."));
        }

        invoice.PaidAmount += request.AmountPaid;
        invoice.DueAmount = Math.Max(0, invoice.NetAmount - invoice.PaidAmount);
        invoice.Status = invoice.DueAmount == 0 ? "Paid" : "Partial";
        invoice.UpdatedAt = DateTime.UtcNow;

        string receiptNo = $"RCPT-{DateTime.UtcNow.Year}-" + (new Random().Next(1000, 9999));

        var payment = new FeePayment
        {
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
            CollectedBy = _currentUser.Username ?? "Cashier Office",
            Notes = request.Notes
        };

        _context.FeePayments.Add(payment);
        await _context.SaveChangesAsync();

        var dto = new FeePaymentDto
        {
            Id = payment.Id,
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

        return Ok(ApiResponse<FeePaymentDto>.Ok(dto, "Payment posted and receipt generated"));
    }

    [HttpGet("payments")]
    public async Task<ActionResult<ApiResponse<List<FeePaymentDto>>>> GetPayments([FromQuery] string? studentId)
    {
        var query = _context.FeePayments.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(studentId)) query = query.Where(p => p.StudentId == studentId);

        var list = await query
            .OrderByDescending(p => p.PaymentDate)
            .Select(p => new FeePaymentDto
            {
                Id = p.Id,
                ReceiptNo = p.ReceiptNo,
                InvoiceId = p.InvoiceId,
                StudentId = p.StudentId,
                StudentName = p.StudentName,
                RollNo = p.RollNo,
                ClassName = p.ClassName,
                AmountPaid = p.AmountPaid,
                PaymentMethod = p.PaymentMethod,
                TransactionRef = p.TransactionRef,
                PaymentDate = p.PaymentDate,
                CollectedBy = p.CollectedBy,
                Notes = p.Notes
            })
            .ToListAsync();

        return Ok(ApiResponse<List<FeePaymentDto>>.Ok(list));
    }
}
