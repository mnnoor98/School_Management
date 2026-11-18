using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Auth;
using SchoolManagement.Domain.School;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Student;
using SchoolManagement.Domain.Employee;
using SchoolManagement.Domain.Attendance;
using SchoolManagement.Domain.Exam;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Domain.System;

namespace SchoolManagement.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    // Auth
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<Menu> Menus { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<RoleMenuPermission> RoleMenuPermissions { get; }
    DbSet<UserMenuPermission> UserMenuPermissions { get; }
    DbSet<RefreshToken> RefreshTokens { get; }

    // School
    DbSet<SchoolEntity> Schools { get; }
    DbSet<Branch> Branches { get; }
    DbSet<AcademicYear> AcademicYears { get; }

    // Academic
    DbSet<SchoolClass> Classes { get; }
    DbSet<Section> Sections { get; }
    DbSet<Subject> Subjects { get; }
    DbSet<ClassSubjectMapping> ClassSubjectMappings { get; }
    DbSet<RoutinePeriod> RoutinePeriods { get; }

    // Student
    DbSet<Student> Students { get; }
    DbSet<Enrollment> Enrollments { get; }

    // Employee
    DbSet<Teacher> Teachers { get; }
    DbSet<TeacherLeaveApplication> TeacherLeaveApplications { get; }
    DbSet<SalaryStructure> SalaryStructures { get; }
    DbSet<EmployeePayroll> EmployeePayrolls { get; }

    // Attendance
    DbSet<AttendanceRecord> AttendanceRecords { get; }
    DbSet<AttendanceCorrectionLog> AttendanceCorrectionLogs { get; }

    // Exam
    DbSet<Exam> Exams { get; }
    DbSet<ExamMark> ExamMarks { get; }
    DbSet<ExamScheduleItem> ExamScheduleItems { get; }

    // Finance
    DbSet<FeeType> FeeTypes { get; }
    DbSet<FeeStructure> FeeStructures { get; }
    DbSet<StudentInvoice> StudentInvoices { get; }
    DbSet<FeePayment> FeePayments { get; }
    DbSet<ExpenseCategory> ExpenseCategories { get; }
    DbSet<ExpenseVoucher> ExpenseVouchers { get; }
    DbSet<ExpenseVoucherItem> ExpenseVoucherItems { get; }
    DbSet<BankAccount> BankAccounts { get; }
    DbSet<BankTransaction> BankTransactions { get; }
    DbSet<PettyCashVoucher> PettyCashVouchers { get; }

    // System
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<Notice> Notices { get; }
    DbSet<SmsTemplate> SmsTemplates { get; }
    DbSet<SmsDispatchLog> SmsDispatchLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
