# School Management System - Enterprise ASP.NET Core Backend

Professional, production-ready ASP.NET Core Web API backend engineered according to the **School Management Backend Full Process & Technical Architecture Blueprint** and **PostgreSQL Database Design Specification v1.0**.

---

## 🏛️ Architecture Overview

The backend is built following **Clean Architecture / Modular Monolith** principles with strict domain separation:

`
SchoolManagement.sln
├── src/
│   ├── SchoolManagement.Domain/          # Pure Domain Entities, Invariants & Enums
│   │   ├── Common/                       # BaseEntity, ISchoolScopedEntity, Enums
│   │   ├── Auth/                         # User, Role, UserRole, Menu, Permission, Overrides
│   │   ├── School/                       # SchoolEntity, Branch, AcademicYear
│   │   ├── Academic/                     # SchoolClass, Section, Subject, RoutinePeriod
│   │   ├── Student/                      # Student, Enrollment
│   │   ├── Employee/                     # Teacher
│   │   ├── Attendance/                   # AttendanceRecord, AttendanceCorrectionLog
│   │   ├── Exam/                         # Exam, ExamMark
│   │   ├── Finance/                      # FeeType, FeeStructure, StudentInvoice, FeePayment
│   │   └── System/                       # AuditLog, Notice
│   │
│   ├── SchoolManagement.Application/     # Application Use Cases, DTOs & Interfaces
│   │   ├── Common/                       # ApiResponse<T>, PagedResult<T>, Interfaces
│   │   ├── Auth/DTOs/                    # LoginRequest, LoginResponse, UserProfileDto
│   │   ├── Menus/DTOs/                   # MenuItemDto, RolePermissionDto, UserMenuOverrideDto
│   │   ├── Academic/DTOs/                # SchoolClassDto, SectionDto, RoutinePeriodDto
│   │   ├── Students/DTOs/                # StudentDto, AdmissionRequest, PromotionRequest
│   │   ├── Attendance/DTOs/              # AttendanceRecordDto, SaveRosterAttendanceRequest
│   │   ├── Exams/DTOs/                   # ExamDto, ExamMarkDto, StudentMarksheetDto
│   │   ├── Finance/DTOs/                 # FeeTypeDto, StudentInvoiceDto, CollectFeePaymentRequest
│   │   └── System/DTOs/                  # AuditLogDto, DashboardStatsDto, NoticeDto
│   │
│   ├── SchoolManagement.Infrastructure/  # EF Core Persistence, Identity & Security
│   │   ├── Persistence/                  # ApplicationDbContext (PostgreSQL Schemas), DbInitializer
│   │   ├── Identity/                     # TokenService (JWT HMAC-SHA256), PermissionEngine
│   │   └── DependencyInjection.cs        # Npgsql DbContext & JWT Bearer configuration
│   │
│   └── SchoolManagement.Api/             # REST API Controllers & Pipeline
│       ├── Controllers/                  # Auth, Menus, Roles, Users, Academic, Students, etc.
│       ├── Middleware/                   # Global RFC 7807 ProblemDetails Exception Handling
│       ├── Properties/                   # launchSettings.json (http://localhost:5000)
│       └── Program.cs                    # Pipeline, CORS, Swagger UI, Seed Runner
`

---

## 🗄️ PostgreSQL Database Design (9 Schemas, 29 Tables)

The database strictly utilizes PostgreSQL logical schemas for complete tenant and domain boundary separation:

| Schema | Tables | Description |
| :--- | :--- | :--- |
| **uth** | users, 
oles, user_roles, menus, permissions, 
ole_menu_permissions, user_menu_permissions, 
efresh_tokens | Identity, JWT rotation, Dynamic Menus & Granular Permission Overrides |
| **school** | schools, ranches, cademic_years | Multi-school tenancy, branches, active session configuration |
| **cademic** | classes, sections, subjects, class_subjects, class_routines | Academic structure, timetable schedules |
| **student** | students, enrollments | Student demographics, guardian details, annual session enrollments |
| **employee** | 	eachers | Faculty roster, designations, departments |
| **ttendance** | student_attendance, ttendance_correction_logs | Daily class attendance, immutable correction audit trail |
| **exam** | exams, marks | Term examinations, grade point calculations, student marksheets |
| **inance** | ee_types, ee_structures, invoices, payments | Monetary transactions (
umeric(14,2)), invoice ledger, receipt generation |
| **system** | udit_logs, 
otices | Security audit trail, institutional notice board |

---

## 🔐 Dynamic Menu & Permission Evaluation Engine

The authorization system implements the exact 4-tier precedence algorithm:

1. **Explicit User DENY** *(Highest priority: immediate lockout from action/menu)*
2. **Explicit User ALLOW** *(Overrides any default role restriction)*
3. **Any Assigned Role ALLOW** *(Aggregated across active roles)*
4. **Default DENY** *(Zero-trust deny by default)*

---

## 🚀 Live Seed Accounts

| Role | Username | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | dmin | dmin123 | Full enterprise control across all 8 modules & RBAC |
| **Teacher** | 	eacher | 	eacher123 | Students, Timetable, Daily Attendance, Exam Marks Entry |
| **Student** | student | student123 | Student Dashboard, Timetable, Attendance, Marksheet & Invoices |
| **Guardian** | guardian | guardian123 | Child progress tracking, term reports, tuition payments |
| **Accountant** | ccountant | ccountant123 | Fee structures, student invoicing, payment receipt issuance |

---

## 📡 Running the Backend

### Prerequisites
- .NET 8.0 SDK (or .NET 10.0)
- PostgreSQL 14+ (default connection: Host=localhost;Port=5432;Database=school_management;Username=postgres;Password=123456)

### Commands
`ash
# Build the complete solution
dotnet build SchoolManagement.sln

# Run the API server
dotnet run --project src/SchoolManagement.Api/SchoolManagement.Api.csproj --launch-profile http
`

- **Swagger Documentation:** http://localhost:5000/swagger
- **Base API Endpoint:** http://localhost:5000/api/v1

---

## ⚡ Entity Framework Core Migrations

The project uses official EF Core code-first migrations managed within SchoolManagement.Infrastructure/Persistence/Migrations:

- **Initial Migration:** 20261019181224_InitialCreate.cs (Contains all 9 PostgreSQL schemas, 29 tables, composite unique constraints, and foreign key relations).
- **Migration History Table:** __EFMigrationsHistory

### Managing Migrations:
`ash
# 1. Create a new migration after entity changes
dotnet ef migrations add <MigrationName> --project src/SchoolManagement.Infrastructure --startup-project src/SchoolManagement.Api --output-dir Persistence/Migrations

# 2. Apply pending migrations to PostgreSQL database
dotnet ef database update --project src/SchoolManagement.Infrastructure --startup-project src/SchoolManagement.Api

# 3. Remove the last migration (if not applied)
dotnet ef migrations remove --project src/SchoolManagement.Infrastructure --startup-project src/SchoolManagement.Api
`
