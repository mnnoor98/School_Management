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
using SchoolManagement.Domain.Common;

namespace SchoolManagement.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    private readonly ICampusContext? _campus;

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ICampusContext campus)
        : base(options) => _campus = campus;

    private bool BypassIsolation => _campus == null || _campus.BypassIsolation;
    private string ScopeSchool => _campus?.SchoolId ?? "";
    private string ScopeBranch => _campus?.BranchId ?? "";
    private string ScopeUser => _campus?.UserId ?? "";
    private bool IsSuperAdmin => _campus?.IsSuperAdmin == true;

    private void ConfigureCampusEntity<TEntity>(ModelBuilder builder) where TEntity : BaseEntity, ICampusScopedEntity
    {
        builder.Entity<TEntity>().Property(e => e.BranchId).IsRequired();
        builder.Entity<TEntity>().HasIndex(e => new { e.SchoolId, e.BranchId });
        builder.Entity<TEntity>().HasOne<Branch>().WithMany()
            .HasForeignKey(e => new { e.SchoolId, e.BranchId })
            .HasPrincipalKey(b => new { b.SchoolId, b.Id }).OnDelete(DeleteBehavior.Restrict);
        builder.Entity<TEntity>().HasQueryFilter(e => BypassIsolation
            || (e.SchoolId == ScopeSchool && e.BranchId == ScopeBranch));
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ValidateCampusWritesAsync(CancellationToken.None).GetAwaiter().GetResult();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override async Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        await ValidateCampusWritesAsync(cancellationToken);
        return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private async Task ValidateCampusWritesAsync(CancellationToken cancellationToken)
    {
        if (BypassIsolation) return;
        ChangeTracker.DetectChanges();
        var entries = ChangeTracker.Entries().Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted).ToList();
        // Anonymous login/refresh may rotate tokens, but cannot write campus data.
        if (entries.All(e => e.Entity is RefreshToken)) return;
        if (_campus?.IsResolved != true) throw new UnauthorizedAccessException("Campus context is required.");
        foreach (var entry in entries)
        {
            if (entry.Entity is AcademicYear academicYear)
            {
                if (entry.State == EntityState.Added)
                {
                    academicYear.SchoolId = ScopeSchool;
                    if (string.IsNullOrEmpty(academicYear.BranchId))
                    {
                        academicYear.BranchId = !string.IsNullOrEmpty(ScopeBranch) ? ScopeBranch : "br-01";
                    }
                }
                else if (academicYear.SchoolId != ScopeSchool || entry.OriginalValues.GetValue<string>("SchoolId") != ScopeSchool)
                {
                    throw new UnauthorizedAccessException("Academic year belongs to another school.");
                }
            }
            else if (entry.Entity is ICampusScopedEntity campusEntity)
            {
                if (string.IsNullOrEmpty(ScopeBranch))
                {
                    if (IsSuperAdmin && entry.Entity is RoleMenuPermission rolePerm && !string.IsNullOrEmpty(rolePerm.BranchId))
                    {
                        rolePerm.SchoolId = ScopeSchool;
                    }
                    else
                    {
                        throw new UnauthorizedAccessException("Select a campus first.");
                    }
                }
                else
                {
                    if (entry.State == EntityState.Added)
                    {
                        campusEntity.SchoolId = ScopeSchool;
                        campusEntity.BranchId = ScopeBranch;
                    }
                    else if (entry.OriginalValues.GetValue<string>("SchoolId") != ScopeSchool
                        || entry.OriginalValues.GetValue<string>("BranchId") != ScopeBranch
                        || campusEntity.SchoolId != ScopeSchool || campusEntity.BranchId != ScopeBranch)
                        throw new UnauthorizedAccessException("Records cannot be changed outside the active campus.");
                }
            }
            else if (entry.Entity is User user)
            {
                if (entry.State == EntityState.Added)
                {
                    var targetBranch = !string.IsNullOrEmpty(ScopeBranch) ? ScopeBranch : user.BranchId;
                    if (string.IsNullOrEmpty(targetBranch) || (!IsSuperAdmin && targetBranch != ScopeBranch)) throw new UnauthorizedAccessException("Select a campus to create accounts.");
                    user.SchoolId = ScopeSchool;
                    user.BranchId = targetBranch;
                }
                else
                {
                    var originalSchool = entry.OriginalValues.GetValue<string>("SchoolId");
                    var originalBranch = entry.OriginalValues.GetValue<string>("BranchId");
                    if (originalSchool != ScopeSchool || user.SchoolId != originalSchool || user.BranchId != originalBranch
                        || (user.Id != ScopeUser && (!IsSuperAdmin && originalBranch != ScopeBranch)))
                        throw new UnauthorizedAccessException("Account is outside the active campus.");
                }
                if (!Roles.Local.Any(r => r.Id == user.RoleId && r.SchoolId == ScopeSchool && r.IsActive)
                    && !await Roles.AnyAsync(r => r.Id == user.RoleId && r.SchoolId == ScopeSchool && r.IsActive, cancellationToken))
                    throw new ArgumentException("Account role must belong to this school and be active.");
            }
            else if (entry.Entity is ISchoolScopedEntity schoolEntity)
            {
                if (entry.State == EntityState.Added) schoolEntity.SchoolId = ScopeSchool;
                else if (schoolEntity.SchoolId != ScopeSchool || entry.OriginalValues.GetValue<string>("SchoolId") != ScopeSchool)
                    throw new UnauthorizedAccessException("Record belongs to another school.");
            }
        }

        // Validate referenced entities using the same filtered queries. This also
        // blocks forged cross-campus IDs on inserts and updates.
        foreach (var entry in entries.Where(e => e.State != EntityState.Deleted))
        {
            if (entry.Entity is RoleMenuPermission grant
                && !await Roles.AnyAsync(r => r.Id == grant.RoleId, cancellationToken))
                throw new UnauthorizedAccessException("Role belongs to another school.");
            if (entry.Entity is UserMenuPermission userGrant
                && !await Users.AnyAsync(u => u.Id == userGrant.UserId && u.BranchId == ScopeBranch, cancellationToken))
                throw new UnauthorizedAccessException("Account belongs to another campus.");
            if (entry.Entity is not ICampusScopedEntity) continue;
            foreach (var (property, entityType) in CampusReferences)
            {
                var value = entry.Metadata.FindProperty(property) == null ? null : entry.Property(property).CurrentValue as string;
                if (string.IsNullOrEmpty(value)) continue;
                var added = entries.Any(e => e.State == EntityState.Added && entityType.IsInstanceOfType(e.Entity)
                    && ((BaseEntity)e.Entity).Id == value);
                if (added) continue;
                var method = typeof(ApplicationDbContext).GetMethod(nameof(ReferenceIsVisibleAsync), System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)!;
                if (!await (Task<bool>)method.MakeGenericMethod(entityType).Invoke(this, new object[] { value, cancellationToken })!)
                    throw new ArgumentException($"{property} must reference a record in the active campus.");
            }
        }
    }

    private static readonly (string Property, Type EntityType)[] CampusReferences =
    {
        ("StudentId", typeof(Student)), ("ClassId", typeof(SchoolClass)), ("SectionId", typeof(Section)),
        ("TeacherId", typeof(Teacher)), ("ClassTeacherId", typeof(Teacher)), ("SubjectId", typeof(Subject)),
        ("AcademicYearId", typeof(AcademicYear)), ("ExamId", typeof(Exam)),
        ("FeeTypeId", typeof(FeeType)), ("InvoiceId", typeof(StudentInvoice)),
        ("AttendanceRecordId", typeof(AttendanceRecord)),
        ("ExpenseCategoryId", typeof(ExpenseCategory)),
        ("ExpenseVoucherId", typeof(ExpenseVoucher)),
        ("SalaryStructureId", typeof(SalaryStructure)),
        ("EmployeePayrollId", typeof(EmployeePayroll)),
        ("BankAccountId", typeof(BankAccount))
    };

    private Task<bool> ReferenceIsVisibleAsync<TEntity>(string id, CancellationToken cancellationToken) where TEntity : BaseEntity
    {
        if (typeof(TEntity) == typeof(AcademicYear))
        {
            return AcademicYears.IgnoreQueryFilters().AsNoTracking()
                .AnyAsync(e => e.Id == id && e.SchoolId == ScopeSchool, cancellationToken);
        }
        return Set<TEntity>().AsNoTracking().AnyAsync(e => e.Id == id, cancellationToken);
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
    public DbSet<TeacherLeaveApplication> TeacherLeaveApplications => Set<TeacherLeaveApplication>();
    public DbSet<SalaryStructure> SalaryStructures => Set<SalaryStructure>();
    public DbSet<EmployeePayroll> EmployeePayrolls => Set<EmployeePayroll>();

    // Attendance
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<AttendanceCorrectionLog> AttendanceCorrectionLogs => Set<AttendanceCorrectionLog>();

    // Exam
    public DbSet<Exam> Exams => Set<Exam>();
    public DbSet<ExamMark> ExamMarks => Set<ExamMark>();
    public DbSet<ExamScheduleItem> ExamScheduleItems => Set<ExamScheduleItem>();

    // Finance
    public DbSet<FeeType> FeeTypes => Set<FeeType>();
    public DbSet<FeeStructure> FeeStructures => Set<FeeStructure>();
    public DbSet<StudentInvoice> StudentInvoices => Set<StudentInvoice>();
    public DbSet<FeePayment> FeePayments => Set<FeePayment>();
    public DbSet<ExpenseCategory> ExpenseCategories => Set<ExpenseCategory>();
    public DbSet<ExpenseVoucher> ExpenseVouchers => Set<ExpenseVoucher>();
    public DbSet<ExpenseVoucherItem> ExpenseVoucherItems => Set<ExpenseVoucherItem>();
    public DbSet<BankAccount> BankAccounts => Set<BankAccount>();
    public DbSet<BankTransaction> BankTransactions => Set<BankTransaction>();
    public DbSet<PettyCashVoucher> PettyCashVouchers => Set<PettyCashVoucher>();

    // System
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Notice> Notices => Set<Notice>();
    public DbSet<SmsTemplate> SmsTemplates => Set<SmsTemplate>();
    public DbSet<SmsDispatchLog> SmsDispatchLogs => Set<SmsDispatchLog>();

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

        modelBuilder.Entity<ExpenseCategory>(entity =>
        {
            entity.ToTable("expense_categories", "finance");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MonthlyBudgetLimit).HasPrecision(14, 2);
        });

        modelBuilder.Entity<ExpenseVoucher>(entity =>
        {
            entity.ToTable("expense_vouchers", "finance");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SchoolId, e.BranchId, e.VoucherNo }).IsUnique();
            entity.Property(e => e.Amount).HasPrecision(14, 2);
            entity.HasOne(e => e.Category).WithMany().HasForeignKey(e => e.ExpenseCategoryId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ExpenseVoucherItem>(entity =>
        {
            entity.ToTable("expense_voucher_items", "finance");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Quantity).HasPrecision(10, 2);
            entity.Property(e => e.UnitPrice).HasPrecision(14, 2);
            entity.Property(e => e.Amount).HasPrecision(14, 2);
            entity.HasOne(e => e.Voucher).WithMany(v => v.Items).HasForeignKey(e => e.ExpenseVoucherId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SalaryStructure>(entity =>
        {
            entity.ToTable("salary_structures", "finance");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SchoolId, e.BranchId, e.TeacherId }).IsUnique();
            entity.Property(e => e.BasicPay).HasPrecision(14, 2);
            entity.Property(e => e.HouseRent).HasPrecision(14, 2);
            entity.Property(e => e.MedicalAllowance).HasPrecision(14, 2);
            entity.Property(e => e.Conveyance).HasPrecision(14, 2);
            entity.Property(e => e.SpecialAllowance).HasPrecision(14, 2);
            entity.Property(e => e.ProvidentFundPercent).HasPrecision(5, 2);
            entity.HasOne(e => e.Teacher).WithMany().HasForeignKey(e => e.TeacherId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<EmployeePayroll>(entity =>
        {
            entity.ToTable("employee_payrolls", "finance");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SchoolId, e.BranchId, e.SalaryMonthYear, e.TeacherId }).IsUnique();
            entity.Property(e => e.BasicPay).HasPrecision(14, 2);
            entity.Property(e => e.HouseRent).HasPrecision(14, 2);
            entity.Property(e => e.MedicalAllowance).HasPrecision(14, 2);
            entity.Property(e => e.Conveyance).HasPrecision(14, 2);
            entity.Property(e => e.SpecialAllowance).HasPrecision(14, 2);
            entity.Property(e => e.GrossSalary).HasPrecision(14, 2);
            entity.Property(e => e.LeaveDeduction).HasPrecision(14, 2);
            entity.Property(e => e.ProvidentFundDeduction).HasPrecision(14, 2);
            entity.Property(e => e.TaxDeduction).HasPrecision(14, 2);
            entity.Property(e => e.AdvanceSalaryDeduction).HasPrecision(14, 2);
            entity.Property(e => e.OtherDeductions).HasPrecision(14, 2);
            entity.Property(e => e.TotalDeductions).HasPrecision(14, 2);
            entity.Property(e => e.BonusAmount).HasPrecision(14, 2);
            entity.Property(e => e.NetPayable).HasPrecision(14, 2);
            entity.HasOne(e => e.Teacher).WithMany().HasForeignKey(e => e.TeacherId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<BankAccount>(entity =>
        {
            entity.ToTable("bank_accounts", "finance");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SchoolId, e.BranchId, e.AccountNumber }).IsUnique();
            entity.Property(e => e.OpeningBalance).HasPrecision(14, 2);
            entity.Property(e => e.CurrentBalance).HasPrecision(14, 2);
        });

        modelBuilder.Entity<BankTransaction>(entity =>
        {
            entity.ToTable("bank_transactions", "finance");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SchoolId, e.BranchId, e.BankAccountId });
            entity.Property(e => e.Amount).HasPrecision(14, 2);
            entity.Property(e => e.BalanceAfter).HasPrecision(14, 2);
            entity.HasOne(e => e.BankAccount).WithMany(b => b.Transactions).HasForeignKey(e => e.BankAccountId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PettyCashVoucher>(entity =>
        {
            entity.ToTable("petty_cash_vouchers", "finance");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SchoolId, e.BranchId, e.VoucherNo }).IsUnique();
            entity.Property(e => e.Amount).HasPrecision(14, 2);
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

        modelBuilder.Entity<TeacherLeaveApplication>(entity =>
        {
            entity.ToTable("teacher_leaves", "employee");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SchoolId, e.BranchId, e.TeacherId });
        });

        modelBuilder.Entity<ExamScheduleItem>(entity =>
        {
            entity.ToTable("exam_schedules", "exam");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FullMarks).HasPrecision(14, 2);
            entity.Property(e => e.PassMarks).HasPrecision(14, 2);
            entity.HasIndex(e => new { e.SchoolId, e.BranchId, e.ExamId, e.ClassId });
        });

        modelBuilder.Entity<SmsTemplate>(entity =>
        {
            entity.ToTable("sms_templates", "system");
            entity.HasKey(e => e.Id);
        });

        modelBuilder.Entity<SmsDispatchLog>(entity =>
        {
            entity.ToTable("sms_logs", "system");
            entity.HasKey(e => e.Id);
        });

        foreach (var entityType in modelBuilder.Model.GetEntityTypes().ToList())
        {
            if (typeof(ICampusScopedEntity).IsAssignableFrom(entityType.ClrType))
                typeof(ApplicationDbContext).GetMethod(nameof(ConfigureCampusEntity), System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)!
                    .MakeGenericMethod(entityType.ClrType).Invoke(this, new object[] { modelBuilder });
        }

        modelBuilder.Entity<SchoolEntity>().HasQueryFilter(e => BypassIsolation || e.Id == ScopeSchool);
        modelBuilder.Entity<Branch>().HasQueryFilter(e => BypassIsolation || (e.SchoolId == ScopeSchool && (IsSuperAdmin || e.Id == ScopeBranch)));
        modelBuilder.Entity<User>().HasQueryFilter(e => BypassIsolation || (e.SchoolId == ScopeSchool && (e.Id == ScopeUser || e.BranchId == ScopeBranch)));
        modelBuilder.Entity<Role>().HasQueryFilter(e => BypassIsolation || e.SchoolId == ScopeSchool);
        modelBuilder.Entity<UserRole>().HasQueryFilter(e => BypassIsolation || e.SchoolId == ScopeSchool);
        modelBuilder.Entity<RefreshToken>().HasQueryFilter(e => BypassIsolation || e.UserId == ScopeUser);
        modelBuilder.Entity<RoleMenuPermission>().HasIndex(e => new { e.RoleId, e.MenuCode }).IsUnique(false);
        modelBuilder.Entity<RoleMenuPermission>().HasIndex(e => new { e.SchoolId, e.BranchId, e.RoleId, e.MenuCode }).IsUnique();

        modelBuilder.Entity<SchoolClass>().HasIndex(e => new { e.SchoolId, e.Code }).IsUnique(false);
        modelBuilder.Entity<SchoolClass>().HasIndex(e => new { e.SchoolId, e.BranchId, e.Code }).IsUnique();
        modelBuilder.Entity<Teacher>().HasIndex(e => new { e.SchoolId, e.EmployeeCode }).IsUnique(false);
        modelBuilder.Entity<Teacher>().HasIndex(e => new { e.SchoolId, e.BranchId, e.EmployeeCode }).IsUnique();
        modelBuilder.Entity<Student>().HasIndex(e => new { e.SchoolId, e.AdmissionNo }).IsUnique(false);
        modelBuilder.Entity<Student>().HasIndex(e => new { e.SchoolId, e.BranchId, e.AdmissionNo }).IsUnique();
        modelBuilder.Entity<AcademicYear>().HasIndex(e => new { e.SchoolId, e.Name }).IsUnique(false);
        modelBuilder.Entity<AcademicYear>().HasIndex(e => new { e.SchoolId, e.BranchId, e.Name }).IsUnique();
    }
}
