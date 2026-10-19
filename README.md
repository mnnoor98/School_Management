# School Management System (DMSC-101 Academic Portal)

A comprehensive, enterprise-grade School Management System built with **.NET 8 Clean Architecture** and **Angular 18**.

## 🚀 Key Features
- **Dynamic Role-Based Access Control (RBAC):** Granular permission engine supporting Super Admin, Principal, Teachers, Accountants, Guardians, and Students.
- **Institutional & Guardian Portals:** Tailored executive dashboard for school leadership and a dedicated Parent & Guardian portal for student academic tracking, schedule, and online fee settlement.
- **Student Lifecycle & Directory:** Admission processing, student dossier, roll management, and status updates.
- **Academic Engine:** Class & Section management, Course & Subject catalog, Timetable / Class Routine generator with teacher conflict detection.
- **Attendance Engine:** Daily student and faculty attendance marking, real-time absence tracking, and monthly percentage analytics.
- **Examination & Result Processing:** Exam terms, marks entry, GPA / Letter Grade calculation, and printable official student progress report cards.
- **Finance & Fee Collection:** Fee structure setup, multi-term student invoice generation, mobile banking / gateway fee clearance, and instant receipt vouchers.
- **Notice Board & Communication:** School-wide circulars, announcements, and parent-teacher updates.

---

## 🛠️ Technology Stack

### Backend
- **Framework:** .NET 8 Web API (Clean Architecture: Domain, Application, Infrastructure, API)
- **Database:** PostgreSQL (Entity Framework Core 8 with Code-First Migrations)
- **Authentication:** JWT Bearer Authentication with SHA256 & Refresh Tokens
- **Design Patterns:** CQRS / MediatR, Repository / UnitOfWork pattern, Service Layers

### Frontend
- **Framework:** Angular 18 (Standalone Components, Signals, Reactive Services)
- **Styling:** Custom Vanilla CSS Design System with responsive grid, glassmorphism, and micro-animations
- **Routing:** Permission-guarded routes with dynamic sidebar generation

---

## 📦 Getting Started

### Prerequisites
- .NET 8 SDK
- Node.js (v18+ or v20+)
- PostgreSQL 14+

### Backend Setup
`ash
cd backend/src/SchoolManagement.Api
dotnet restore
dotnet ef database update
dotnet run
`
API runs on http://localhost:5000.

### Frontend Setup
`ash
cd Fontend
npm install
npx ng serve --port 4200
`
Application accessible at http://localhost:4200.

---

## 🔐 Default Demo Accounts
| Role | Username | Password |
|---|---|---|
| Super Admin | dmin | dmin123 |
| Senior Teacher | 	eacher | 	eacher123 |
| Accountant | ccountant | ccountant123 |
| Parent / Guardian | guardian | guardian123 |
| Student | student | student123 |

---

## 📄 License
Licensed under the [MIT License](LICENSE).
