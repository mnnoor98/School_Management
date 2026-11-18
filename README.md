# Enterprise Multi-Campus School Management ERP

A complete, enterprise-grade multi-campus institutional School Management System built with **.NET 8 Clean Architecture**, **PostgreSQL**, and **Angular 17/18 Standalone Architecture**.

Designed for complete institutional operations with **Zero Mock Data** and **Zero Hardcoded Select Dropdowns** — every single select list, teacher scale, student record, academic routine period, fee invoice, and examination mark is dynamically loaded and persisted directly in **PostgreSQL**.

---

## 🏛️ Multi-Campus Architecture & Tenancy Isolation

The system supports seamless multi-campus operations with strict database-level tenancy isolation enforced through `ICampusScopedEntity`, `CampusScopeMiddleware`, and EF Core Global Query Filters.

### Active Seeded Campuses
| Campus ID | Campus Name | Location | Seeded Classes | Faculty Members | Enrolled Students |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `br-01` | **Main Campus** | Plot 14, Road 2, Block-E, Dhaka | 11 Classes | 6 Teachers | 12 Students |
| `br-8996de` | **BR-02 Uttara Campus** | Sector 4, Uttara, Dhaka | 10 Classes | 4 Teachers | Active |
| `br-6fd98e` | **BR-03 Rayerbag Campus** | Rayerbag, Kadamtali, Dhaka | 12 Classes | 4 Teachers | Active |
| `br-02c70f` | **BR-04 Dhanmondi Campus** | Road 8/A, Dhanmondi, Dhaka | 10 Classes | 4 Teachers | 13 Students |

---

## 🚀 Key Modules & Functional Engines

### 1. Zero Mock Data & Dynamic Database Hydration
- **Complete Cleanup:** Permanently purged legacy mock storage (`mock-db.service.ts`, `mock-data.ts`, `mock-backend.interceptor.ts`).
- **Dynamic Select Lists:** 100% of frontend dropdowns (Classes, Sections, Subjects, Academic Sessions, Fee Heads, Teachers, Genders, Blood Groups) query real PostgreSQL REST endpoints.

### 2. Teacher & Staff Payroll Engine (`/app/finance/payroll-management`)
- **Configurable Salary Structures:** Basic pay, house rent, medical allowance, conveyance, special allowances, and 5% Provident Fund deductions per faculty member.
- **1-Click Monthly Payroll:** Automated calculation evaluating total working days, unpaid leave deductions from approved teacher leave applications, and festival bonuses.
- **Bursar & Principal Approval:** Single and batch approval workflows (`POST /api/v1/payroll/approve-month`).
- **Bank & Cash Disbursement:** Electronic Fund Transfer (EFT) tracking with transaction reference audit (`POST /api/v1/payroll/disburse-month`).
- **Official Confidential Pay Slips:** Authorized remuneration statements with English currency-in-words conversion (*"Sixty Four Thousand One Hundred Taka Only"*).

### 3. Student Promotion & Annual Session Migration (`/app/students/promotion`)
- **Annual Progression Workspace:** Session-to-session and grade-to-grade student progression mapping (e.g. Class 1 -> Class 2).
- **Merit Rank & Roll Re-sequencing:** Automatic re-sequencing of class rolls (01, 02, 03...) based on GPA / Exam Merit Rank or Class Roll.
- **Retention & Detention Tracking:** Supports retaining students in the same class while updating their academic session enrollment.
- **Audit Ledger:** Every promotion batch is tracked in the system audit logs.

### 4. Finance & Automated Batch Invoicing (`/app/finance/fee-collection`)
- **Collision-Proof Invoicing:** Multi-tenant GUID-suffixed invoice numbers preventing unique constraint collisions (`IX_invoices_InvoiceNo`).
- **1-Click Batch Fee Invoicing:** Automated fee generation across entire classes with idempotency checks (skips already invoiced students).
- **Multi-Channel Collections:** Cash counter collections, bank deposits, and online payment integrations (bKash / Nagad).
- **Money Receipts:** Printable official 3-copy vouchers (Student Copy, Bank Copy, Office Copy).

