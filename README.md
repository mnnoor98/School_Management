# School Management System (DMSC-101 Academic Portal)

A comprehensive, enterprise-grade multi-campus School Management System built with **.NET 8 Clean Architecture**, **PostgreSQL**, and **Angular 18/22**.

---

## 🚀 Key Features

- **Multi-Campus Data Isolation:** Strict campus isolation powered by `ICampusScopedEntity` and EF Core global query filters.
- **Dynamic Role-Based Access Control (RBAC):** Granular 4-tier permission engine supporting Super Admin, Principal, Teachers, Accountants, Guardians, and Students.
- **Institutional & Guardian Portals:** Executive leadership dashboard and dedicated Parent/Guardian portal for academic tracking, schedule, and fee settlement.
- **Student Lifecycle & Directory:** Admission processing, student dossier, roll management, section assignments, and promotions.
- **Academic Engine:** Class & Section management, Subject catalog, Timetable / Class Routine generator with conflict detection.
- **Attendance Engine:** Daily student/faculty attendance marking, absence tracking, and correction audit trail.
- **Examination & Result Processing:** Exam terms, schedules, marks entry, GPA / Letter Grade calculation, and printable official student progress report cards.
- **Bulk Excel Import/Export Engine:** ClosedXML-powered automated Excel template generation and bulk student admissions & term-end exam marks upload with cell validations.
- **Automated SMS Gateway:** Real-time SMS dispatch via Greenweb/Teletalk adapters for automated absence alerts to guardians and instant money receipts upon fee payment.
- **Finance & Multi-Channel Payments:** Fee structure setup, batch invoices, counter cashier collection, bKash / Nagad online payment gateway checkout, and daily multi-channel cashier closing reconciliation report.
- **Multi-Tenant In-Memory Caching:** High-speed, campus-scoped in-memory cache layer (`ICampusCacheService`) with automated cache eviction on mutations for academic metadata and fee structures.
- **Staff Leave & SMS Dispatch:** Teacher leave application review workflow and SMS broadcast logs.
- **Modular Frontend Architecture:** Decoupled into 7 domain feature state stores (`AcademicStore`, `StudentStore`, `TeacherStore`, `AttendanceStore`, `FinanceStore`, `ExamStore`, `SystemStore`).

---

## 🛠️ Technology Stack

### Backend
- **Framework:** .NET 8 Web API (Clean Architecture: Domain, Application, Infrastructure, API)
- **Database:** PostgreSQL (Entity Framework Core 8 with Code-First Migrations)
- **Authentication:** JWT Bearer Authentication with SHA256 & Refresh Tokens
- **Rate Limiting:** .NET 8 fixed-window rate limiter on auth endpoints
- **Test Suite:** xUnit integration test suite with 96 security & isolation test assertions

### Frontend
- **Framework:** Angular 18/22 (Standalone Components, Signals, Reactive Stores)
- **Styling:** Custom Vanilla CSS Design System with responsive grid, glassmorphism, and micro-animations
- **Routing:** Permission-guarded routes with dynamic menu authorization

---

## 📦 Getting Started

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js](https://nodejs.org/) (v18+ or v20+)
- [Docker & Docker Compose](https://www.docker.com/) (optional, for containerized run)
- [PostgreSQL 14+](https://www.postgresql.org/) (if running natively)

---

### Option A: Run with Docker Compose (Recommended)

Start the entire stack (Database, .NET 8 Backend API, and Angular Nginx Frontend) with a single command:

```bash
docker compose up --build -d
```

- Frontend App: **http://localhost:4200**
- Backend API & Swagger: **http://localhost:5000/swagger**
- API Health Check: **http://localhost:5000/health**

To stop all services:
```bash
docker compose down
```

---

### Option B: Run Locally on Host

#### 1. Backend Setup
```bash
cd backend
dotnet restore SchoolManagement.sln
dotnet build SchoolManagement.sln
dotnet run --project src/SchoolManagement.Api/SchoolManagement.Api.csproj
```
The API will run on **http://localhost:5000**.

#### 2. Run Backend Tests
```bash
dotnet test backend/SchoolManagement.sln -m:1
```
Runs all 96 security and isolation tests.

#### 3. Frontend Setup
```bash
cd Fontend
npm install
npm run build
npm start
```
Frontend accessible at **http://localhost:4200**.

---

## 🔐 Default Demo Accounts

| Role | Username | Password |
|---|---|---|
| **Super Admin** | `admin` | `admin123` |
| **Senior Teacher** | `teacher` | `teacher123` |
| **Accountant** | `accountant` | `accountant123` |
| **Parent / Guardian** | `guardian` | `guardian123` |
| **Student** | `student` | `student123` |

---

## 🔄 CI / CD Pipeline

Automated GitHub Actions CI/CD workflow is configured in [`.github/workflows/ci.yml`](.github/workflows/ci.yml):
1. **Backend CI:** Restores, builds Release solution, executes all 96 security integration tests on .NET 8 LTS.
2. **Frontend CI:** Restores npm dependencies with caching and builds the production Angular bundle.
3. **Container Validation:** Validates Docker Compose files and builds both container images.

---

## 📡 Operational Endpoints (Sprint 2 & 3 Additions)

| Domain | Method & Route | Description |
|---|---|---|
| **Bulk Students** | `GET /api/v1/students/import-template` | Download Excel admission template with cell data-validation dropdowns. |
| **Bulk Students** | `POST /api/v1/students/bulk-import` | Multipart Excel bulk student import inside a single database transaction. |
| **Bulk Marks** | `GET /api/v1/exams/{id}/marks-template?classId=X&subjectId=Y` | Pre-populated Excel marksheet template with student roll and names. |
| **Bulk Marks** | `POST /api/v1/exams/{id}/marks-bulk-upload` | Multipart Excel marks upload with automated GPA and letter grade computation. |
| **SMS Alerts** | Automated via `Attendance` & `Fees` | Automatic SMS alerts dispatched to parents on absence & instant fee payment receipt. |
| **Digital Payments** | `POST /api/v1/fees/online-payment/initiate` | Create digital payment checkout session (bKash / Nagad). |
| **Digital Payments** | `POST /api/v1/fees/online-payment/execute` | Complete transaction, settle invoice, and trigger SMS confirmation receipt. |
| **Accounts Shift** | `GET /api/v1/fees/reconciliation/daily-closing?date=YYYY-MM-DD` | Daily cashier shift reconciliation report (Cash vs bKash vs Nagad vs Bank). |

---

## 📄 License
Licensed under the [MIT License](LICENSE).
