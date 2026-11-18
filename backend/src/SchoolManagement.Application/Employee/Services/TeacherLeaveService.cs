using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Employee.DTOs;
using SchoolManagement.Domain.Employee;

namespace SchoolManagement.Application.Employee.Services;

public class TeacherLeaveService : ITeacherLeaveService
{
    private readonly IApplicationDbContext _context;

    public TeacherLeaveService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<TeacherLeaveApplicationDto>> GetLeavesAsync(string? status, string? leaveType, string? teacherId, string? search)
    {
        var query = _context.TeacherLeaveApplications.AsNoTracking().AsQueryable();

        if (!string.IsNullOrEmpty(status) && status != "ALL")
            query = query.Where(l => l.Status == status);

        if (!string.IsNullOrEmpty(leaveType) && leaveType != "ALL")
            query = query.Where(l => l.LeaveType == leaveType);

        if (!string.IsNullOrEmpty(teacherId))
            query = query.Where(l => l.TeacherId == teacherId);

        if (!string.IsNullOrEmpty(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(l => l.TeacherName.ToLower().Contains(q) ||
                                     l.EmployeeCode.ToLower().Contains(q) ||
                                     l.Department.ToLower().Contains(q));
        }

        return await query
            .OrderByDescending(l => l.AppliedOn)
            .Select(l => new TeacherLeaveApplicationDto
            {
                Id = l.Id,
                BranchId = l.BranchId,
                TeacherId = l.TeacherId,
                TeacherName = l.TeacherName,
                EmployeeCode = l.EmployeeCode,
                Department = l.Department,
                LeaveType = l.LeaveType,
                StartDate = l.StartDate,
                EndDate = l.EndDate,
                TotalDays = l.TotalDays,
                Reason = l.Reason,
                Status = l.Status,
                AppliedOn = l.AppliedOn,
                ReviewedBy = l.ReviewedBy,
                ReviewRemark = l.ReviewRemark
            })
            .ToListAsync();
    }

    public async Task<TeacherLeaveApplicationDto?> GetLeaveByIdAsync(string id)
    {
        var l = await _context.TeacherLeaveApplications.FindAsync(id);
        if (l == null) return null;

        return new TeacherLeaveApplicationDto
        {
            Id = l.Id,
            BranchId = l.BranchId,
            TeacherId = l.TeacherId,
            TeacherName = l.TeacherName,
            EmployeeCode = l.EmployeeCode,
            Department = l.Department,
            LeaveType = l.LeaveType,
            StartDate = l.StartDate,
            EndDate = l.EndDate,
            TotalDays = l.TotalDays,
            Reason = l.Reason,
            Status = l.Status,
            AppliedOn = l.AppliedOn,
            ReviewedBy = l.ReviewedBy,
            ReviewRemark = l.ReviewRemark
        };
    }

    public async Task<TeacherLeaveApplicationDto> ApplyLeaveAsync(CreateTeacherLeaveRequest req)
    {
        var teacher = await _context.Teachers.FindAsync(req.TeacherId);

        var leave = new TeacherLeaveApplication
        {
            TeacherId = req.TeacherId,
            TeacherName = teacher?.FullName ?? req.TeacherName,
            EmployeeCode = teacher?.EmployeeCode ?? req.EmployeeCode,
            Department = teacher?.Department ?? req.Department,
            LeaveType = req.LeaveType,
            StartDate = DateTime.SpecifyKind(req.StartDate, DateTimeKind.Utc),
            EndDate = DateTime.SpecifyKind(req.EndDate, DateTimeKind.Utc),
            TotalDays = Math.Max(1, req.TotalDays),
            Reason = req.Reason.Trim(),
            Status = "Pending",
            AppliedOn = DateTime.UtcNow
        };

        _context.TeacherLeaveApplications.Add(leave);
        await _context.SaveChangesAsync();

        return new TeacherLeaveApplicationDto
        {
            Id = leave.Id,
            BranchId = leave.BranchId,
            TeacherId = leave.TeacherId,
            TeacherName = leave.TeacherName,
            EmployeeCode = leave.EmployeeCode,
            Department = leave.Department,
            LeaveType = leave.LeaveType,
            StartDate = leave.StartDate,
            EndDate = leave.EndDate,
            TotalDays = leave.TotalDays,
            Reason = leave.Reason,
            Status = leave.Status,
            AppliedOn = leave.AppliedOn
        };
    }

    public async Task<TeacherLeaveApplicationDto?> UpdateStatusAsync(string id, ReviewTeacherLeaveRequest req, string reviewerUsername)
    {
        var leave = await _context.TeacherLeaveApplications.FindAsync(id);
        if (leave == null) return null;

        leave.Status = req.Status is "Approved" or "Rejected" ? req.Status : "Pending";
        leave.ReviewedBy = reviewerUsername;
        leave.ReviewRemark = req.ReviewRemark;
        leave.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new TeacherLeaveApplicationDto
        {
            Id = leave.Id,
            BranchId = leave.BranchId,
            TeacherId = leave.TeacherId,
            TeacherName = leave.TeacherName,
            EmployeeCode = leave.EmployeeCode,
            Department = leave.Department,
            LeaveType = leave.LeaveType,
            StartDate = leave.StartDate,
            EndDate = leave.EndDate,
            TotalDays = leave.TotalDays,
            Reason = leave.Reason,
            Status = leave.Status,
            AppliedOn = leave.AppliedOn,
            ReviewedBy = leave.ReviewedBy,
            ReviewRemark = leave.ReviewRemark
        };
    }

    public async Task<bool> DeleteLeaveAsync(string id)
    {
        var leave = await _context.TeacherLeaveApplications.FindAsync(id);
        if (leave == null) return false;

        _context.TeacherLeaveApplications.Remove(leave);
        await _context.SaveChangesAsync();
        return true;
    }
}
