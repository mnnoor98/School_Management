using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Attendance;
using SchoolManagement.Domain.Auth;
using SchoolManagement.Domain.Common;
using SchoolManagement.Domain.Employee;
using SchoolManagement.Domain.Exam;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Domain.School;
using SchoolManagement.Domain.Student;
using SchoolManagement.Domain.System;

namespace SchoolManagement.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task InitializeAsync(ApplicationDbContext context)
    {
        await context.Database.MigrateAsync();

        try
        {
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE academic.classes ADD COLUMN IF NOT EXISTS \"IsActive\" boolean NOT NULL DEFAULT true;");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"DB column patch note: {ex.Message}");
        }

        if (await context.Schools.AnyAsync())
        {
            await EnsureInstitutionalTiersAsync(context);
            return; // DB has already been seeded
        }

        // 1. School & Branch
        var school = new SchoolEntity
        {
            Id = "sch-01",
            Name = "Scholars International Academy",
            Code = "SCH-01",
            Address = "Plot 14, Road 2, Block-E, Dhaka 1212",
            Contact = "+880 1711-000000",
            Email = "info@scholarsacademy.edu.bd",
            Logo = "assets/images/logo.png",
            Website = "https://scholarsacademy.edu.bd",
            Status = "Active",
            Timezone = "Asia/Dhaka"
        };
        context.Schools.Add(school);

        var branch = new Branch
        {
            Id = "br-01",
            SchoolId = school.Id,
            Code = "BR-01",
            Name = "Main Campus",
            Address = "Plot 14, Road 2, Block-E, Dhaka",
            Phone = "+880 1711-000000",
            IsActive = true
        };

        var branch2 = new Branch
        {
            Id = "br-02",
            SchoolId = school.Id,
            Code = "BR-02",
            Name = "Uttara Campus",
            Address = "Sector 4, Uttara, Dhaka",
            Phone = "+880 1711-000002",
            IsActive = true
        };
        context.Branches.AddRange(branch, branch2);

        var academicYear = new AcademicYear
        {
            Id = "ay-2026",
            SchoolId = school.Id,
            Name = "2026-2027",
            StartDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2026, 12, 31, 23, 59, 59, DateTimeKind.Utc),
            IsCurrent = true,
            IsLocked = false
        };
        context.AcademicYears.Add(academicYear);

        // 2. Roles
        var superAdminRole = new Role
        {
            Id = "role-superadmin",
            SchoolId = school.Id,
            Code = "SUPER_ADMIN",
            Name = "Super Admin",
            Description = "Unrestricted administrative authority across all modules",
            IsSystem = true,
            IsActive = true
        };

        var teacherRole = new Role
        {
            Id = "role-teacher",
            SchoolId = school.Id,
            Code = "TEACHER",
            Name = "Teacher",
            Description = "Academic operations, attendance roster, and exam marks",
            IsSystem = true,
            IsActive = true
        };

        var studentRole = new Role
        {
            Id = "role-student",
            SchoolId = school.Id,
            Code = "STUDENT",
            Name = "Student",
            Description = "Self-service academic portal for timetable, marks, and invoices",
            IsSystem = true,
            IsActive = true
        };

        var guardianRole = new Role
        {
            Id = "role-guardian",
            SchoolId = school.Id,
            Code = "GUARDIAN",
            Name = "Guardian",
            Description = "Parental portal for tracking student progress and tuition",
            IsSystem = true,
            IsActive = true
        };

        var accountantRole = new Role
        {
            Id = "role-accountant",
            SchoolId = school.Id,
            Code = "ACCOUNTANT",
            Name = "Accountant",
            Description = "Fee structures, invoicing, receipt collection, and ledger",
            IsSystem = true,
            IsActive = true
        };

        context.Roles.AddRange(superAdminRole, teacherRole, studentRole, guardianRole, accountantRole);

        // 3. Users (Passwords: <username>123)
        var users = new List<User>
        {
            new()
            {
                Id = "usr-admin",
                Username = "admin",
                FullName = "System Administrator",
                Email = "admin@scholarsacademy.edu.bd",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                RoleId = superAdminRole.Id,
                RoleName = superAdminRole.Name,
                SchoolId = school.Id,
                BranchId = branch.Id,
                Avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                Phone = "+880 1819-000001",
                IsActive = true
            },
            new()
            {
                Id = "usr-teacher",
                Username = "teacher",
                FullName = "Sarah Jenkins (Senior Faculty)",
                Email = "sarah.jenkins@scholarsacademy.edu.bd",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("teacher123"),
                RoleId = teacherRole.Id,
                RoleName = teacherRole.Name,
                SchoolId = school.Id,
                BranchId = branch.Id,
                Avatar = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
                Phone = "+880 1819-000002",
                IsActive = true
            },
            new()
            {
                Id = "usr-student",
                Username = "student",
                FullName = "Tanvir Ahmed",
                Email = "tanvir.ahmed@student.scholarsacademy.edu.bd",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("student123"),
                RoleId = studentRole.Id,
                RoleName = studentRole.Name,
                SchoolId = school.Id,
                BranchId = branch.Id,
                Avatar = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
                Phone = "+880 1819-000003",
                IsActive = true
            },
            new()
            {
                Id = "usr-guardian",
                Username = "guardian",
                FullName = "Rafiqul Ahmed (Guardian)",
                Email = "rafiqul.ahmed@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("guardian123"),
                RoleId = guardianRole.Id,
                RoleName = guardianRole.Name,
                SchoolId = school.Id,
                BranchId = branch.Id,
                Avatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
                Phone = "+880 1819-000004",
                IsActive = true
            },
            new()
            {
                Id = "usr-accountant",
                Username = "accountant",
                FullName = "Kamal Hossain (Bursar)",
                Email = "accounts@scholarsacademy.edu.bd",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("accountant123"),
                RoleId = accountantRole.Id,
                RoleName = accountantRole.Name,
                SchoolId = school.Id,
                BranchId = branch.Id,
                Avatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
                Phone = "+880 1819-000005",
                IsActive = true
            }
        };
        context.Users.AddRange(users);

        foreach (var u in users)
        {
            context.UserRoles.Add(new UserRole { UserId = u.Id, RoleId = u.RoleId, SchoolId = school.Id });
        }

        // 4. Menus (Hierarchy & Routes)
        var menus = new List<Menu>
        {
            // Root Dashboard
            new() { Code = "DASHBOARD", Name = "Dashboard", Route = "/dashboard", Icon = "dashboard", Type = MenuType.Page, DisplayOrder = 1, IsActive = true, IsVisible = true },

            // Students Group
            new() { Code = "STUDENTS", Name = "Student Management", Route = null, Icon = "school", Type = MenuType.Group, DisplayOrder = 2, IsActive = true, IsVisible = true },
            new() { Code = "STU_LIST", Name = "Student Directory", ParentCode = "STUDENTS", Route = "/students", Icon = "people", Type = MenuType.Page, DisplayOrder = 1, IsActive = true, IsVisible = true },
            new() { Code = "STU_ADMIT", Name = "New Admission", ParentCode = "STUDENTS", Route = "/students/admission", Icon = "person_add", Type = MenuType.Page, DisplayOrder = 2, IsActive = true, IsVisible = true },

            // Academic Group
            new() { Code = "ACADEMICS", Name = "Academic Operations", Route = null, Icon = "auto_stories", Type = MenuType.Group, DisplayOrder = 3, IsActive = true, IsVisible = true },
            new() { Code = "ACAD_ROUTINE", Name = "Class Timetable", ParentCode = "ACADEMICS", Route = "/academic/routine", Icon = "calendar_month", Type = MenuType.Page, DisplayOrder = 1, IsActive = true, IsVisible = true },
            new() { Code = "ACAD_CLASSES", Name = "Classes & Sections", ParentCode = "ACADEMICS", Route = "/academic/classes", Icon = "meeting_room", Type = MenuType.Page, DisplayOrder = 2, IsActive = true, IsVisible = true },

            // Attendance Group
            new() { Code = "ATTENDANCE", Name = "Attendance Engine", Route = null, Icon = "event_available", Type = MenuType.Group, DisplayOrder = 4, IsActive = true, IsVisible = true },
            new() { Code = "ATT_STUDENT", Name = "Daily Attendance", ParentCode = "ATTENDANCE", Route = "/attendance/student", Icon = "checklist", Type = MenuType.Page, DisplayOrder = 1, IsActive = true, IsVisible = true },
            new() { Code = "ATT_REPORT", Name = "Attendance Records", ParentCode = "ATTENDANCE", Route = "/attendance/report", Icon = "summarize", Type = MenuType.Page, DisplayOrder = 2, IsActive = true, IsVisible = true },

            // Exams Group
            new() { Code = "EXAMS", Name = "Examinations", Route = null, Icon = "quiz", Type = MenuType.Group, DisplayOrder = 5, IsActive = true, IsVisible = true },
            new() { Code = "EXAM_SETUP", Name = "Exam Configuration", ParentCode = "EXAMS", Route = "/exams/setup", Icon = "assignment", Type = MenuType.Page, DisplayOrder = 1, IsActive = true, IsVisible = true },
            new() { Code = "EXAM_MARKS", Name = "Marks Entry", ParentCode = "EXAMS", Route = "/exams/marks", Icon = "edit_note", Type = MenuType.Page, DisplayOrder = 2, IsActive = true, IsVisible = true },
            new() { Code = "EXAM_RESULTS", Name = "Marksheet & Results", ParentCode = "EXAMS", Route = "/exams/results", Icon = "workspace_premium", Type = MenuType.Page, DisplayOrder = 3, IsActive = true, IsVisible = true },

            // Finance Group
            new() { Code = "FINANCE", Name = "Finance & Fees", Route = null, Icon = "account_balance", Type = MenuType.Group, DisplayOrder = 6, IsActive = true, IsVisible = true },
            new() { Code = "FIN_FEES", Name = "Fee Structures", ParentCode = "FINANCE", Route = "/finance/fee-structure", Icon = "price_change", Type = MenuType.Page, DisplayOrder = 1, IsActive = true, IsVisible = true },
            new() { Code = "FIN_COLLECTION", Name = "Collection & Receipts", ParentCode = "FINANCE", Route = "/finance/collection", Icon = "point_of_sale", Type = MenuType.Page, DisplayOrder = 2, IsActive = true, IsVisible = true },

            // Reports Group
            new() { Code = "REPORTS", Name = "Reports & Analytics", Route = null, Icon = "insert_chart", Type = MenuType.Group, DisplayOrder = 7, IsActive = true, IsVisible = true },
            new() { Code = "REP_ACADEMIC", Name = "Academic Performance", ParentCode = "REPORTS", Route = "/app/reports/academic", Icon = "analytics", Type = MenuType.Page, DisplayOrder = 1, IsActive = true, IsVisible = true },
            new() { Code = "REP_FINANCE", Name = "Financial Ledger", ParentCode = "REPORTS", Route = "/app/reports/financial", Icon = "receipt_long", Type = MenuType.Page, DisplayOrder = 2, IsActive = true, IsVisible = true },

            // Security Group
            new() { Code = "SECURITY", Name = "Security & RBAC", Route = null, Icon = "security", Type = MenuType.Group, DisplayOrder = 8, IsActive = true, IsVisible = true },
            new() { Code = "SEC_USERS", Name = "User Accounts", ParentCode = "SECURITY", Route = "/security/users", Icon = "manage_accounts", Type = MenuType.Page, DisplayOrder = 1, IsActive = true, IsVisible = true },
            new() { Code = "SEC_ROLES", Name = "Role Permissions", ParentCode = "SECURITY", Route = "/security/roles", Icon = "badge", Type = MenuType.Page, DisplayOrder = 2, IsActive = true, IsVisible = true },
            new() { Code = "SEC_MENUS", Name = "Dynamic Menus", ParentCode = "SECURITY", Route = "/security/menus", Icon = "menu_open", Type = MenuType.Page, DisplayOrder = 3, IsActive = true, IsVisible = true },
            new() { Code = "SEC_AUDIT", Name = "Security Audit Trail", ParentCode = "SECURITY", Route = "/security/audit-logs", Icon = "policy", Type = MenuType.Page, DisplayOrder = 4, IsActive = true, IsVisible = true }
        };
        context.Menus.AddRange(menus);

        // 5. Role Permissions
        foreach (var permissionBranch in new[] { branch, branch2 })
        foreach (var m in menus)
        {
            // Super Admin gets all permissions
            context.RoleMenuPermissions.Add(new RoleMenuPermission
            {
                SchoolId = school.Id,
                BranchId = permissionBranch.Id,
                RoleId = superAdminRole.Id,
                MenuCode = m.Code,
                View = true,
                Create = true,
                Edit = true,
                Delete = true,
                Approve = true,
                Export = true
            });

            // Teacher Permissions
            var teacherAllowed = m.Code is "DASHBOARD" or "STUDENTS" or "STU_LIST" or "ACADEMICS" or "ACAD_ROUTINE"
                or "ATTENDANCE" or "ATT_STUDENT" or "ATT_REPORT" or "EXAMS" or "EXAM_SETUP" or "EXAM_MARKS" or "EXAM_RESULTS"
                or "REPORTS" or "REP_ACADEMIC";

            if (teacherAllowed)
            {
                context.RoleMenuPermissions.Add(new RoleMenuPermission
                {
                SchoolId = school.Id,
                BranchId = permissionBranch.Id,
                    RoleId = teacherRole.Id,
                    MenuCode = m.Code,
                    View = true,
                    Create = m.Code is "ATT_STUDENT" or "EXAM_MARKS",
                    Edit = m.Code is "ATT_STUDENT" or "EXAM_MARKS",
                    Delete = false,
                    Approve = m.Code == "EXAM_MARKS",
                    Export = true
                });
            }

            // Student Permissions
            var studentAllowed = m.Code is "DASHBOARD" or "STUDENTS" or "STU_LIST" or "ACADEMICS" or "ACAD_ROUTINE"
                or "ATTENDANCE" or "ATT_REPORT" or "EXAMS" or "EXAM_RESULTS" or "FINANCE" or "FIN_COLLECTION";

            if (studentAllowed)
            {
                context.RoleMenuPermissions.Add(new RoleMenuPermission
                {
                SchoolId = school.Id,
                BranchId = permissionBranch.Id,
                    RoleId = studentRole.Id,
                    MenuCode = m.Code,
                    View = true,
                    Create = false,
                    Edit = false,
                    Delete = false,
                    Approve = false,
                    Export = m.Code is "EXAM_RESULTS" or "FIN_COLLECTION"
                });
            }

            // Guardian Permissions
            var guardianAllowed = m.Code is "DASHBOARD" or "STUDENTS" or "STU_LIST" or "ACADEMICS" or "ACAD_ROUTINE"
                or "ATTENDANCE" or "ATT_REPORT" or "EXAMS" or "EXAM_RESULTS" or "FINANCE" or "FIN_COLLECTION";

            if (guardianAllowed)
            {
                context.RoleMenuPermissions.Add(new RoleMenuPermission
                {
                SchoolId = school.Id,
                BranchId = permissionBranch.Id,
                    RoleId = guardianRole.Id,
                    MenuCode = m.Code,
                    View = true,
                    Create = false,
                    Edit = false,
                    Delete = false,
                    Approve = false,
                    Export = m.Code is "EXAM_RESULTS" or "FIN_COLLECTION"
                });
            }

            // Accountant Permissions
            var accountantAllowed = m.Code is "DASHBOARD" or "STUDENTS" or "STU_LIST" or "FINANCE" or "FIN_FEES" or "FIN_COLLECTION" or "REPORTS" or "REP_FINANCE";
            if (accountantAllowed)
            {
                context.RoleMenuPermissions.Add(new RoleMenuPermission
                {
                SchoolId = school.Id,
                BranchId = permissionBranch.Id,
                    RoleId = accountantRole.Id,
                    MenuCode = m.Code,
                    View = true,
                    Create = m.Code is "FIN_FEES" or "FIN_COLLECTION",
                    Edit = m.Code is "FIN_FEES" or "FIN_COLLECTION",
                    Delete = false,
                    Approve = m.Code == "FIN_COLLECTION",
                    Export = true
                });
            }
        }

        // 6. User Menu Override Example: Tanvir Ahmed explicit override
        context.UserMenuPermissions.Add(new UserMenuPermission
        {
            UserId = "usr-student",
            MenuCode = "ACAD_ROUTINE",
            Action = "view",
            Override = OverrideType.Allow,
            GrantedBy = "admin"
        });

        // 7. Academic Classes & Sections
        var classes = new List<SchoolClass>
        {
            new() { Id = "cls-09", SchoolId = school.Id, Name = "Class 9", Code = "CLS-09", SortOrder = 1 },
            new() { Id = "cls-10", SchoolId = school.Id, Name = "Class 10", Code = "CLS-10", SortOrder = 2 },
            new() { Id = "cls-11", SchoolId = school.Id, Name = "Class 11", Code = "CLS-11", SortOrder = 3 },
            new() { Id = "cls-12", SchoolId = school.Id, Name = "Class 12", Code = "CLS-12", SortOrder = 4 }
        };
        context.Classes.AddRange(classes);

        var sections = new List<Section>
        {
            new() { Id = "sec-10a", SchoolId = school.Id, ClassId = "cls-10", ClassName = "Class 10", Name = "Padma (Section A)", Capacity = 45, ClassTeacherId = "usr-teacher", ClassTeacherName = "Sarah Jenkins" },
            new() { Id = "sec-10b", SchoolId = school.Id, ClassId = "cls-10", ClassName = "Class 10", Name = "Meghna (Section B)", Capacity = 40, ClassTeacherId = "usr-teacher", ClassTeacherName = "Sarah Jenkins" },
            new() { Id = "sec-09a", SchoolId = school.Id, ClassId = "cls-09", ClassName = "Class 9", Name = "Lotus (Section A)", Capacity = 40, ClassTeacherId = "usr-teacher", ClassTeacherName = "Sarah Jenkins" },
            new() { Id = "sec-09b", SchoolId = school.Id, ClassId = "cls-09", ClassName = "Class 9", Name = "Tulip (Section B)", Capacity = 40, ClassTeacherId = "usr-teacher", ClassTeacherName = "Sarah Jenkins" }
        };
        context.Sections.AddRange(sections);

        // 8. Subjects
        var subjects = new List<Subject>
        {
            new() { Id = "sub-math", SchoolId = school.Id, Code = "MATH-101", Name = "Higher Mathematics", Type = "Compulsory", FullMarks = 100, PassMarks = 33 },
            new() { Id = "sub-phys", SchoolId = school.Id, Code = "PHY-102", Name = "Physics", Type = "Compulsory", FullMarks = 100, PassMarks = 33 },
            new() { Id = "sub-chem", SchoolId = school.Id, Code = "CHE-103", Name = "Chemistry", Type = "Compulsory", FullMarks = 100, PassMarks = 33 },
            new() { Id = "sub-eng", SchoolId = school.Id, Code = "ENG-104", Name = "English Literature", Type = "Compulsory", FullMarks = 100, PassMarks = 33 },
            new() { Id = "sub-ict", SchoolId = school.Id, Code = "ICT-105", Name = "Information Technology", Type = "Compulsory", FullMarks = 100, PassMarks = 33 },
            new() { Id = "sub-bio", SchoolId = school.Id, Code = "BIO-106", Name = "Biology", Type = "Optional", FullMarks = 100, PassMarks = 33 }
        };
        context.Subjects.AddRange(subjects);

        // 9. Routine Periods (Class 10 - Section A)
        var days = new[] { "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday" };
        int periodId = 1;
        foreach (var day in days)
        {
            context.RoutinePeriods.Add(new RoutinePeriod
            {
                Id = $"rt-{periodId++}",
                SchoolId = school.Id,
                Day = day,
                PeriodNumber = 1,
                StartTime = "08:30 AM",
                EndTime = "09:20 AM",
                ClassId = "cls-10",
                ClassName = "Class 10",
                SectionId = "sec-10a",
                SectionName = "Padma (Section A)",
                SubjectId = "sub-math",
                SubjectName = "Higher Mathematics",
                TeacherId = "usr-teacher",
                TeacherName = "Sarah Jenkins",
                RoomNo = "Science Lab 3"
            });

            context.RoutinePeriods.Add(new RoutinePeriod
            {
                Id = $"rt-{periodId++}",
                SchoolId = school.Id,
                Day = day,
                PeriodNumber = 2,
                StartTime = "09:25 AM",
                EndTime = "10:15 AM",
                ClassId = "cls-10",
                ClassName = "Class 10",
                SectionId = "sec-10a",
                SectionName = "Padma (Section A)",
                SubjectId = "sub-phys",
                SubjectName = "Physics",
                TeacherId = "usr-teacher",
                TeacherName = "Sarah Jenkins",
                RoomNo = "Room 204"
            });

            context.RoutinePeriods.Add(new RoutinePeriod
            {
                Id = $"rt-{periodId++}",
                SchoolId = school.Id,
                Day = day,
                PeriodNumber = 3,
                StartTime = "10:35 AM",
                EndTime = "11:25 AM",
                ClassId = "cls-10",
                ClassName = "Class 10",
                SectionId = "sec-10a",
                SectionName = "Padma (Section A)",
                SubjectId = "sub-chem",
                SubjectName = "Chemistry",
                TeacherId = "usr-teacher",
                TeacherName = "Sarah Jenkins",
                RoomNo = "Chem Lab 1"
            });
        }

        // 10. Student: Tanvir Ahmed
        var student = new Student
        {
            Id = "stu-001",
            SchoolId = school.Id,
            AdmissionNo = "ADM-2026-0089",
            FullName = "Tanvir Ahmed",
            BanglaName = "তানভীর আহমেদ",
            DateOfBirth = new DateTime(2010, 4, 15, 0, 0, 0, DateTimeKind.Utc),
            Gender = "Male",
            BloodGroup = "O+",
            Religion = "Islam",
            Email = "tanvir.ahmed@student.scholarsacademy.edu.bd",
            Phone = "+880 1711-234567",
            PresentAddress = "Flat 4B, Concord Tower, Gulshan-2, Dhaka",
            PermanentAddress = "Vill: Sreepur, Upazila: Boalmari, Faridpur",
            PhotoUrl = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
            GuardianName = "Rafiqul Ahmed",
            GuardianRelation = "Father",
            GuardianPhone = "+880 1819-000004",
            GuardianOccupation = "Senior Software Architect",
            GuardianIncome = "250,000 BDT/Month",
            AcademicYearId = academicYear.Id,
            ClassId = "cls-10",
            ClassName = "Class 10",
            SectionId = "sec-10a",
            SectionName = "Padma (Section A)",
            RollNo = "01",
            AdmissionDate = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc),
            Status = "Active"
        };
        context.Students.Add(student);

        var enrollment = new Enrollment
        {
            Id = "enr-001",
            SchoolId = school.Id,
            StudentId = student.Id,
            AcademicYearId = academicYear.Id,
            ClassId = "cls-10",
            SectionId = "sec-10a",
            RollNo = "01",
            EnrollmentDate = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc),
            Status = "Active"
        };
        context.Enrollments.Add(enrollment);

        // 11. Teacher: Sarah Jenkins
        var teacher = new Teacher
        {
            Id = "tch-001",
            SchoolId = school.Id,
            EmployeeCode = "FAC-2022-045",
            FullName = "Sarah Jenkins",
            Designation = "Assistant Professor",
            Department = "Department of Physical Sciences",
            Qualification = "M.Sc in Applied Mathematics, University of Dhaka",
            Email = "sarah.jenkins@scholarsacademy.edu.bd",
            Phone = "+880 1819-000002",
            JoiningDate = new DateTime(2022, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            Status = "Active",
            Avatar = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
            AssignedSubjectsJson = "{\"subjects\": [\"Higher Mathematics\", \"Physics\"]}"
        };
        context.Teachers.Add(teacher);

        // 12. Attendance Records
        var today = DateTime.UtcNow.Date;
        context.AttendanceRecords.Add(new AttendanceRecord
        {
            Id = "att-001",
            SchoolId = school.Id,
            EnrollmentId = enrollment.Id,
            StudentId = student.Id,
            StudentName = student.FullName,
            RollNo = student.RollNo,
            ClassId = student.ClassId,
            SectionId = student.SectionId,
            AttendanceDate = today,
            Status = "Present",
            Remark = "On-time arrival",
            MarkedBy = "Sarah Jenkins"
        });

        // 13. Exam & Marks
        var exam = new Exam
        {
            Id = "ex-annual-2026",
            SchoolId = school.Id,
            AcademicYearId = academicYear.Id,
            Name = "Annual Examination 2026",
            Term = "Final Term",
            AcademicYear = "2026",
            StartDate = new DateTime(2026, 11, 10, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2026, 11, 28, 0, 0, 0, DateTimeKind.Utc),
            IsPublished = true
        };
        context.Exams.Add(exam);

        var marks = new List<ExamMark>
        {
            new() { Id = "mk-1", SchoolId = school.Id, ExamId = exam.Id, StudentId = student.Id, StudentName = student.FullName, RollNo = student.RollNo, ClassId = student.ClassId, SectionId = student.SectionId, SubjectId = "sub-math", SubjectName = "Higher Mathematics", FullMarks = 100, ObtainedMarks = 96, Grade = "A+", GradePoint = 5.0m, IsPass = true },
            new() { Id = "mk-2", SchoolId = school.Id, ExamId = exam.Id, StudentId = student.Id, StudentName = student.FullName, RollNo = student.RollNo, ClassId = student.ClassId, SectionId = student.SectionId, SubjectId = "sub-phys", SubjectName = "Physics", FullMarks = 100, ObtainedMarks = 92, Grade = "A+", GradePoint = 5.0m, IsPass = true },
            new() { Id = "mk-3", SchoolId = school.Id, ExamId = exam.Id, StudentId = student.Id, StudentName = student.FullName, RollNo = student.RollNo, ClassId = student.ClassId, SectionId = student.SectionId, SubjectId = "sub-chem", SubjectName = "Chemistry", FullMarks = 100, ObtainedMarks = 88, Grade = "A+", GradePoint = 5.0m, IsPass = true },
            new() { Id = "mk-4", SchoolId = school.Id, ExamId = exam.Id, StudentId = student.Id, StudentName = student.FullName, RollNo = student.RollNo, ClassId = student.ClassId, SectionId = student.SectionId, SubjectId = "sub-eng", SubjectName = "English Literature", FullMarks = 100, ObtainedMarks = 85, Grade = "A+", GradePoint = 5.0m, IsPass = true },
            new() { Id = "mk-5", SchoolId = school.Id, ExamId = exam.Id, StudentId = student.Id, StudentName = student.FullName, RollNo = student.RollNo, ClassId = student.ClassId, SectionId = student.SectionId, SubjectId = "sub-ict", SubjectName = "Information Technology", FullMarks = 100, ObtainedMarks = 98, Grade = "A+", GradePoint = 5.0m, IsPass = true }
        };
        context.ExamMarks.AddRange(marks);

        // 14. Finance: Fee Types, Invoices, Payments
        var feeMonthly = new FeeType { Id = "ft-monthly", SchoolId = school.Id, Code = "FEETYPE-TUIT", Name = "Monthly Tuition Fee", Frequency = "Monthly", Description = "Regular monthly tuition fee" };
        var feeLab = new FeeType { Id = "ft-lab", SchoolId = school.Id, Code = "FEETYPE-LAB", Name = "Science Lab Maintenance", Frequency = "Term-Wise", Description = "Physics & Chemistry lab fee" };
        context.FeeTypes.AddRange(feeMonthly, feeLab);

        var feeStructure = new FeeStructure
        {
            Id = "fs-10",
            SchoolId = school.Id,
            AcademicYearId = academicYear.Id,
            ClassId = "cls-10",
            ClassName = "Class 10",
            FeeTypeId = feeMonthly.Id,
            FeeTypeName = feeMonthly.Name,
            Amount = 4500m,
            DueDate = new DateTime(2026, 10, 10, 0, 0, 0, DateTimeKind.Utc)
        };
        context.FeeStructures.Add(feeStructure);

        var invoice = new StudentInvoice
        {
            Id = "inv-2026-10",
            SchoolId = school.Id,
            InvoiceNo = "INV-2026-10089",
            StudentId = student.Id,
            StudentName = student.FullName,
            RollNo = student.RollNo,
            ClassName = student.ClassName,
            SectionName = student.SectionName,
            FeeTypeId = feeMonthly.Id,
            FeeTypeName = feeMonthly.Name,
            TotalAmount = 4500m,
            DiscountAmount = 0m,
            NetAmount = 4500m,
            PaidAmount = 4500m,
            DueAmount = 0m,
            DueDate = new DateTime(2026, 10, 15, 0, 0, 0, DateTimeKind.Utc),
            Status = "Paid"
        };
        context.StudentInvoices.Add(invoice);

        var payment = new FeePayment
        {
            Id = "pmt-001",
            SchoolId = school.Id,
            ReceiptNo = "RCPT-2026-0941",
            InvoiceId = invoice.Id,
            StudentId = student.Id,
            StudentName = student.FullName,
            RollNo = student.RollNo,
            ClassName = student.ClassName,
            AmountPaid = 4500m,
            PaymentMethod = "bKash",
            TransactionRef = "TRX-9BK874108",
            PaymentDate = new DateTime(2026, 10, 12, 14, 30, 0, DateTimeKind.Utc),
            CollectedBy = "Online Gateway (bKash Auto-settle)",
            Notes = "October Tuition full settlement"
        };
        context.FeePayments.Add(payment);

        // 15. Audit Logs
        var audit = new AuditLog
        {
            Id = "aud-001",
            SchoolId = school.Id,
            Timestamp = DateTime.UtcNow,
            UserName = "admin",
            UserRole = "Super Admin",
            Action = "Create",
            Module = "SYSTEM_INITIALIZE",
            TargetRecord = "Initial Seed Catalog",
            Details = "Standard production schemas, roles, dynamic menus, and master catalogs provisioned.",
            SchoolScope = "Main Campus"
        };
        context.AuditLogs.Add(audit);

        // 16. Teacher Leave Applications
        var leave1 = new TeacherLeaveApplication
        {
            Id = "tl-001",
            SchoolId = school.Id,
            BranchId = branch.Id,
            TeacherId = "tch-01",
            TeacherName = "Sarah Jenkins",
            EmployeeCode = "EMP-101",
            Department = "Science & Mathematics",
            LeaveType = "Casual Leave",
            StartDate = DateTime.UtcNow.AddDays(5),
            EndDate = DateTime.UtcNow.AddDays(7),
            TotalDays = 3,
            Reason = "Family personal engagement and travel",
            Status = "Approved",
            AppliedOn = DateTime.UtcNow.AddDays(-2),
            ReviewedBy = "admin",
            ReviewRemark = "Approved. Substitute teacher assigned."
        };
        var leave2 = new TeacherLeaveApplication
        {
            Id = "tl-002",
            SchoolId = school.Id,
            BranchId = branch.Id,
            TeacherId = "tch-02",
            TeacherName = "Michael Chang",
            EmployeeCode = "EMP-102",
            Department = "Languages",
            LeaveType = "Sick Leave",
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(2),
            TotalDays = 2,
            Reason = "Medical consultation and recovery",
            Status = "Pending",
            AppliedOn = DateTime.UtcNow
        };
        context.TeacherLeaveApplications.AddRange(leave1, leave2);

        // 17. Exam Schedules
        var examSchedules = new List<ExamScheduleItem>
        {
            new() { Id = "ex-sch-01", SchoolId = school.Id, BranchId = branch.Id, ExamId = exam.Id, ClassId = "cls-10", ClassName = "Class 10", SubjectId = "sub-math", SubjectName = "Higher Mathematics", ExamDate = new DateTime(2026, 11, 10, 0, 0, 0, DateTimeKind.Utc), Day = "Tuesday", StartTime = "10:00 AM", EndTime = "01:00 PM", RoomNo = "Hall A", FullMarks = 100, PassMarks = 33 },
            new() { Id = "ex-sch-02", SchoolId = school.Id, BranchId = branch.Id, ExamId = exam.Id, ClassId = "cls-10", ClassName = "Class 10", SubjectId = "sub-phys", SubjectName = "Physics", ExamDate = new DateTime(2026, 11, 12, 0, 0, 0, DateTimeKind.Utc), Day = "Thursday", StartTime = "10:00 AM", EndTime = "01:00 PM", RoomNo = "Hall A", FullMarks = 100, PassMarks = 33 },
            new() { Id = "ex-sch-03", SchoolId = school.Id, BranchId = branch.Id, ExamId = exam.Id, ClassId = "cls-10", ClassName = "Class 10", SubjectId = "sub-chem", SubjectName = "Chemistry", ExamDate = new DateTime(2026, 11, 15, 0, 0, 0, DateTimeKind.Utc), Day = "Sunday", StartTime = "10:00 AM", EndTime = "01:00 PM", RoomNo = "Hall A", FullMarks = 100, PassMarks = 33 },
            new() { Id = "ex-sch-04", SchoolId = school.Id, BranchId = branch.Id, ExamId = exam.Id, ClassId = "cls-10", ClassName = "Class 10", SubjectId = "sub-eng", SubjectName = "English Literature", ExamDate = new DateTime(2026, 11, 18, 0, 0, 0, DateTimeKind.Utc), Day = "Wednesday", StartTime = "10:00 AM", EndTime = "01:00 PM", RoomNo = "Hall B", FullMarks = 100, PassMarks = 33 },
            new() { Id = "ex-sch-05", SchoolId = school.Id, BranchId = branch.Id, ExamId = exam.Id, ClassId = "cls-10", ClassName = "Class 10", SubjectId = "sub-ict", SubjectName = "Information Technology", ExamDate = new DateTime(2026, 11, 22, 0, 0, 0, DateTimeKind.Utc), Day = "Sunday", StartTime = "10:00 AM", EndTime = "01:00 PM", RoomNo = "Lab 1", FullMarks = 100, PassMarks = 33 }
        };
        context.ExamScheduleItems.AddRange(examSchedules);

        // 18. SMS Templates & Logs
        var smsTemplates = new List<SmsTemplate>
        {
            new() { Id = "tmpl-01", SchoolId = school.Id, BranchId = branch.Id, Title = "Tuition Fee Due Notice", Category = "Fee", Content = "Dear Guardian, Tuition fees for {MONTH} are due. Kindly settle via the portal or school cash counter. - Scholars Academy" },
            new() { Id = "tmpl-02", SchoolId = school.Id, BranchId = branch.Id, Title = "Student Absence Alert", Category = "Attendance", Content = "Dear Guardian, Your ward {STUDENT_NAME} was absent today without prior notice. Please contact class teacher. - Principal" },
            new() { Id = "tmpl-03", SchoolId = school.Id, BranchId = branch.Id, Title = "Exam Schedule Published", Category = "Exam", Content = "Dear Parents, Annual Examination schedule has been published on the academic portal. Check student dashboard." },
            new() { Id = "tmpl-04", SchoolId = school.Id, BranchId = branch.Id, Title = "Institutional Holiday Notice", Category = "Emergency", Content = "The school will remain closed tomorrow due to an official institutional holiday. Classes resume on Sunday." }
        };
        context.SmsTemplates.AddRange(smsTemplates);

        var smsLog = new SmsDispatchLog
        {
            Id = "sms-001",
            SchoolId = school.Id,
            BranchId = branch.Id,
            RecipientGroup = "Class 10 Guardians",
            RecipientCount = 45,
            Message = "Dear Guardian, Monthly tuition fees for October are now due. Please clear before 15th Oct. - Scholars Academy",
            SenderName = "Principal Office",
            SentAt = DateTime.UtcNow.AddDays(-3),
            Status = "Delivered",
            CreditsUsed = 45
        };
        context.SmsDispatchLogs.Add(smsLog);

        await context.SaveChangesAsync();
    }

    public static async Task EnsureInstitutionalTiersAsync(ApplicationDbContext context)
    {
        var school = await context.Schools.FirstOrDefaultAsync();
        if (school == null) return;
        var branch = await context.Branches.FirstOrDefaultAsync(b => b.SchoolId == school.Id) 
                     ?? new Branch { Id = "br-01", SchoolId = school.Id, Code = "BR-01", Name = "Main Campus", IsActive = true };

        var requiredClasses = new (string Id, string Name, string Code, int SortOrder, string TeacherId, string TeacherName)[]
        {
            ("cls-01", "Play", "CLS-01", 1, "tch-002", "Kaniz Fatema"),
            ("cls-02", "Narsari", "CLS-02", 2, "tch-003", "Rukhsana Akter"),
            ("cls-03", "One", "CLS-03", 3, "tch-004", "Mizanur Rahman"),
            ("cls-04", "Two", "CLS-04", 4, "tch-005", "Shahidul Islam"),
            ("cls-05", "Three", "CLS-05", 5, "tch-006", "Jannatul Ferdous"),
            ("cls-06", "Four", "CLS-06", 6, "tch-007", "Hasan Mahmud"),
            ("cls-07", "Five", "CLS-07", 7, "tch-008", "Farzana Haque")
        };

        bool hasChanges = false;
        foreach (var (id, name, code, order, teacherId, teacherName) in requiredClasses)
        {
            var existing = await context.Classes.FirstOrDefaultAsync(c => c.Code.ToLower() == code.ToLower() || c.Id == id);
            if (existing == null)
            {
                var newClass = new SchoolClass
                {
                    Id = id,
                    SchoolId = school.Id,
                    BranchId = branch.Id,
                    Name = name,
                    Code = code,
                    SortOrder = order,
                    IsActive = true
                };
                context.Classes.Add(newClass);
                hasChanges = true;

                // Add standard sections
                context.Sections.Add(new Section
                {
                    Id = $"sec-{id}-a",
                    SchoolId = school.Id,
                    BranchId = branch.Id,
                    ClassId = id,
                    ClassName = name,
                    Name = "Section A",
                    Capacity = 30,
                    ClassTeacherId = teacherId,
                    ClassTeacherName = teacherName
                });

                context.Sections.Add(new Section
                {
                    Id = $"sec-{id}-b",
                    SchoolId = school.Id,
                    BranchId = branch.Id,
                    ClassId = id,
                    ClassName = name,
                    Name = "Section B",
                    Capacity = 30,
                    ClassTeacherId = teacherId,
                    ClassTeacherName = teacherName
                });
            }
        }

        if (hasChanges)
        {
            await context.SaveChangesAsync();
        }
    }
}
