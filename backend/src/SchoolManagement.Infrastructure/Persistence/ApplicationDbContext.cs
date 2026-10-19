using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Domain.Auth;
using SchoolManagement.Domain.School;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Student;
using SchoolManagement.Domain.Employee;
using SchoolManagement.Domain.Attendance;
using SchoolManagement.Domain.Exam;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Domain.System;

namespace SchoolManagement.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Auth
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Menu> Menus => Set<Menu>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RoleMenuPermission> RoleMenuPermissions => Set<RoleMenuPermission>();
    public DbSet<UserMenuPermission> UserMenuPermissions => Set<UserMenuPermission>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // School
    public DbSet<SchoolEntity> Schools => Set<SchoolEntity>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<AcademicYear> AcademicYears => Set<AcademicYear>();

    // Academic
    public DbSet<SchoolClass> Classes => Set<SchoolClass>();
    public DbSet<Section> Sections => Set<Section>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<ClassSubjectMapping> ClassSubjectMappings => Set<ClassSubjectMapping>();
    public DbSet<RoutinePeriod> RoutinePeriods => Set<RoutinePeriod>();

    // Student
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();

    // Employee
    public DbSet<Teacher> Teachers => Set<Teacher>();

    // Attendance
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<AttendanceCorrectionLog> AttendanceCorrectionLogs => Set<AttendanceCorrectionLog>();

    // Exam
    public DbSet<Exam> Exams => Set<Exam>();
    public DbSet<ExamMark> ExamMarks => Set<ExamMark>();

    // Finance
    public DbSet<FeeType> FeeTypes => Set<FeeType>();
    public DbSet<FeeStructure> FeeStructures => Set<FeeStructure>();
    public DbSet<StudentInvoice> StudentInvoices => Set<StudentInvoice>();
    public DbSet<FeePayment> FeePayments => Set<FeePayment>();

    // System
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Notice> Notices => Set<Notice>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Schema: auth
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users", "auth");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email);
            entity.Property(e => e.Username).HasMaxLength(100).IsRequired();
            entity.Property(e => e.FullName).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(150);
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("roles", "auth");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SchoolId, e.Code }).IsUnique();
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.ToTable("user_roles", "auth");
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User).WithMany(u => u.UserRoles).HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Role).WithMany(r => r.UserRoles).HasForeignKey(e => e.RoleId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Menu>(entity =>
        {
            entity.ToTable("menus", "auth");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasOne(e => e.Parent).WithMany(m => m.Children).HasForeignKey(e => e.ParentCode).HasPrincipalKey(m => m.Code).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.ToTable("permissions", "auth");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<RoleMenuPermission>(entity =>
        {
            entity.ToTable("role_menu_permissions", "auth");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.RoleId, e.MenuCode }).IsUnique();
            entity.HasOne(e => e.Role).WithMany(r => r.RoleMenuPermissions).HasForeignKey(e => e.RoleId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserMenuPermission>(entity =>
        {
            entity.ToTable("user_menu_permissions", "auth");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.MenuCode, e.Action }).IsUnique();
            entity.HasOne(e => e.User).WithMany(u => u.UserOverrides).HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("refresh_tokens", "auth");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // Schema: school
        modelBuilder.Entity<SchoolEntity>(entity =>
        {
            entity.ToTable("schools", "school");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<Branch>(entity =>
        {
            entity.ToTable("branches", "school");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SchoolId, e.Code }).IsUnique();
        });

        modelBuilder.Entity<AcademicYear>(entity =>
        {
            entity.ToTable("academic_years", "school");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SchoolId, e.Name }).IsUnique();
        });

        // Schema: academic
        modelBuilder.Entity<SchoolClass>(entity =>
        {
            entity.ToTable("classes", "academic");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SchoolId, e.Code }).IsUnique();
        });

        modelBuilder.Entity<Section>(entity =>
        {
            entity.ToTable("sections", "academic");
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.SchoolClass).WithMany(c => c.Sections).HasForeignKey(e => e.ClassId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Subject>(entity =>
        {
            entity.ToTable("subjects", "academic");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FullMarks).HasPrecision(14, 2);
            entity.Property(e => e.PassMarks).HasPrecision(14, 2);
        });

        modelBuilder.Entity<ClassSubjectMapping>(entity =>
        {
            entity.ToTable("class_subjects", "academic");
            entity.HasKey(e => e.Id);
        });

        modelBuilder.Entity<RoutinePeriod>(entity =>
        {
            entity.ToTable("class_routines", "academic");
            entity.HasKey(e => e.Id);
        });

        // Schema: student
        modelBuilder.Entity<Student>(entity =>
        {
            entity.ToTable("students", "student");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SchoolId, e.AdmissionNo }).IsUnique();
        });

        modelBuilder.Entity<Enrollment>(entity =>
        {
            entity.ToTable("enrollments", "student");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SchoolId, e.AcademicYearId, e.SectionId, e.RollNo });
            entity.HasOne(e => e.Student).WithMany(s => s.Enrollments).HasForeignKey(e => e.StudentId).OnDelete(DeleteBehavior.Cascade);
        });

        // Schema: employee
        modelBuilder.Entity<Teacher>(entity =>
        {
            entity.ToTable("teachers", "employee");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SchoolId, e.EmployeeCode }).IsUnique();
        });

        // Schema: attendance
        modelBuilder.Entity<AttendanceRecord>(entity =>
        {
            entity.ToTable("student_attendance", "attendance");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SchoolId, e.StudentId, e.AttendanceDate }).IsUnique();
        });

        modelBuilder.Entity<AttendanceCorrectionLog>(entity =>
        {
            entity.ToTable("attendance_correction_logs", "attendance");
            entity.HasKey(e => e.Id);
        });

        // Schema: exam
        modelBuilder.Entity<Exam>(entity =>
        {
            entity.ToTable("exams", "exam");
            entity.HasKey(e => e.Id);
        });

        modelBuilder.Entity<ExamMark>(entity =>
        {
            entity.ToTable("marks", "exam");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FullMarks).HasPrecision(14, 2);
            entity.Property(e => e.ObtainedMarks).HasPrecision(14, 2);
            entity.Property(e => e.GradePoint).HasPrecision(4, 2);
            entity.HasOne(e => e.Exam).WithMany(m => m.Marks).HasForeignKey(e => e.ExamId).OnDelete(DeleteBehavior.Cascade);
        });

        // Schema: finance
        modelBuilder.Entity<FeeType>(entity =>
        {
            entity.ToTable("fee_types", "finance");
            entity.HasKey(e => e.Id);
        });

        modelBuilder.Entity<FeeStructure>(entity =>
        {
            entity.ToTable("fee_structures", "finance");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Amount).HasPrecision(14, 2);
        });

        modelBuilder.Entity<StudentInvoice>(entity =>
        {
            entity.ToTable("invoices", "finance");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.InvoiceNo).IsUnique();
            entity.Property(e => e.TotalAmount).HasPrecision(14, 2);
            entity.Property(e => e.DiscountAmount).HasPrecision(14, 2);
            entity.Property(e => e.NetAmount).HasPrecision(14, 2);
            entity.Property(e => e.PaidAmount).HasPrecision(14, 2);
            entity.Property(e => e.DueAmount).HasPrecision(14, 2);
        });

        modelBuilder.Entity<FeePayment>(entity =>
        {
            entity.ToTable("payments", "finance");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ReceiptNo).IsUnique();
            entity.Property(e => e.AmountPaid).HasPrecision(14, 2);
            entity.HasOne(e => e.Invoice).WithMany(i => i.Payments).HasForeignKey(e => e.InvoiceId).OnDelete(DeleteBehavior.Cascade);
        });

        // Schema: system
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("audit_logs", "system");
            entity.HasKey(e => e.Id);
        });

        modelBuilder.Entity<Notice>(entity =>
        {
            entity.ToTable("notices", "system");
            entity.HasKey(e => e.Id);
        });
    }
}