### 5. Academic Routine & Timetable Scheduler (`/app/academic/routine`)
- **Dynamic Timetable Matrix:** Conflict-free period scheduling by class, section, teacher, subject, and classroom room number.
- **Batch Schedule Replacement:** 1-click weekly schedule replacement and individual period vacating.

### 6. Examination & Progress Report Card Generator (`/app/reports/academic`)
- **Term Exams & Marks Entry:** Grading system with Grade Point Average (GPA 5.0 scale), Letter Grades (A+, A, A-, B, C, D, F), and pass/fail thresholds.
- **Official Academic Progress Report Cards:** Printable A4 report cards with subject-wise theory, objective, practical breakdown, class teacher remarks, and principal sign-off blocks.

### 7. Communication & Real-Time SMS Gateway (`/app/system/sms-gateway`)
- **Institutional SMS Dispatch:** Multi-campus SMS templates for fee payment alerts, absence notifications, and exam result publications with audit delivery logs.
- **Notice Board:** Campus-specific announcements and circular publications.

---

## 🛠️ Technology Stack

### Backend
- **Framework:** .NET 8 Web API (Clean Architecture: Domain, Application, Infrastructure, API)
- **Database:** PostgreSQL (Entity Framework Core 8 with Code-First Migrations)
- **Security:** JWT Bearer Authentication, BCrypt Password Hashing, Multi-Campus Tenant Scoping Middleware
- **Rate Limiting:** .NET 8 Fixed-Window Rate Limiter on sensitive authentication routes

### Frontend
- **Framework:** Angular 17/18 Standalone Architecture
- **State Management:** Reactive Domain Stores (`AcademicStore`, `StudentStore`, `TeacherStore`, `AttendanceStore`, `FinanceStore`, `ExamStore`, `SystemStore`) powered by RxJS `BehaviorSubject`
- **Styling:** Custom CSS Design System with responsive grid, KPI cards, and print media queries

---

## 📦 Getting Started

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js](https://nodejs.org/) (v18+ or v20+)
- [PostgreSQL 14+](https://www.postgresql.org/)

### 1. Database Configuration
Ensure PostgreSQL is running locally on port `5432` with a database named `school_management`.  
Connection string in `backend/src/SchoolManagement.Api/appsettings.json`:
```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=school_management;Username=postgres;Password=your_password"
}
```

### 2. Backend Setup & Run
```powershell
cd backend
dotnet restore SchoolManagement.sln
dotnet build SchoolManagement.sln
dotnet run --project src/SchoolManagement.Api
```
The API will start at **http://localhost:5000**.  
Swagger documentation available at **http://localhost:5000/swagger**.

### 3. Frontend Setup & Run
```powershell
cd Fontend
npm install
npm start
```
The Angular application will run at **http://localhost:4200**.

---

## 🔐 Default Demo Accounts

All credentials adhere to the institutional password scheme:

| Role | Username | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin123` | Full unrestricted institutional access across all campuses |
| **Bursar / Accountant** | `accountant` | `accountant123` | Finance, fee structures, payroll summary, fee collections |
| **Senior Teacher** | `teacher` | `teacher123` | Classes, routine schedule, attendance, marks entry |
| **Student** | `student` | `student123` | Personal profile, report cards, class routines, fee dues |
| **Parent / Guardian** | `guardian` | `guardian123` | Children profile, academic progress, fee payment history |

---

## 🧪 Verification & Integration Testing

The project includes ready-to-run PowerShell verification scripts in `scratch/`:
- `scratch/e2e_integration_test.ps1`: Full 10-module end-to-end multi-campus test suite.
- `scratch/test_live_workflows.ps1`: Admission, attendance, exam marks, and invoicing pipeline.
- `scratch/test_payroll_and_seed_teachers.ps1`: Multi-campus faculty payroll generation, approval, disbursement, and pay slips.
- `scratch/test_student_promotion.ps1`: Student batch promotion, retention, and annual session migration.
- `scratch/test_role_access_control.ps1`: Role permission boundaries and HTTP 403 Forbidden enforcement.

---

## 📄 License
Licensed under the [MIT License](LICENSE).
