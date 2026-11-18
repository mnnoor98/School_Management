--
-- PostgreSQL database dump
--

\restrict OZAeoemb5XPlSIFN2uE7nFnZJUvIAd15uOal5t4V6VW03IDd8x5J2pvakr748KU

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: academic; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA academic;


ALTER SCHEMA academic OWNER TO postgres;

--
-- Name: attendance; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA attendance;


ALTER SCHEMA attendance OWNER TO postgres;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO postgres;

--
-- Name: employee; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA employee;


ALTER SCHEMA employee OWNER TO postgres;

--
-- Name: exam; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA exam;


ALTER SCHEMA exam OWNER TO postgres;

--
-- Name: finance; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA finance;


ALTER SCHEMA finance OWNER TO postgres;

--
-- Name: school; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA school;


ALTER SCHEMA school OWNER TO postgres;

--
-- Name: student; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA student;


ALTER SCHEMA student OWNER TO postgres;

--
-- Name: system; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA system;


ALTER SCHEMA system OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: class_routines; Type: TABLE; Schema: academic; Owner: postgres
--

CREATE TABLE academic.class_routines (
    "Id" text NOT NULL,
    "SchoolId" text NOT NULL,
    "Day" text NOT NULL,
    "PeriodNumber" integer NOT NULL,
    "StartTime" text NOT NULL,
    "EndTime" text NOT NULL,
    "ClassId" text NOT NULL,
    "ClassName" text NOT NULL,
    "SectionId" text NOT NULL,
    "SectionName" text NOT NULL,
    "SubjectId" text NOT NULL,
    "SubjectName" text NOT NULL,
    "TeacherId" text NOT NULL,
    "TeacherName" text NOT NULL,
    "RoomNo" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE academic.class_routines OWNER TO postgres;

--
-- Name: class_subjects; Type: TABLE; Schema: academic; Owner: postgres
--

CREATE TABLE academic.class_subjects (
    "Id" text NOT NULL,
    "SchoolId" text NOT NULL,
    "ClassId" text NOT NULL,
    "ClassName" text NOT NULL,
    "SubjectId" text NOT NULL,
    "SubjectName" text NOT NULL,
    "TeacherId" text NOT NULL,
    "TeacherName" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE academic.class_subjects OWNER TO postgres;

--
-- Name: classes; Type: TABLE; Schema: academic; Owner: postgres
--

CREATE TABLE academic.classes (
    "Id" text NOT NULL,
    "SchoolId" text NOT NULL,
    "Name" text NOT NULL,
    "Code" text NOT NULL,
    "SortOrder" integer NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE academic.classes OWNER TO postgres;

--
-- Name: sections; Type: TABLE; Schema: academic; Owner: postgres
--

CREATE TABLE academic.sections (
    "Id" text NOT NULL,
    "SchoolId" text NOT NULL,
    "ClassId" text NOT NULL,
    "ClassName" text NOT NULL,
    "Name" text NOT NULL,
    "Capacity" integer NOT NULL,
    "ClassTeacherId" text,
    "ClassTeacherName" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE academic.sections OWNER TO postgres;

--
-- Name: subjects; Type: TABLE; Schema: academic; Owner: postgres
--

CREATE TABLE academic.subjects (
    "Id" text NOT NULL,
    "SchoolId" text NOT NULL,
    "Code" text NOT NULL,
    "Name" text NOT NULL,
    "Type" text NOT NULL,
    "FullMarks" numeric(14,2) NOT NULL,
    "PassMarks" numeric(14,2) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE academic.subjects OWNER TO postgres;

--
-- Name: attendance_correction_logs; Type: TABLE; Schema: attendance; Owner: postgres
--

CREATE TABLE attendance.attendance_correction_logs (
    "Id" text NOT NULL,
    "SchoolId" text NOT NULL,
    "AttendanceRecordId" text NOT NULL,
    "Date" timestamp with time zone NOT NULL,
    "StudentName" text NOT NULL,
    "PreviousStatus" text NOT NULL,
    "NewStatus" text NOT NULL,
    "Reason" text NOT NULL,
    "UpdatedBy" text NOT NULL,
    "Timestamp" timestamp with time zone NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE attendance.attendance_correction_logs OWNER TO postgres;

--
-- Name: student_attendance; Type: TABLE; Schema: attendance; Owner: postgres
--

CREATE TABLE attendance.student_attendance (
    "Id" text NOT NULL,
    "SchoolId" text NOT NULL,
    "EnrollmentId" text NOT NULL,
    "StudentId" text NOT NULL,
    "StudentName" text NOT NULL,
    "RollNo" text NOT NULL,
    "ClassId" text NOT NULL,
    "SectionId" text NOT NULL,
    "AttendanceDate" timestamp with time zone NOT NULL,
    "Status" text NOT NULL,
    "Remark" text,
    "MarkedBy" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE attendance.student_attendance OWNER TO postgres;

--
-- Name: menus; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.menus (
    "Id" text NOT NULL,
    "Code" text NOT NULL,
    "Name" text NOT NULL,
    "ParentCode" text,
    "Route" text,
    "Icon" text NOT NULL,
    "Type" integer NOT NULL,
    "DisplayOrder" integer NOT NULL,
    "IsActive" boolean NOT NULL,
    "IsVisible" boolean NOT NULL,
    "PermissionCode" text,
    "Badge" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE auth.menus OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.permissions (
    "Id" text NOT NULL,
    "Code" text NOT NULL,
    "Description" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE auth.permissions OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.refresh_tokens (
    "Id" text NOT NULL,
    "UserId" text NOT NULL,
    "Token" text NOT NULL,
    "ExpiresAt" timestamp with time zone NOT NULL,
    "IsRevoked" boolean NOT NULL,
    "ReplacedByToken" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE auth.refresh_tokens OWNER TO postgres;

--
-- Name: role_menu_permissions; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.role_menu_permissions (
    "Id" text NOT NULL,
    "RoleId" text NOT NULL,
    "MenuCode" text NOT NULL,
    "View" boolean NOT NULL,
    "Create" boolean NOT NULL,
    "Edit" boolean NOT NULL,
    "Delete" boolean NOT NULL,
    "Approve" boolean NOT NULL,
    "Export" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE auth.role_menu_permissions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.roles (
    "Id" text NOT NULL,
    "SchoolId" text NOT NULL,
    "Code" text NOT NULL,
    "Name" text NOT NULL,
    "Description" text NOT NULL,
    "IsSystem" boolean NOT NULL,
    "IsActive" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE auth.roles OWNER TO postgres;

--
-- Name: user_menu_permissions; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.user_menu_permissions (
    "Id" text NOT NULL,
    "UserId" text NOT NULL,
    "MenuCode" text NOT NULL,
    "Action" text NOT NULL,
    "Override" integer NOT NULL,
    "GrantedBy" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE auth.user_menu_permissions OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.user_roles (
    "Id" text NOT NULL,
    "UserId" text NOT NULL,
    "RoleId" text NOT NULL,
    "SchoolId" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE auth.user_roles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.users (
    "Id" text NOT NULL,
    "Username" character varying(100) NOT NULL,
    "FullName" character varying(150) NOT NULL,
    "Email" character varying(150) NOT NULL,
    "PasswordHash" text NOT NULL,
    "RoleId" text NOT NULL,
    "RoleName" text NOT NULL,
    "SchoolId" text NOT NULL,
    "BranchId" text NOT NULL,
    "Avatar" text NOT NULL,
    "Phone" text NOT NULL,
    "IsActive" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE auth.users OWNER TO postgres;

--
-- Name: teachers; Type: TABLE; Schema: employee; Owner: postgres
--

CREATE TABLE employee.teachers (
    "Id" text NOT NULL,
    "SchoolId" text NOT NULL,
    "EmployeeCode" text NOT NULL,
    "FullName" text NOT NULL,
    "Designation" text NOT NULL,
    "Department" text NOT NULL,
    "Qualification" text NOT NULL,
    "Email" text NOT NULL,
    "Phone" text NOT NULL,
    "JoiningDate" timestamp with time zone NOT NULL,
    "Status" text NOT NULL,
    "Avatar" text NOT NULL,
    "AssignedSubjectsJson" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE employee.teachers OWNER TO postgres;

--
-- Name: exams; Type: TABLE; Schema: exam; Owner: postgres
--

CREATE TABLE exam.exams (
    "Id" text NOT NULL,
    "SchoolId" text NOT NULL,
    "AcademicYearId" text NOT NULL,
    "Name" text NOT NULL,
    "Term" text NOT NULL,
    "AcademicYear" text NOT NULL,
    "StartDate" timestamp with time zone NOT NULL,
    "EndDate" timestamp with time zone NOT NULL,
    "IsPublished" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE exam.exams OWNER TO postgres;

--
-- Name: marks; Type: TABLE; Schema: exam; Owner: postgres
--

CREATE TABLE exam.marks (
    "Id" text NOT NULL,
    "SchoolId" text NOT NULL,
    "ExamId" text NOT NULL,
    "StudentId" text NOT NULL,
    "StudentName" text NOT NULL,
    "RollNo" text NOT NULL,
    "ClassId" text NOT NULL,
    "SectionId" text NOT NULL,
    "SubjectId" text NOT NULL,
    "SubjectName" text NOT NULL,
    "FullMarks" numeric(14,2) NOT NULL,
    "ObtainedMarks" numeric(14,2) NOT NULL,
    "Grade" text NOT NULL,
    "GradePoint" numeric(4,2) NOT NULL,
    "IsPass" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE exam.marks OWNER TO postgres;

--
-- Name: fee_structures; Type: TABLE; Schema: finance; Owner: postgres
--

CREATE TABLE finance.fee_structures (
    "Id" text NOT NULL,
    "SchoolId" text NOT NULL,
    "AcademicYearId" text NOT NULL,
    "ClassId" text NOT NULL,
    "ClassName" text NOT NULL,
    "FeeTypeId" text NOT NULL,
    "FeeTypeName" text NOT NULL,
    "Amount" numeric(14,2) NOT NULL,
    "DueDate" timestamp with time zone NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE finance.fee_structures OWNER TO postgres;

--
-- Name: fee_types; Type: TABLE; Schema: finance; Owner: postgres
--

CREATE TABLE finance.fee_types (
    "Id" text NOT NULL,
    "SchoolId" text NOT NULL,
    "Name" text NOT NULL,
    "Code" text NOT NULL,
    "Frequency" text NOT NULL,
    "Description" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE finance.fee_types OWNER TO postgres;

--
-- Name: invoices; Type: TABLE; Schema: finance; Owner: postgres
--

CREATE TABLE finance.invoices (
    "Id" text NOT NULL,
    "SchoolId" text NOT NULL,
    "InvoiceNo" text NOT NULL,
    "StudentId" text NOT NULL,
    "StudentName" text NOT NULL,
    "RollNo" text NOT NULL,
    "ClassName" text NOT NULL,
    "SectionName" text NOT NULL,
    "FeeTypeId" text NOT NULL,
    "FeeTypeName" text NOT NULL,
    "TotalAmount" numeric(14,2) NOT NULL,
    "DiscountAmount" numeric(14,2) NOT NULL,
    "NetAmount" numeric(14,2) NOT NULL,
    "PaidAmount" numeric(14,2) NOT NULL,
    "DueAmount" numeric(14,2) NOT NULL,
    "DueDate" timestamp with time zone NOT NULL,
    "Status" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE finance.invoices OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: finance; Owner: postgres
--

CREATE TABLE finance.payments (
    "Id" text NOT NULL,
    "SchoolId" text NOT NULL,
    "ReceiptNo" text NOT NULL,
    "InvoiceId" text NOT NULL,
    "StudentId" text NOT NULL,
    "StudentName" text NOT NULL,
    "RollNo" text NOT NULL,
    "ClassName" text NOT NULL,
    "AmountPaid" numeric(14,2) NOT NULL,
    "PaymentMethod" text NOT NULL,
    "TransactionRef" text,
    "PaymentDate" timestamp with time zone NOT NULL,
    "CollectedBy" text NOT NULL,
    "Notes" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE finance.payments OWNER TO postgres;

--
-- Name: __EFMigrationsHistory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL
);


ALTER TABLE public."__EFMigrationsHistory" OWNER TO postgres;

--
-- Name: academic_years; Type: TABLE; Schema: school; Owner: postgres
--

CREATE TABLE school.academic_years (
    "Id" text NOT NULL,
    "SchoolId" text NOT NULL,
    "Name" text NOT NULL,
    "StartDate" timestamp with time zone NOT NULL,
    "EndDate" timestamp with time zone NOT NULL,
    "IsCurrent" boolean NOT NULL,
    "IsLocked" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE school.academic_years OWNER TO postgres;

--
-- Name: branches; Type: TABLE; Schema: school; Owner: postgres
--

CREATE TABLE school.branches (
    "Id" text NOT NULL,
    "SchoolId" text NOT NULL,
    "Code" text NOT NULL,
    "Name" text NOT NULL,
    "Address" text NOT NULL,
    "Phone" text NOT NULL,
    "IsActive" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE school.branches OWNER TO postgres;

--
-- Name: schools; Type: TABLE; Schema: school; Owner: postgres
--

CREATE TABLE school.schools (
    "Id" text NOT NULL,
    "Name" text NOT NULL,
    "Code" text NOT NULL,
    "Address" text NOT NULL,
    "Contact" text NOT NULL,
    "Email" text NOT NULL,
    "Logo" text NOT NULL,
    "Website" text NOT NULL,
    "Status" text NOT NULL,
    "Timezone" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE school.schools OWNER TO postgres;

--
-- Name: enrollments; Type: TABLE; Schema: student; Owner: postgres
--

CREATE TABLE student.enrollments (
    "Id" text NOT NULL,
    "SchoolId" text NOT NULL,
    "StudentId" text NOT NULL,
    "AcademicYearId" text NOT NULL,
    "ClassId" text NOT NULL,
    "SectionId" text NOT NULL,
    "RollNo" text NOT NULL,
    "EnrollmentDate" timestamp with time zone NOT NULL,
    "Status" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE student.enrollments OWNER TO postgres;

--
-- Name: students; Type: TABLE; Schema: student; Owner: postgres
--

CREATE TABLE student.students (
    "Id" text NOT NULL,
    "SchoolId" text NOT NULL,
    "AdmissionNo" text NOT NULL,
    "FullName" text NOT NULL,
    "BanglaName" text,
    "DateOfBirth" timestamp with time zone NOT NULL,
    "Gender" text NOT NULL,
    "BloodGroup" text NOT NULL,
    "Religion" text NOT NULL,
    "Email" text NOT NULL,
    "Phone" text NOT NULL,
    "PresentAddress" text NOT NULL,
    "PermanentAddress" text NOT NULL,
    "PhotoUrl" text NOT NULL,
    "GuardianName" text NOT NULL,
    "GuardianRelation" text NOT NULL,
    "GuardianPhone" text NOT NULL,
    "GuardianOccupation" text NOT NULL,
    "GuardianIncome" text NOT NULL,
    "AcademicYearId" text NOT NULL,
    "ClassId" text NOT NULL,
    "ClassName" text NOT NULL,
    "SectionId" text NOT NULL,
    "SectionName" text NOT NULL,
    "RollNo" text NOT NULL,
    "AdmissionDate" timestamp with time zone NOT NULL,
    "Status" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE student.students OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: system; Owner: postgres
--

CREATE TABLE system.audit_logs (
    "Id" text NOT NULL,
    "SchoolId" text NOT NULL,
    "Timestamp" timestamp with time zone NOT NULL,
    "UserName" text NOT NULL,
    "UserRole" text NOT NULL,
    "Action" text NOT NULL,
    "Module" text NOT NULL,
    "TargetRecord" text NOT NULL,
    "Details" text NOT NULL,
    "SchoolScope" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE system.audit_logs OWNER TO postgres;

--
-- Name: notices; Type: TABLE; Schema: system; Owner: postgres
--

CREATE TABLE system.notices (
    "Id" text NOT NULL,
    "SchoolId" text NOT NULL,
    "Title" text NOT NULL,
    "Category" text NOT NULL,
    "TargetAudience" text NOT NULL,
    "PublishedDate" timestamp with time zone NOT NULL,
    "Content" text NOT NULL,
    "IsImportant" boolean NOT NULL,
    "Author" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone
);


ALTER TABLE system.notices OWNER TO postgres;

--
-- Data for Name: class_routines; Type: TABLE DATA; Schema: academic; Owner: postgres
--

COPY academic.class_routines ("Id", "SchoolId", "Day", "PeriodNumber", "StartTime", "EndTime", "ClassId", "ClassName", "SectionId", "SectionName", "SubjectId", "SubjectName", "TeacherId", "TeacherName", "RoomNo", "CreatedAt", "UpdatedAt") FROM stdin;
rt-01	sch-01	Sunday	1	08:30 AM	09:20 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-math	Higher Mathematics	tch-001	Sarah Jenkins	Science Lab 3	2026-10-20 00:18:31.201413+06	\N
rt-02	sch-01	Sunday	2	09:25 AM	10:15 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-phys	Physics	tch-001	Sarah Jenkins	Room 204	2026-10-20 00:18:31.201413+06	\N
rt-03	sch-01	Sunday	3	10:35 AM	11:25 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-chem	Chemistry	tch-002	Dr. Kamal Uddin	Chem Lab 1	2026-10-20 00:18:31.201413+06	\N
rt-04	sch-01	Sunday	4	11:30 AM	12:20 PM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-eng	English Literature	tch-003	Farhana Haque	Room 204	2026-10-20 00:18:31.201413+06	\N
rt-05	sch-01	Sunday	5	01:00 PM	01:50 PM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-ict	Information Technology	tch-004	Tariqul Islam	Computer Lab A	2026-10-20 00:18:31.201413+06	\N
rt-06	sch-01	Monday	1	08:30 AM	09:20 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-phys	Physics	tch-001	Sarah Jenkins	Room 204	2026-10-20 00:18:31.201413+06	\N
rt-07	sch-01	Monday	2	09:25 AM	10:15 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-math	Higher Mathematics	tch-001	Sarah Jenkins	Science Lab 3	2026-10-20 00:18:31.201413+06	\N
rt-08	sch-01	Monday	3	10:35 AM	11:25 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-bio	Biology	tch-005	Mahfuza Khatun	Bio Lab	2026-10-20 00:18:31.201413+06	\N
rt-09	sch-01	Tuesday	1	08:30 AM	09:20 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-math	Higher Mathematics	tch-001	Sarah Jenkins	Science Lab 3	2026-10-20 00:18:31.201413+06	\N
rt-10	sch-01	Tuesday	2	09:25 AM	10:15 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-chem	Chemistry	tch-002	Dr. Kamal Uddin	Chem Lab 1	2026-10-20 00:18:31.201413+06	\N
rt-11	sch-01	Wednesday	1	08:30 AM	09:20 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-ict	Information Technology	tch-004	Tariqul Islam	Computer Lab A	2026-10-20 00:18:31.201413+06	\N
rt-12	sch-01	Wednesday	2	09:25 AM	10:15 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-eng	English Literature	tch-003	Farhana Haque	Room 204	2026-10-20 00:18:31.201413+06	\N
rt-13	sch-01	Thursday	1	08:30 AM	09:20 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-math	Higher Mathematics	tch-001	Sarah Jenkins	Science Lab 3	2026-10-20 00:18:31.201413+06	\N
rt-14	sch-01	Thursday	2	09:25 AM	10:15 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-phys	Physics	tch-001	Sarah Jenkins	Room 204	2026-10-20 00:18:31.201413+06	\N
rt-15	sch-01	Thursday	3	10:35 AM	11:25 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-bio	Biology	tch-005	Mahfuza Khatun	Bio Lab	2026-10-20 00:18:31.201413+06	\N
\.


--
-- Data for Name: class_subjects; Type: TABLE DATA; Schema: academic; Owner: postgres
--

COPY academic.class_subjects ("Id", "SchoolId", "ClassId", "ClassName", "SubjectId", "SubjectName", "TeacherId", "TeacherName", "CreatedAt", "UpdatedAt") FROM stdin;
\.


--
-- Data for Name: classes; Type: TABLE DATA; Schema: academic; Owner: postgres
--

COPY academic.classes ("Id", "SchoolId", "Name", "Code", "SortOrder", "CreatedAt", "UpdatedAt") FROM stdin;
cls-09	sch-01	Class 9	CLS-09	1	2026-10-20 00:18:31.201413+06	\N
cls-10	sch-01	Class 10	CLS-10	2	2026-10-20 00:18:31.201413+06	\N
cls-11	sch-01	Class 11	CLS-11	3	2026-10-20 00:18:31.201413+06	\N
cls-12	sch-01	Class 12	CLS-12	4	2026-10-20 00:18:31.201413+06	\N
\.


--
-- Data for Name: sections; Type: TABLE DATA; Schema: academic; Owner: postgres
--

COPY academic.sections ("Id", "SchoolId", "ClassId", "ClassName", "Name", "Capacity", "ClassTeacherId", "ClassTeacherName", "CreatedAt", "UpdatedAt") FROM stdin;
sec-10a	sch-01	cls-10	Class 10	Padma (Section A)	45	tch-001	Sarah Jenkins	2026-10-20 00:18:31.201413+06	\N
sec-10b	sch-01	cls-10	Class 10	Meghna (Section B)	40	tch-002	Dr. Kamal Uddin	2026-10-20 00:18:31.201413+06	\N
sec-09a	sch-01	cls-09	Class 9	Lotus (Section A)	40	tch-003	Farhana Haque	2026-10-20 00:18:31.201413+06	\N
sec-09b	sch-01	cls-09	Class 9	Tulip (Section B)	40	tch-004	Tariqul Islam	2026-10-20 00:18:31.201413+06	\N
sec-11a	sch-01	cls-11	Class 11	Science Section A	45	tch-001	Sarah Jenkins	2026-10-20 00:18:31.201413+06	\N
sec-12a	sch-01	cls-12	Class 12	Science Section A	45	tch-002	Dr. Kamal Uddin	2026-10-20 00:18:31.201413+06	\N
\.


--
-- Data for Name: subjects; Type: TABLE DATA; Schema: academic; Owner: postgres
--

COPY academic.subjects ("Id", "SchoolId", "Code", "Name", "Type", "FullMarks", "PassMarks", "CreatedAt", "UpdatedAt") FROM stdin;
sub-math	sch-01	MATH-101	Higher Mathematics	Compulsory	100.00	33.00	2026-10-20 00:18:31.201413+06	\N
sub-phys	sch-01	PHY-102	Physics	Compulsory	100.00	33.00	2026-10-20 00:18:31.201413+06	\N
sub-chem	sch-01	CHE-103	Chemistry	Compulsory	100.00	33.00	2026-10-20 00:18:31.201413+06	\N
sub-eng	sch-01	ENG-104	English Literature	Compulsory	100.00	33.00	2026-10-20 00:18:31.201413+06	\N
sub-ict	sch-01	ICT-105	Information Technology	Compulsory	100.00	33.00	2026-10-20 00:18:31.201413+06	\N
sub-bio	sch-01	BIO-106	Biology	Optional	100.00	33.00	2026-10-20 00:18:31.201413+06	\N
\.


--
-- Data for Name: attendance_correction_logs; Type: TABLE DATA; Schema: attendance; Owner: postgres
--

COPY attendance.attendance_correction_logs ("Id", "SchoolId", "AttendanceRecordId", "Date", "StudentName", "PreviousStatus", "NewStatus", "Reason", "UpdatedBy", "Timestamp", "CreatedAt", "UpdatedAt") FROM stdin;
\.


--
-- Data for Name: student_attendance; Type: TABLE DATA; Schema: attendance; Owner: postgres
--

COPY attendance.student_attendance ("Id", "SchoolId", "EnrollmentId", "StudentId", "StudentName", "RollNo", "ClassId", "SectionId", "AttendanceDate", "Status", "Remark", "MarkedBy", "CreatedAt", "UpdatedAt") FROM stdin;
att-001	sch-01	enr-001	stu-001	Tanvir Ahmed	01	cls-10	sec-10a	2026-10-20 00:00:00+06	Present	On time	Sarah Jenkins	2026-10-20 00:18:31.201413+06	\N
att-002	sch-01	enr-002	stu-002	Nusrat Jahan	02	cls-10	sec-10a	2026-10-20 00:00:00+06	Present	On time	Sarah Jenkins	2026-10-20 00:18:31.201413+06	\N
att-003	sch-01	enr-003	stu-003	Fahim Shahriar	03	cls-10	sec-10a	2026-10-20 00:00:00+06	Late	Late by 10 mins	Sarah Jenkins	2026-10-20 00:18:31.201413+06	\N
att-004	sch-01	enr-004	stu-004	Mehedi Hasan	01	cls-10	sec-10b	2026-10-20 00:00:00+06	Present	On time	Dr. Kamal Uddin	2026-10-20 00:18:31.201413+06	\N
att-005	sch-01	enr-005	stu-005	Samia Akter	02	cls-10	sec-10b	2026-10-20 00:00:00+06	Present	On time	Dr. Kamal Uddin	2026-10-20 00:18:31.201413+06	\N
7929adae-71e7-4a8a-92df-f32031d1b1cb	sch-01		stu-002	Nusrat Jahan	02	cls-10	sec-10a	2026-10-20 06:00:00+06	Present		admin	2026-10-20 13:42:02.667949+06	\N
9c98fa1a-88ff-4c40-96f2-08d4e8cf18ed	sch-01		stu-001	Tanvir Ahmed	01	cls-10	sec-10a	2026-10-20 06:00:00+06	Present		admin	2026-10-20 13:42:02.64621+06	\N
df3a23df-e9ae-40d2-aa9f-0115c174a558	sch-01		stu-003	Fahim Shahriar	03	cls-10	sec-10a	2026-10-20 06:00:00+06	Present		admin	2026-10-20 13:42:02.669111+06	\N
\.


--
-- Data for Name: menus; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.menus ("Id", "Code", "Name", "ParentCode", "Route", "Icon", "Type", "DisplayOrder", "IsActive", "IsVisible", "PermissionCode", "Badge", "CreatedAt", "UpdatedAt") FROM stdin;
25cf0c83-77e2-427a-bc3f-dde54a51017a	STUDENTS	Student Management	\N	\N	school	0	2	t	t	\N	\N	2026-10-20 00:14:12.991369+06	\N
25cf1f96-eb29-4773-ae8c-ccf6eb558bab	SECURITY	Security & RBAC	\N	\N	security	0	8	t	t	\N	\N	2026-10-20 00:14:12.991471+06	\N
757afb9d-dc06-47de-bb1d-5a871232f38e	REPORTS	Reports & Analytics	\N	\N	insert_chart	0	7	t	t	\N	\N	2026-10-20 00:14:12.991461+06	\N
7b04dd08-23ae-4233-854b-9753cc0beded	ATTENDANCE	Attendance Engine	\N	\N	event_available	0	4	t	t	\N	\N	2026-10-20 00:14:12.991446+06	\N
a1fea135-84df-4e63-93df-b9eaaa0fd83b	FINANCE	Finance & Fees	\N	\N	account_balance	0	6	t	t	\N	\N	2026-10-20 00:14:12.99146+06	\N
bbc9cb5a-89dc-4436-be67-e19a1b2ca984	ACADEMICS	Academic Operations	\N	\N	auto_stories	0	3	t	t	\N	\N	2026-10-20 00:14:12.991439+06	\N
c09c9c76-795f-4e0f-ad9f-7c4dd5fbf811	EXAMS	Examinations	\N	\N	quiz	0	5	t	t	\N	\N	2026-10-20 00:14:12.991456+06	\N
4be8eb17-e900-4cf4-b0d1-138f7462ee6d	DASHBOARD	Dashboard	\N	/app/dashboard	dashboard	1	1	t	t	\N	\N	2026-10-20 00:14:12.991032+06	\N
6878f5d3-591d-4333-bda2-7f48e7851460	STU_LIST	Student Directory	STUDENTS	/app/students/list	people	1	1	t	t	\N	\N	2026-10-20 00:14:12.99137+06	\N
e4aa6069-3479-4c59-ae21-fd73f8e3eb8a	STU_ADMIT	New Admission	STUDENTS	/app/students/admission	person_add	1	2	t	t	\N	\N	2026-10-20 00:14:12.991438+06	\N
3cc49597-38e5-4096-ab71-a01f58f80e65	ACAD_ROUTINE	Class Timetable	ACADEMICS	/app/academic/routine	calendar_month	1	1	t	t	\N	\N	2026-10-20 00:14:12.991444+06	\N
1597099a-b664-43f9-8ea1-671506119bc4	ACAD_CLASSES	Classes & Sections	ACADEMICS	/app/academic/classes	meeting_room	1	2	t	t	\N	\N	2026-10-20 00:14:12.991445+06	\N
78ab3c75-6061-41a0-8a45-9d23b8c932df	ATT_STUDENT	Daily Attendance	ATTENDANCE	/app/attendance/entry	checklist	1	1	t	t	\N	\N	2026-10-20 00:14:12.991447+06	\N
eccedf23-c05f-4ffa-b144-fba69e34fd0c	ATT_REPORT	Attendance Records	ATTENDANCE	/app/attendance/reports	summarize	1	2	t	t	\N	\N	2026-10-20 00:14:12.991455+06	\N
473cf8fe-cc39-41a1-96cc-f5ba77888e3d	EXAM_RESULTS	Marksheet & Results	EXAMS	/app/exams/marksheet	workspace_premium	1	3	t	t	\N	\N	2026-10-20 00:14:12.991459+06	\N
75126151-9dbb-4eb0-ac29-cef18a0931c6	EXAM_MARKS	Marks Entry	EXAMS	/app/exams/marks	edit_note	1	2	t	t	\N	\N	2026-10-20 00:14:12.991458+06	\N
f20f659f-3294-46c7-8ce0-5e0eee85ee58	EXAM_SETUP	Exam Configuration	EXAMS	/app/exams/setup	assignment	1	1	t	t	\N	\N	2026-10-20 00:14:12.991457+06	\N
31f4f3e6-bc70-447a-bc89-b417090ff8a6	FIN_FEES	Fee Structures	FINANCE	/app/finance/structure	price_change	1	1	t	t	\N	\N	2026-10-20 00:14:12.99146+06	\N
7b73e7c7-6994-441f-8f78-1ba01b5e6f43	FIN_COLLECTION	Collection & Receipts	FINANCE	/app/finance/collection	point_of_sale	1	2	t	t	\N	\N	2026-10-20 00:14:12.991461+06	\N
55efd664-8e14-4eab-bc4d-6500e19ac178	SEC_USERS	User Accounts	SECURITY	/app/admin/users	manage_accounts	1	1	t	t	\N	\N	2026-10-20 00:14:12.991472+06	\N
f3b34f71-2e6a-4f57-8a6c-2d578e97f13a	SEC_ROLES	Role Permissions	SECURITY	/app/admin/roles	badge	1	2	t	t	\N	\N	2026-10-20 00:14:12.991472+06	\N
11e72036-59d6-4517-b241-800645f45708	SEC_MENUS	Dynamic Menus	SECURITY	/app/admin/menu-management	menu_open	1	3	t	t	\N	\N	2026-10-20 00:14:12.991473+06	\N
e12f0526-3676-44cf-a4ba-f16f180a2065	SEC_AUDIT	Security Audit Trail	SECURITY	/app/admin/audit-log	policy	1	4	t	t	\N	\N	2026-10-20 00:14:12.991473+06	\N
ae7a58c0-08e8-49d1-83f1-16fb8fc478c3	REP_ACADEMIC	Academic Performance	REPORTS	/app/reports	analytics	1	1	t	t	\N	\N	2026-10-20 00:14:12.991462+06	\N
d0b53b03-07ed-46d7-a210-69c3ce3bc19b	REP_FINANCE	Financial Ledger	REPORTS	/app/reports	receipt_long	1	2	t	t	\N	\N	2026-10-20 00:14:12.991466+06	\N
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.permissions ("Id", "Code", "Description", "CreatedAt", "UpdatedAt") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.refresh_tokens ("Id", "UserId", "Token", "ExpiresAt", "IsRevoked", "ReplacedByToken", "CreatedAt", "UpdatedAt") FROM stdin;
05d033ad-ca97-4ebd-ba07-6bbf063e9ae5	usr-teacher	S3kXgV9TOYfkGvwAsW2oeyBLcvnX4W44cNKHYzDnv5egf3xmzES3rg1hIUzwNJ2osogPXJwC3jKTlZgvZ7FaPw==	2026-10-27 00:47:13.087979+06	t	\N	2026-10-20 00:47:13.087979+06	\N
ddf6cc71-029b-4518-806e-dd0c40ee8f3d	usr-teacher	UVaCDcs6aJaBf4MKahEYUsc269D+RY8Hfpylw7YyiNJEEO2G+9UR5x6GiX1o3CO/k99EK1AEVG3fjfhGXUJGqg==	2026-10-27 00:39:09.737878+06	t	\N	2026-10-20 00:39:09.737878+06	\N
265f1270-c1e8-48ab-a926-a3383be419d5	usr-student	h4xwOwqNK0jcdmWGK3TMiz0swz35HdMhy2iu5zL20JnPrKTAoq6Gw+MWevjZjDzJemKx3afIkinUhjHfgsj7VA==	2026-10-27 00:47:38.278137+06	t	\N	2026-10-20 00:47:38.278137+06	\N
45d572ab-9966-4fec-b26b-675e9c0c6dbc	usr-student	wviXehAxaftzUC6qL3GnrySzL9QGiPPeixXnMXF6JBqkRJCAJoL2rMY/Kfw/d5NAp7wolLy/OYDwxToVlgtKTw==	2026-10-27 00:14:23.245901+06	t	\N	2026-10-20 00:14:23.2459+06	\N
46242e4b-df3c-423f-8cdb-777ccaf7361b	usr-student	qoAa8GOPyYTt4tvuz5WIUCayGSbFlMPi/gxtyriU4aO+JX7JZKu6vNBNH8ZSkDA9Y7c/pHlejquZ/Hl0OYqmxg==	2026-10-27 00:26:49.493976+06	t	\N	2026-10-20 00:26:49.493976+06	\N
7f8c659c-2131-420e-86d5-678e1d7623c2	usr-student	aEjqmoYiBwIqijnFz8YzaJuSWaDNkFFWW3lLaIFz3Ly1qdw1Qv8vZpQAWs8Vjb1VxfhKs08vbfmuqgRmLOJQPw==	2026-10-27 00:39:09.897414+06	t	\N	2026-10-20 00:39:09.897414+06	\N
81342d83-7e33-4a0e-93dd-b8c4a402e8d7	usr-student	t3norH7hT1Bqz3UdN9EvsBjqxROV9Ty6oPOri9n0+wFhbY/RUqtJpyvZy7LNqygAfIok4vZ450aDabqNT3RfDg==	2026-10-27 00:26:49.460917+06	t	\N	2026-10-20 00:26:49.460917+06	\N
638ce154-473a-4f84-a86a-89002d7b85d0	usr-guardian	3wOkYxHFTyXQkQs/DyGprN3TXoGgcWjBqL+oE4/k1VgXiC1l69wCV6qLbuuAkCmtqN9CUa6wsy4cX6XLmPE8FA==	2026-10-27 00:39:10.254752+06	t	\N	2026-10-20 00:39:10.254752+06	\N
7bd993fb-72b1-48fd-936b-64264bb62871	usr-guardian	ZvL16gyVIg4gw6ahKX+k2gjFqq5cHpF5Nd/vrur/UY9XnxmXMiuLBBXNJ32rbkeUofmsH+DQMMA/JOpXHBmoZA==	2026-10-27 00:49:33.014037+06	t	\N	2026-10-20 00:49:33.014037+06	\N
04005e70-d73d-4fc1-806f-c853c6fb5c79	usr-admin	pSPaajGUdnrOx+DMdx+1ALizwuxCrrgQrj8bV7mHEqaFHW+qQ0ian8vS0GPUql5r650UmSINkTeZeeryroHOzA==	2026-10-27 00:50:09.934378+06	t	\N	2026-10-20 00:50:09.934297+06	\N
1e8767a0-0846-46f7-83e4-f37817aa6980	usr-admin	Y2RZkVYPf8n3lbTPIWEAYH3pBask7EUYVBDB1aPUnOgdiyn5BMQ+aHV3v1U3WigsgWJ82UkfB4z1XytGzqy85g==	2026-10-27 00:49:24.802167+06	t	\N	2026-10-20 00:49:24.802166+06	\N
3a7e9bba-c63d-4cc0-a2e9-d8700d03aa4a	usr-admin	Q2PLk84UcrgFeCqvuA49mu67iqD4UDmcxQ1sPHF+6zKcK0hye3T3ahKmg/FhuID4hXHh7Ew0/XRGttOfBPsFow==	2026-10-27 00:26:48.313739+06	t	\N	2026-10-20 00:26:48.313738+06	\N
41fc383b-304a-4e15-95be-76ec905a0ad7	usr-admin	+YeFmy6AOgRgbqQCArXinB9RRUl6Z0JNuDebV0pw/mZm2csx05MH0XBQZS46dNDeB2Z1l/isxgnPtigpOWpYwg==	2026-10-27 00:14:22.54381+06	t	\N	2026-10-20 00:14:22.543754+06	\N
746f8f69-4e45-4a8c-b769-7c9343bedc1e	usr-admin	+CEXTDKeIoR3mA3H9S2PYxJQ2uMYYuZBspeNNfrpEcsP3WF0d25shnOUK/TEQzmKrbsgm/O78EwKCFPYErbPjQ==	2026-10-27 00:43:01.084086+06	t	\N	2026-10-20 00:43:01.084032+06	\N
836a31b1-081d-45e2-98ce-008c6c679a33	usr-admin	di52QKHyDqv1HomMWnzH4iNZkkXP2Qzmyc+JgXfF/4sd8AAaQjXRKUbGqtDGgnrjNeQE+zfOIqnVX2jWpCUkkg==	2026-10-27 00:45:47.571039+06	t	\N	2026-10-20 00:45:47.571038+06	\N
a99ee89c-d941-4df2-bd96-5b6ccfc60473	usr-admin	QutL/CiNkG1qGHbL8B2JlVQVLB1FhpAHhnq8B6kPfD8wRIFyW4tXJqoA4QL148TM91GlnD+AgPn/Dum0OdxtQg==	2026-10-27 00:38:48.549327+06	t	\N	2026-10-20 00:38:48.549327+06	\N
c9c7f873-4656-41b4-b7a4-898276a656a2	usr-admin	yKHqm1YtU85Xwa0fTXf4yhEZ02egMJKlDgEmyzcaDqXCKQZG31CUTGkjgTq92AhmI0K1SdBn31j83rW/8Jd/Aw==	2026-10-27 00:39:09.568588+06	t	\N	2026-10-20 00:39:09.568588+06	\N
d0c60e62-42a8-4262-a3e7-35debcd39a21	usr-admin	NyFWLz97zsfVcDPpongqjpkkyzJoCVfX1N5UsCKXM/ape7vCouQmphtcQZ/msNvYgUwZGj030KUdJ/a2xc7qUA==	2026-10-27 00:26:46.127659+06	t	\N	2026-10-20 00:26:46.127605+06	\N
d61c4c21-2adc-4cf6-8eba-b35a92944fa1	usr-admin	pNiKHFV9mIyZrmqRUU1QcTdsHKFGJgkpMQkM+4I8Vz/RFlao4CeWN0THAQxl7H421HrNK5Pq68X06uoCSGU6mQ==	2026-10-27 00:29:50.631625+06	t	\N	2026-10-20 00:29:50.631625+06	\N
5a16a236-2db3-44cf-8e1e-1c2dceca1f7b	usr-accountant	NFixUdm0Eenk3mIqHb5aDwwJ9E5FDR9xle4z4ojcmPulqdSZe5lCW2ykyBLNOjyGfRF2kgkP/h85hT+ERH21Qw==	2026-10-27 00:39:10.455565+06	t	\N	2026-10-20 00:39:10.455564+06	\N
f3e0cac6-dc49-4684-ab9f-18b9252b8d55	usr-accountant	iB4MxjGE7e3AX6bGL67mN/7D55lyBsQPtKDKoL7AGj1soTxYR3b0sRiPqyz/bqYxuc9NwXIEESWIknQKNiMKVQ==	2026-10-27 00:50:14.271154+06	t	\N	2026-10-20 00:50:14.271153+06	\N
37ac8557-5ac1-42d2-b032-6b87181ed9d9	usr-accountant	XSIMHXbVxxEj6mtxn4eNiVkV/34+ytm0HDD7CjpeBaaZumgGM0zVGPCESZPZrL1O2QkBK/5KUWjsp4iyVZZZrg==	2026-10-27 00:54:37.309101+06	t	\N	2026-10-20 00:54:37.309101+06	\N
1b31b306-5bd8-4060-94f4-0e74de7b3ad3	usr-admin	XJDgjGP68cXs+gow8JgS22jQ4VTY3o7TJYq+xfDGT3ezTaJb3qIs0X15mla20DKaPld0jhfNiTUhGcz75TFhtQ==	2026-10-27 00:54:00.528255+06	t	\N	2026-10-20 00:54:00.528254+06	\N
63468207-d4f3-4c70-947b-4d429f818359	usr-admin	9wb68MMKvZH135mxu8kHGrTuFWixumDJsRxUYvu3JmNIXI5atx/MN1orUsJCXAIrvKYn5wmcfMqFDTcuGHPtAw==	2026-10-27 00:50:15.207123+06	t	\N	2026-10-20 00:50:15.207122+06	\N
7613b1ee-2ab0-4929-8d72-e4da17b7e484	usr-admin	Wmf0DGZsLNQmeFBJXAazCa3QUxENvf5rtRT5is6vYjuoViAim1DCfEMOLz5FaLStl3mNStlQ0efS6g1BAlLxKw==	2026-10-27 00:54:29.108497+06	t	\N	2026-10-20 00:54:29.108496+06	\N
beadf07e-c89d-4320-b7b7-640b32cf3a2f	usr-admin	7E3vJJhrh99ks8ScZP+xaCVgZZEjYu6K0zwviea0y+1p50dunwM1QkZMgiL4TepEbaRtNgCuNJmT5ROlkBABwQ==	2026-10-27 00:50:23.516734+06	t	\N	2026-10-20 00:50:23.516734+06	\N
60aaa1a2-33aa-46d4-84bf-01d46cc2b292	usr-guardian	fqa9W9NIUr3mVfPk+NLSi09iZsqGPIe5QR0tLljOcrNlX/FE27L7tyDfrmMdBtMsLjIdkWA1Qx5cXCpRxeVDJA==	2026-10-27 00:58:32.432253+06	f	\N	2026-10-20 00:58:32.432253+06	\N
8d60a5b1-a9eb-43bf-aaa8-38773eced2ee	usr-3d757131	34GSTiyMzdo+TvAiF+DW5VyUnv+TTHYYfFhEylF8udjWRAKPVBVhhM6k+kauzOmBbww5q4Y9BPKsGy5C8JcuRQ==	2026-10-27 01:01:33.798147+06	f	\N	2026-10-20 01:01:33.798147+06	\N
021ea575-d3af-4cd5-9aae-97922d829ebf	usr-admin	4+WwH7X5Yzhp+oL/dXgU9sq43PurDv5qi/Gg8yz39VHeUfa50ashLfmy3ZGvwX+Jh0FlK9UpkIZ83eniP5z4UQ==	2026-10-27 01:04:46.931855+06	t	\N	2026-10-20 01:04:46.931854+06	\N
1ae5fa85-0c11-4f1f-a49e-7d3c98ee5938	usr-admin	U9A0pgLEsKWgaVjX6CjMNk0iwRYQ4M1Vl/oL9qYWo1NQP/ZRv9+zW/2Tc+PWM+aRsd8w8kQ84xlt4OpFE2UE2w==	2026-10-27 00:58:39.359421+06	t	\N	2026-10-20 00:58:39.35942+06	\N
72eaf32a-1d80-43e9-b47d-fceac97ffb20	usr-admin	OQHs5lp5WVT97UdAk9xaQhKmWBIDb0f9x24TStKCNPEflBwBGBcbI8ZJwljZp1mSlxNNK6uoZJamLdU6fM7Emg==	2026-10-27 00:53:02.390295+06	t	\N	2026-10-20 00:53:02.390294+06	\N
b192ea8f-df96-436d-b452-f679a9df3679	usr-admin	iMnA83Y+ZcL5hkjEUnrHnB5WXRS72pXYS96h977NunSNDND12HnhUbeH4Z2R3L81BmW8NnBaEE/61wWaxD0Z6w==	2026-10-27 01:01:22.648196+06	t	\N	2026-10-20 01:01:22.647807+06	\N
f6fdc6ca-a99d-4719-bd8d-c7c2a50d7502	usr-admin	Yv+n8Egm8mLc6IZ6gOkAploB8lDBtMnXqmTduN7OmWCabdV7YqWEwhUENDkI1PwK67148HrGltsC7HP9PD6P+A==	2026-10-27 00:56:32.353366+06	t	\N	2026-10-20 00:56:32.353366+06	\N
e6df0861-c694-4907-a4dc-49809cf6ff26	usr-2adf7f89	H6jKiDHhzxsxzI97Y9/gYfjSAnbOd+e2WUC9KUP7T4OijlEXJ0RGcgVTYxewHE0zypB0W+mIX2yKoh0ASdboPw==	2026-10-27 01:07:01.088426+06	f	\N	2026-10-20 01:07:01.088426+06	\N
d26471cf-b965-4bde-88c4-91ef2659073e	usr-guardian	1opX8LHkxh9bXH7sPM97k7VaSnv4cMCwXzFXySCa/LuOTr2r/cEJEhQikKCd4CgJu0sR8sZ5MS9M8PxSYo7eNw==	2026-10-27 01:09:40.129152+06	f	\N	2026-10-20 01:09:40.129152+06	\N
8e1deb41-d7d2-40cf-ba05-8b360238bc95	usr-guardian	qTTlL9gSgPZfphNNxE5sIfpsXM3MuBtVMgHp1LLozrc36eUco8TJqa1ReOZtdtGy2g2YrUQpdpHp762mdIRQPw==	2026-10-27 01:10:10.231804+06	f	\N	2026-10-20 01:10:10.231803+06	\N
47227d57-a60b-444b-be4c-759dd5bfddbf	usr-guardian	HxsJd5Ex1n3IT1W0RRU0Qh/I/JhLOULABQIv/m9O3BBV2i+9QtxyGc2e6MJ+O3NJ+zyUHJ5fOekfrGrMJMH7fw==	2026-10-27 01:10:49.356458+06	f	\N	2026-10-20 01:10:49.356457+06	\N
bb97bafd-4eab-4519-ae4f-5ca7cb0857c4	usr-guardian	S2l4STta8Ir/VWtxualR9uXSnGF2+ai+T2n+LkWHqTZ3mIm1udZfU/1D4rKXvsNF90NA0zXLXlmGLaj49K9llw==	2026-10-27 01:14:03.629945+06	f	\N	2026-10-20 01:14:03.629944+06	\N
67b5567d-69d5-491b-b6c0-299d057a3989	usr-guardian	h+4AbC0Z/TQoju5byozAXb7m022UdbXdXDZRW/2xJGSE7t4wWBap2fNhnWp7yibZ416KJgfQsYBLVzOirMUPaw==	2026-10-27 01:29:57.863841+06	f	\N	2026-10-20 01:29:57.86384+06	\N
204236c4-138e-4351-9906-ba0a3eb8e8c0	usr-2adf7f89	ZoPw5hZ8REegkGy7wK0H6Dieqbp2Eklprqbq2nksxR7aum9MLVQrgo39L7g1eNFjtpETzCJK38Bj+B8iQiL21g==	2026-10-27 01:29:58.095357+06	f	\N	2026-10-20 01:29:58.095357+06	\N
2fe2009b-4a36-4547-b83a-bd0baae3a3e9	usr-student	A0rSkadJpt+9a00MkJDCYQroxe7BhtJbol1DhDmv+IUW1JOfz0eIGdX7mm/pMHbSPXoV4pKueo/IOorZMhkmXQ==	2026-10-27 11:59:53.996995+06	f	\N	2026-10-20 11:59:53.996942+06	\N
1255c5f3-b418-4eaa-a4a6-8adb0fac3fd0	usr-student	4M2fh2Ics8VoqUEaKKsZEAOjBukNGIt+HJlLtvEa1FM//HUvt2lBj7iNq9G40693t7aNe6jmH4VLCFv8y+2xFw==	2026-10-27 12:27:48.975249+06	f	\N	2026-10-20 12:27:48.975194+06	\N
bd493337-426c-43aa-b366-54b31a3988fc	usr-2adf7f89	SZdZDQwqqgFBr61BVtwGFaruNQlRxsi4FD2oIdTtv1T172nk4CXy4xh5Ku6sBpRIZb9ROKOQWyOv/um7s5Dchw==	2026-10-27 12:28:51.66689+06	f	\N	2026-10-20 12:28:51.666889+06	\N
a4627c60-3c6c-4626-baba-986bc0ae6aa5	usr-student	RQTARZNmhw37SLaLenMpeatDlP3RJfyNqr7Oh/mkbIf5QOyKT5aLyNj8aPiR49tItaIXpu08/rVyiLk9iFT8kw==	2026-10-27 12:39:57.30252+06	f	\N	2026-10-20 12:39:57.30252+06	\N
3b67ca71-de6f-4bba-acd2-540fa9f4dd3e	usr-2adf7f89	qtwimDrUazGawaKGD83gQQ15y6lIhMOA2rLp5ybkdG8sygj7BCtgsKSQiBHl6Ow7xreGjQYnLeG7DTUF0UYG1g==	2026-10-27 12:40:53.422946+06	f	\N	2026-10-20 12:40:53.422946+06	\N
0ac1383f-d413-4a13-bb8d-5a517a52d24b	usr-teacher	IqVNlvuvg2NLF2R1vipemdYBYKHIFNRvgZfN6upqOYABtHPpEIyumgxZM9/zq8QV8KBdRzWzhIhcUx1pYpOoOw==	2026-10-27 12:41:16.768015+06	t	\N	2026-10-20 12:41:16.768015+06	\N
cb749a6d-ed08-441f-bc11-4ddedb64d9d6	usr-teacher	M12QfucfUyV3JunOD65ZuNxP6S5Hh1a6pKFRI94ch6JRCrvkZJpK1d7DMe64+wUPnv00tF4OIQutIvc/Sl9g1A==	2026-10-27 12:41:26.364054+06	t	\N	2026-10-20 12:41:26.364054+06	\N
dc25890f-c80e-47ef-b5ee-2f0a6c35b10b	usr-teacher	jtyOoFYBtiRVWEyUEJ4QU1fq/gfN7Z5ZncSlI2QsfPQ0e1cmMD2dZ3n/ghUz+o0jS6kd+v40nwc8Tzeky8jDBw==	2026-10-27 13:04:04.950252+06	t	\N	2026-10-20 13:04:04.950252+06	\N
5e12dd82-d107-49b4-a2e2-84cfa0fac07f	usr-teacher	xgNEwaTWRa5Y0ASolnhXipdMQOWwMegB6vePXmbZyGdh18+KMmcCqxnIShVmxW+JkXP3mTLJSozHHigyUGPZtg==	2026-10-27 13:27:13.617739+06	f	\N	2026-10-20 13:27:13.617739+06	\N
6e5a2d22-c311-4702-8803-404967f5fd28	usr-admin	mnnvQEzxAJ+t2ujrjaBz4ZJvc1/1iIGll3dZ/luFgnSDTpwrgME8QjZYcEQ56Z6XdBKF8h6nnNUwmb07kqRIaQ==	2026-10-27 13:36:54.849682+06	f	\N	2026-10-20 13:36:54.849682+06	\N
320ad45c-d69a-416d-8f9d-f292ffd50852	usr-admin	4c+fC+XxTDFl1mySK62NZ0gHv35exABERo69Y0IC4KYKTpVlqZDueBHhLb7gTY2JFFk6k5xs7SEvhVTR1n+YpQ==	2026-10-27 14:10:00.697652+06	f	\N	2026-10-20 14:10:00.697651+06	\N
\.


--
-- Data for Name: role_menu_permissions; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.role_menu_permissions ("Id", "RoleId", "MenuCode", "View", "Create", "Edit", "Delete", "Approve", "Export", "CreatedAt", "UpdatedAt") FROM stdin;
02f1a25f-c2fc-4fb2-88ab-ed9b6e799a7e	role-accountant	REPORTS	t	f	f	f	f	t	2026-10-20 00:14:13.076431+06	\N
0e26d7fa-ae5f-4ef7-8d0e-dffefccf38ff	role-superadmin	FIN_COLLECTION	t	t	t	t	t	t	2026-10-20 00:14:13.076289+06	\N
0e529c0e-7c18-46bf-91a4-5de383e5d0f8	role-teacher	STU_LIST	t	f	f	f	f	t	2026-10-20 00:14:13.075178+06	\N
14035bef-1a24-4f59-b169-0a68b992c58d	role-teacher	ATTENDANCE	t	f	f	f	f	t	2026-10-20 00:14:13.075581+06	\N
151eff50-27ab-484f-85c8-e46da57e0a0d	role-superadmin	SEC_AUDIT	t	t	t	t	t	t	2026-10-20 00:14:13.076716+06	\N
1b9a5c3a-06fe-4aae-a4d4-94ee3f358fd8	role-superadmin	EXAM_MARKS	t	t	t	t	t	t	2026-10-20 00:14:13.075983+06	\N
21550443-f311-4f8b-b8a7-6877ff1d9aed	role-superadmin	ATT_REPORT	t	t	t	t	t	t	2026-10-20 00:14:13.075709+06	\N
2622324d-02f9-4a19-b205-42c86bc89653	role-teacher	EXAM_MARKS	t	t	t	f	t	t	2026-10-20 00:14:13.076011+06	\N
2837e747-a85e-4825-8dc0-9cf7e22de5db	role-accountant	FINANCE	t	f	f	f	f	t	2026-10-20 00:14:13.076188+06	\N
2f376b66-f732-47cd-997f-14993516c79d	role-superadmin	ACAD_ROUTINE	t	t	t	t	t	t	2026-10-20 00:14:13.07542+06	\N
304a3687-ebbd-4f71-ad93-54055bf9c2af	role-superadmin	SEC_USERS	t	t	t	t	t	t	2026-10-20 00:14:13.076623+06	\N
49bd606b-52ae-484a-b3e5-ad8af4d39017	role-superadmin	STU_ADMIT	t	t	t	t	t	t	2026-10-20 00:14:13.075256+06	\N
520610e8-9436-46e2-ab73-5472a44a4435	role-teacher	REP_ACADEMIC	t	f	f	f	f	t	2026-10-20 00:14:13.076489+06	\N
56949d72-fc80-434c-9a1c-426fe0d98e3d	role-superadmin	REP_FINANCE	t	t	t	t	t	t	2026-10-20 00:14:13.076517+06	\N
56fe1db4-e24c-492e-b7d8-bc5b22b23c62	role-accountant	STU_LIST	t	f	f	f	f	t	2026-10-20 00:14:13.075226+06	\N
573aa111-9907-4149-b2e6-7292f79d3a8b	role-superadmin	ATTENDANCE	t	t	t	t	t	t	2026-10-20 00:14:13.075552+06	\N
587be1a0-5aec-4ea1-ba98-4fd43da5a02a	role-superadmin	EXAM_RESULTS	t	t	t	t	t	t	2026-10-20 00:14:13.076047+06	\N
5fe43983-e4a3-4de7-be6f-2b7aca7c4792	role-accountant	DASHBOARD	t	f	f	f	f	t	2026-10-20 00:14:13.074996+06	\N
64f9d5a5-2691-4aea-a30b-1ea85c1d7b25	role-accountant	FIN_FEES	t	t	t	f	f	t	2026-10-20 00:14:13.07626+06	\N
6d4d205b-1457-4c5c-a937-eb14e9cb9ca9	role-superadmin	SEC_ROLES	t	t	t	t	t	t	2026-10-20 00:14:13.076658+06	\N
703e6303-28aa-434d-89f0-5f6c46166599	role-teacher	DASHBOARD	t	f	f	f	f	t	2026-10-20 00:14:13.074797+06	\N
7147c496-133d-4003-9da4-bb66b2af2d9f	role-accountant	REP_FINANCE	t	f	f	f	f	t	2026-10-20 00:14:13.076546+06	\N
745e34ce-c87b-4550-afa1-c907f3be7660	role-superadmin	REPORTS	t	t	t	t	t	t	2026-10-20 00:14:13.076375+06	\N
77fa9e54-f9f3-4b2a-8369-67f2dec9e77f	role-superadmin	STUDENTS	t	t	t	t	t	t	2026-10-20 00:14:13.075031+06	\N
8128fb5b-39c4-4309-aae9-fb674044b02f	role-superadmin	SEC_MENUS	t	t	t	t	t	t	2026-10-20 00:14:13.076687+06	\N
81818188-6dc5-458f-8125-95a836314ad1	role-superadmin	DASHBOARD	t	t	t	t	t	t	2026-10-20 00:14:13.048496+06	\N
95532a1a-ee34-4cf7-b643-9cd6d328e80c	role-teacher	ATT_STUDENT	t	t	t	f	f	t	2026-10-20 00:14:13.075675+06	\N
96563ce0-6c4d-4531-a630-a92dcf7f2255	role-superadmin	FINANCE	t	t	t	t	t	t	2026-10-20 00:14:13.07613+06	\N
9764ace3-4208-4a3e-aede-85595321823d	role-teacher	EXAMS	t	f	f	f	f	t	2026-10-20 00:14:13.075847+06	\N
9d852191-10c0-454e-a851-dd50d27381cd	role-teacher	ATT_REPORT	t	f	f	f	f	t	2026-10-20 00:14:13.075746+06	\N
a826c2cb-350d-4be2-b72a-4395888c23a5	role-teacher	REPORTS	t	f	f	f	f	t	2026-10-20 00:14:13.076403+06	\N
ad89eaa3-7db6-4e6c-98bd-271ad9dcdf4f	role-superadmin	SECURITY	t	t	t	t	t	t	2026-10-20 00:14:13.076574+06	\N
b3d68714-0893-438e-a287-04be597930a6	role-superadmin	ACADEMICS	t	t	t	t	t	t	2026-10-20 00:14:13.075296+06	\N
b6a7e242-aa31-459d-9762-9d1d8d61a5c0	role-superadmin	REP_ACADEMIC	t	t	t	t	t	t	2026-10-20 00:14:13.076461+06	\N
c1cade5c-c915-4694-be14-820f8d717430	role-superadmin	ATT_STUDENT	t	t	t	t	t	t	2026-10-20 00:14:13.075643+06	\N
cbbbdbad-f11c-4ad2-b481-06a5ff3b47b5	role-teacher	ACADEMICS	t	f	f	f	f	t	2026-10-20 00:14:13.075325+06	\N
cc767e30-f754-46fb-8b9f-79ed659f4903	role-superadmin	ACAD_CLASSES	t	t	t	t	t	t	2026-10-20 00:14:13.075524+06	\N
d401b0de-85f3-4d41-97bc-b484c59bcf4a	role-superadmin	EXAMS	t	t	t	t	t	t	2026-10-20 00:14:13.075809+06	\N
d45e8858-2aa0-4663-a2db-8f07e6b48d32	role-accountant	FIN_COLLECTION	t	t	t	f	t	t	2026-10-20 00:14:13.076347+06	\N
da527642-3125-417e-a6d1-c08e3c7aace2	role-teacher	EXAM_SETUP	t	f	f	f	f	t	2026-10-20 00:14:13.075954+06	\N
dba08e32-6404-408d-9db0-a1c908f37b00	role-teacher	ACAD_ROUTINE	t	f	f	f	f	t	2026-10-20 00:14:13.075449+06	\N
e1eaa031-2f90-405b-9741-70ae9510c5a9	role-teacher	STUDENTS	t	f	f	f	f	t	2026-10-20 00:14:13.075084+06	\N
e66aabdd-454b-4516-b4db-5f9ea7c7c811	role-superadmin	EXAM_SETUP	t	t	t	t	t	t	2026-10-20 00:14:13.075926+06	\N
ef29a54b-65b8-4e7a-89a2-41c735021d16	role-accountant	STUDENTS	t	f	f	f	f	t	2026-10-20 00:14:13.075115+06	\N
f3c4a90b-bcf6-4493-9633-357799dd0b0f	role-superadmin	FIN_FEES	t	t	t	t	t	t	2026-10-20 00:14:13.076231+06	\N
fe367a5e-4d3c-4004-980e-e9665459f80e	role-teacher	EXAM_RESULTS	t	f	f	f	f	t	2026-10-20 00:14:13.076074+06	\N
ffdd4bc9-b560-4a7a-8cc1-4e06b7cd9adc	role-superadmin	STU_LIST	t	t	t	t	t	t	2026-10-20 00:14:13.075146+06	\N
rmp-guard-dashboard	role-guardian	DASHBOARD	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-guard-students	role-guardian	STUDENTS	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-guard-stu_list	role-guardian	STU_LIST	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-guard-academics	role-guardian	ACADEMICS	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-guard-acad_routine	role-guardian	ACAD_ROUTINE	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-guard-acad_classes	role-guardian	ACAD_CLASSES	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-guard-attendance	role-guardian	ATTENDANCE	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-guard-att_student	role-guardian	ATT_STUDENT	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-guard-att_report	role-guardian	ATT_REPORT	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-guard-exams	role-guardian	EXAMS	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-guard-exam_results	role-guardian	EXAM_RESULTS	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-guard-finance	role-guardian	FINANCE	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-guard-fin_fees	role-guardian	FIN_FEES	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-guard-fin_collection	role-guardian	FIN_COLLECTION	t	t	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-stu-dashboard	role-student	DASHBOARD	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-stu-students	role-student	STUDENTS	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-stu-stu_list	role-student	STU_LIST	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-stu-academics	role-student	ACADEMICS	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-stu-acad_routine	role-student	ACAD_ROUTINE	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-stu-attendance	role-student	ATTENDANCE	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-stu-att_student	role-student	ATT_STUDENT	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-stu-att_report	role-student	ATT_REPORT	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-stu-exams	role-student	EXAMS	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-stu-exam_results	role-student	EXAM_RESULTS	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-stu-finance	role-student	FINANCE	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-stu-fin_fees	role-student	FIN_FEES	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
rmp-stu-fin_collection	role-student	FIN_COLLECTION	t	f	f	f	f	t	2026-10-20 01:17:32.930006+06	\N
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.roles ("Id", "SchoolId", "Code", "Name", "Description", "IsSystem", "IsActive", "CreatedAt", "UpdatedAt") FROM stdin;
role-accountant	sch-01	ACCOUNTANT	Accountant	Fee structures, invoicing, receipt collection, and ledger	t	t	2026-10-20 00:14:11.953304+06	\N
role-guardian	sch-01	GUARDIAN	Guardian	Parental portal for tracking student progress and tuition	t	t	2026-10-20 00:14:11.95329+06	\N
role-student	sch-01	STUDENT	Student	Self-service academic portal for timetable, marks, and invoices	t	t	2026-10-20 00:14:11.953289+06	\N
role-superadmin	sch-01	SUPER_ADMIN	Super Admin	Unrestricted administrative authority across all modules	t	t	2026-10-20 00:14:11.952344+06	\N
role-teacher	sch-01	TEACHER	Teacher	Academic operations, attendance roster, and exam marks	t	t	2026-10-20 00:14:11.953287+06	\N
\.


--
-- Data for Name: user_menu_permissions; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.user_menu_permissions ("Id", "UserId", "MenuCode", "Action", "Override", "GrantedBy", "CreatedAt", "UpdatedAt") FROM stdin;
13cbe9aa-edf8-46ec-8e5c-2357ee7bed4e	usr-student	ACAD_ROUTINE	view	1	admin	2026-10-20 00:14:13.07708+06	\N
7d89a307-3079-4b8f-a1aa-8c2709d6f424	usr-3d757131	FIN_COLLECTION	view	1	admin	2026-10-20 01:04:47.312998+06	\N
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.user_roles ("Id", "UserId", "RoleId", "SchoolId", "CreatedAt", "UpdatedAt") FROM stdin;
0beebcd1-7898-4374-b0d9-3d70d09904ee	usr-teacher	role-teacher	sch-01	2026-10-20 00:14:12.990343+06	\N
1001a75d-0860-4dfe-a229-1a22ad013096	usr-guardian	role-guardian	sch-01	2026-10-20 00:14:12.990702+06	\N
1fbd7517-84c9-407e-a93b-e6b9bf799690	usr-accountant	role-accountant	sch-01	2026-10-20 00:14:12.99079+06	\N
6f738d6f-acd6-4a9b-a80f-12b6db66d4df	usr-admin	role-superadmin	sch-01	2026-10-20 00:14:12.956414+06	\N
7f809a4a-46bc-46f4-9d42-5bc81051cda1	usr-student	role-student	sch-01	2026-10-20 00:14:12.990582+06	\N
5b236791-1fc2-4983-836d-bcc3c00a76df	usr-3d757131	role-teacher	sch-01	2026-10-20 01:01:23.7565+06	\N
67321035-ce9c-4671-8a48-f76aec339cf6	usr-2adf7f89	role-guardian	sch-01	2026-10-20 01:06:13.506637+06	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.users ("Id", "Username", "FullName", "Email", "PasswordHash", "RoleId", "RoleName", "SchoolId", "BranchId", "Avatar", "Phone", "IsActive", "CreatedAt", "UpdatedAt") FROM stdin;
usr-accountant	accountant	Kamal Hossain (Bursar)	accounts@scholarsacademy.edu.bd	$2a$11$F31WaLIt.FB0wjz6UAECNeEyw2oKCAmEhlGsqpkxmH9Tks7xVndmW	role-accountant	Accountant	sch-01	br-01	https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80	+880 1819-000005	t	2026-10-20 00:14:12.74423+06	\N
usr-admin	admin	System Administrator	admin@scholarsacademy.edu.bd	$2a$11$QQMMrMCfjyxUejCEcud1YeRJsZne3qUT2pPkT4rIipYSHNHgzyYxW	role-superadmin	Super Admin	sch-01	br-01	https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80	+880 1819-000001	t	2026-10-20 00:14:11.990965+06	\N
usr-guardian	guardian	Rafiqul Ahmed (Guardian)	rafiqul.ahmed@gmail.com	$2a$11$R8Ff6SwojESLPjn4FrxSKuvF6/9l3N/o4PG0ElskpP3Y2m1LTImyC	role-guardian	Guardian	sch-01	br-01	https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80	+880 1819-000004	t	2026-10-20 00:14:12.579962+06	\N
usr-student	student	Tanvir Ahmed	tanvir.ahmed@student.scholarsacademy.edu.bd	$2a$11$j0nusp/sWLGOpgl0ILbF7eZNPA4U5YhSY08t7ZoylkZRPsQG4tfHe	role-student	Student	sch-01	br-01	https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80	+880 1819-000003	t	2026-10-20 00:14:12.411233+06	\N
usr-teacher	teacher	Sarah Jenkins (Senior Faculty)	sarah.jenkins@scholarsacademy.edu.bd	$2a$11$zTfzHbkbM.DU3NI/dQywbeym31IZB1ToBgKwOow/4tOz0k42Ipyfa	role-teacher	Teacher	sch-01	br-01	https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80	+880 1819-000002	t	2026-10-20 00:14:12.245567+06	\N
usr-3d757131	librarian	Nasreen Sultana (Librarian)	nasreen@scholarsacademy.edu.bd	$2a$11$GgSnRILsIf5k2I6/kimShuHfisQYr9zZHUKTThrOhczwf4W8n6bhC	role-teacher	Teacher	sch-01	br-01	https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80	+880 1819-000009	f	2026-10-20 01:01:23.756449+06	2026-10-20 01:04:47.275238+06
usr-2adf7f89	mnnoor	Noor Nabi	mnnoor1984@gmail.com	$2a$11$G4Y6aMCqli7YYOgoW39bUO.y.fTN9u7fm.oFAZsN2bO9mcnPhC4K6	role-guardian	Guardian	sch-01	br-01	https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80	01717203651	t	2026-10-20 01:06:13.506636+06	\N
\.


--
-- Data for Name: teachers; Type: TABLE DATA; Schema: employee; Owner: postgres
--

COPY employee.teachers ("Id", "SchoolId", "EmployeeCode", "FullName", "Designation", "Department", "Qualification", "Email", "Phone", "JoiningDate", "Status", "Avatar", "AssignedSubjectsJson", "CreatedAt", "UpdatedAt") FROM stdin;
tch-001	sch-01	FAC-2022-045	Sarah Jenkins	Assistant Professor	Department of Physical Sciences	M.Sc in Applied Mathematics, University of Dhaka	sarah.jenkins@scholarsacademy.edu.bd	+880 1819-000002	2022-06-01 00:00:00+06	Active	https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80	{"subjects": ["Higher Mathematics", "Physics"]}	2026-10-20 00:18:31.201413+06	\N
tch-002	sch-01	FAC-2020-012	Dr. Kamal Uddin	Professor & Head	Department of Chemistry	Ph.D in Chemical Science, BUET	kamal.uddin@scholarsacademy.edu.bd	+880 1819-000010	2020-01-15 00:00:00+06	Active	https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80	{"subjects": ["Chemistry"]}	2026-10-20 00:18:31.201413+06	\N
tch-003	sch-01	FAC-2023-088	Farhana Haque	Lecturer	Department of English	M.A in English Literature, University of Rajshahi	farhana.haque@scholarsacademy.edu.bd	+880 1819-000011	2023-03-01 00:00:00+06	Active	https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80	{"subjects": ["English Literature"]}	2026-10-20 00:18:31.201413+06	\N
tch-004	sch-01	FAC-2021-034	Tariqul Islam	Senior Lecturer	Department of Computer Science	B.Sc in CSE, IUT	tariqul.islam@scholarsacademy.edu.bd	+880 1819-000012	2021-08-10 00:00:00+06	Active	https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80	{"subjects": ["Information Technology"]}	2026-10-20 00:18:31.201413+06	\N
tch-005	sch-01	FAC-2024-102	Mahfuza Khatun	Lecturer	Department of Biological Sciences	M.Sc in Zoology, University of Dhaka	mahfuza.khatun@scholarsacademy.edu.bd	+880 1819-000013	2024-02-01 00:00:00+06	Active	https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80	{"subjects": ["Biology"]}	2026-10-20 00:18:31.201413+06	\N
\.


--
-- Data for Name: exams; Type: TABLE DATA; Schema: exam; Owner: postgres
--

COPY exam.exams ("Id", "SchoolId", "AcademicYearId", "Name", "Term", "AcademicYear", "StartDate", "EndDate", "IsPublished", "CreatedAt", "UpdatedAt") FROM stdin;
ex-annual-2026	sch-01	ay-2026	Annual Examination 2026	Final Term	2026	2026-11-10 00:00:00+06	2026-11-28 00:00:00+06	t	2026-10-20 00:18:31.201413+06	\N
ex-midterm-2026	sch-01	ay-2026	Mid-Term Assessment 2026	Mid Term	2026	2026-06-15 00:00:00+06	2026-06-25 00:00:00+06	t	2026-10-20 00:18:31.201413+06	\N
\.


--
-- Data for Name: marks; Type: TABLE DATA; Schema: exam; Owner: postgres
--

COPY exam.marks ("Id", "SchoolId", "ExamId", "StudentId", "StudentName", "RollNo", "ClassId", "SectionId", "SubjectId", "SubjectName", "FullMarks", "ObtainedMarks", "Grade", "GradePoint", "IsPass", "CreatedAt", "UpdatedAt") FROM stdin;
mk-103	sch-01	ex-annual-2026	stu-001	Tanvir Ahmed	01	cls-10	sec-10a	sub-chem	Chemistry	100.00	88.00	A+	5.00	t	2026-10-20 00:18:31.201413+06	\N
mk-104	sch-01	ex-annual-2026	stu-001	Tanvir Ahmed	01	cls-10	sec-10a	sub-eng	English Literature	100.00	85.00	A+	5.00	t	2026-10-20 00:18:31.201413+06	\N
mk-105	sch-01	ex-annual-2026	stu-001	Tanvir Ahmed	01	cls-10	sec-10a	sub-ict	Information Technology	100.00	98.00	A+	5.00	t	2026-10-20 00:18:31.201413+06	\N
mk-203	sch-01	ex-annual-2026	stu-002	Nusrat Jahan	02	cls-10	sec-10a	sub-chem	Chemistry	100.00	94.00	A+	5.00	t	2026-10-20 00:18:31.201413+06	\N
mk-204	sch-01	ex-annual-2026	stu-002	Nusrat Jahan	02	cls-10	sec-10a	sub-eng	English Literature	100.00	90.00	A+	5.00	t	2026-10-20 00:18:31.201413+06	\N
mk-205	sch-01	ex-annual-2026	stu-002	Nusrat Jahan	02	cls-10	sec-10a	sub-ict	Information Technology	100.00	95.00	A+	5.00	t	2026-10-20 00:18:31.201413+06	\N
6cdb61ca-6750-4062-a070-da5d3bdcbbc0	sch-01	ex-annual-2026	stu-003	Fahim Shahriar	03	cls-10	sec-10a	sub-phys	Physics	100.00	49.00	C	2.00	t	2026-10-20 13:43:57.08081+06	2026-10-20 13:44:17.561731+06
mk-102	sch-01	ex-annual-2026	stu-001	Tanvir Ahmed	01	cls-10	sec-10a	sub-phys	Physics	100.00	77.00	A	4.00	t	2026-10-20 00:18:31.201413+06	2026-10-20 13:44:17.554613+06
mk-202	sch-01	ex-annual-2026	stu-002	Nusrat Jahan	02	cls-10	sec-10a	sub-phys	Physics	100.00	83.00	A+	5.00	t	2026-10-20 00:18:31.201413+06	2026-10-20 13:44:17.559017+06
mk-101	sch-01	ex-annual-2026	stu-001	Tanvir Ahmed	01	cls-10	sec-10a	sub-math	Higher Mathematics	100.00	77.00	A	4.00	t	2026-10-20 00:18:31.201413+06	2026-10-20 13:44:57.773929+06
mk-201	sch-01	ex-annual-2026	stu-002	Nusrat Jahan	02	cls-10	sec-10a	sub-math	Higher Mathematics	100.00	79.00	A	4.00	t	2026-10-20 00:18:31.201413+06	2026-10-20 13:44:57.784182+06
9107169c-ea26-445e-be82-3197d35d7edf	sch-01	ex-annual-2026	stu-003	Fahim Shahriar	03	cls-10	sec-10a	sub-math	Higher Mathematics	100.00	89.00	A+	5.00	t	2026-10-20 13:44:57.790362+06	\N
\.


--
-- Data for Name: fee_structures; Type: TABLE DATA; Schema: finance; Owner: postgres
--

COPY finance.fee_structures ("Id", "SchoolId", "AcademicYearId", "ClassId", "ClassName", "FeeTypeId", "FeeTypeName", "Amount", "DueDate", "CreatedAt", "UpdatedAt") FROM stdin;
fs-10-tuit	sch-01	ay-2026	cls-10	Class 10	ft-tuit	Monthly Tuition Fee	4500.00	2026-10-10 00:00:00+06	2026-10-20 00:18:31.201413+06	\N
fs-10-lab	sch-01	ay-2026	cls-10	Class 10	ft-lab	Science & ICT Lab Maintenance	1500.00	2026-10-15 00:00:00+06	2026-10-20 00:18:31.201413+06	\N
fs-09-tuit	sch-01	ay-2026	cls-09	Class 9	ft-tuit	Monthly Tuition Fee	4000.00	2026-10-10 00:00:00+06	2026-10-20 00:18:31.201413+06	\N
fs-11-tuit	sch-01	ay-2026	cls-11	Class 11	ft-tuit	Monthly Tuition Fee	5500.00	2026-10-10 00:00:00+06	2026-10-20 00:18:31.201413+06	\N
\.


--
-- Data for Name: fee_types; Type: TABLE DATA; Schema: finance; Owner: postgres
--

COPY finance.fee_types ("Id", "SchoolId", "Name", "Code", "Frequency", "Description", "CreatedAt", "UpdatedAt") FROM stdin;
ft-tuit	sch-01	Monthly Tuition Fee	FEETYPE-TUIT	Monthly	Regular academic monthly tuition	2026-10-20 00:18:31.201413+06	\N
ft-lab	sch-01	Science & ICT Lab Maintenance	FEETYPE-LAB	Term-Wise	Physics, Chemistry & Computer Lab Fee	2026-10-20 00:18:31.201413+06	\N
ft-adm	sch-01	Annual Admission & Session Fee	FEETYPE-ADM	Annual	Session registration fee	2026-10-20 00:18:31.201413+06	\N
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: finance; Owner: postgres
--

COPY finance.invoices ("Id", "SchoolId", "InvoiceNo", "StudentId", "StudentName", "RollNo", "ClassName", "SectionName", "FeeTypeId", "FeeTypeName", "TotalAmount", "DiscountAmount", "NetAmount", "PaidAmount", "DueAmount", "DueDate", "Status", "CreatedAt", "UpdatedAt") FROM stdin;
inv-2026-1001	sch-01	INV-2026-10089	stu-001	Tanvir Ahmed	01	Class 10	Padma (Section A)	ft-tuit	Monthly Tuition Fee	4500.00	0.00	4500.00	4500.00	0.00	2026-10-15 00:00:00+06	Paid	2026-10-20 00:18:31.201413+06	\N
inv-2026-1002	sch-01	INV-2026-10090	stu-002	Nusrat Jahan	02	Class 10	Padma (Section A)	ft-tuit	Monthly Tuition Fee	4500.00	0.00	4500.00	4500.00	0.00	2026-10-15 00:00:00+06	Paid	2026-10-20 00:18:31.201413+06	\N
inv-2026-1003	sch-01	INV-2026-10091	stu-003	Fahim Shahriar	03	Class 10	Padma (Section A)	ft-tuit	Monthly Tuition Fee	4500.00	500.00	4000.00	2000.00	2000.00	2026-10-15 00:00:00+06	Partial	2026-10-20 00:18:31.201413+06	\N
inv-2026-1004	sch-01	INV-2026-10092	stu-004	Mehedi Hasan	01	Class 10	Meghna (Section B)	ft-tuit	Monthly Tuition Fee	4500.00	0.00	4500.00	0.00	4500.00	2026-10-15 00:00:00+06	Unpaid	2026-10-20 00:18:31.201413+06	\N
inv-2026-1005	sch-01	INV-2026-10093	stu-005	Samia Akter	02	Class 10	Meghna (Section B)	ft-tuit	Monthly Tuition Fee	4500.00	0.00	4500.00	4500.00	0.00	2026-10-15 00:00:00+06	Paid	2026-10-20 00:18:31.201413+06	\N
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: finance; Owner: postgres
--

COPY finance.payments ("Id", "SchoolId", "ReceiptNo", "InvoiceId", "StudentId", "StudentName", "RollNo", "ClassName", "AmountPaid", "PaymentMethod", "TransactionRef", "PaymentDate", "CollectedBy", "Notes", "CreatedAt", "UpdatedAt") FROM stdin;
pmt-001	sch-01	RCPT-2026-0941	inv-2026-1001	stu-001	Tanvir Ahmed	01	Class 10	4500.00	bKash	TRX-9BK874108	2026-10-17 00:18:31.201413+06	Online Gateway (bKash Auto-settle)	October Tuition settled via bKash	2026-10-20 00:18:31.201413+06	\N
pmt-002	sch-01	RCPT-2026-0942	inv-2026-1002	stu-002	Nusrat Jahan	02	Class 10	4500.00	Bank Transfer	IBBL-TRX-44120	2026-10-18 00:18:31.201413+06	Accounts Counter	Paid via Islami Bank Transfer	2026-10-20 00:18:31.201413+06	\N
pmt-003	sch-01	RCPT-2026-0943	inv-2026-1003	stu-003	Fahim Shahriar	03	Class 10	2000.00	Cash	CASH-REC-102	2026-10-19 00:18:31.201413+06	Kamal Hossain (Bursar)	Partial instalment accepted	2026-10-20 00:18:31.201413+06	\N
pmt-004	sch-01	RCPT-2026-0944	inv-2026-1005	stu-005	Samia Akter	02	Class 10	4500.00	Nagad	NGD-991244	2026-10-19 00:18:31.201413+06	Online Gateway (Nagad)	October Tuition settled via Nagad	2026-10-20 00:18:31.201413+06	\N
\.


--
-- Data for Name: __EFMigrationsHistory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."__EFMigrationsHistory" ("MigrationId", "ProductVersion") FROM stdin;
20261019181224_InitialCreate	8.0.11
\.


--
-- Data for Name: academic_years; Type: TABLE DATA; Schema: school; Owner: postgres
--

COPY school.academic_years ("Id", "SchoolId", "Name", "StartDate", "EndDate", "IsCurrent", "IsLocked", "CreatedAt", "UpdatedAt") FROM stdin;
ay-0ff3b8	sch-01	2027 - 2028 Academic Session	2027-01-01 06:00:00+06	2027-12-31 06:00:00+06	t	f	2026-10-20 00:53:02.790582+06	2026-10-20 00:57:53.342946+06
ay-2026	sch-01	2026-2027	2026-01-01 00:00:00+06	2026-12-31 00:00:00+06	f	t	2026-10-20 00:18:31.201413+06	2026-10-20 00:57:58.772984+06
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: school; Owner: postgres
--

COPY school.branches ("Id", "SchoolId", "Code", "Name", "Address", "Phone", "IsActive", "CreatedAt", "UpdatedAt") FROM stdin;
br-01	sch-01	BR-01	Main Campus	Plot 14, Road 2, Block-E, Dhaka	+880 1711-000000	t	2026-10-20 00:18:31.201413+06	\N
br-8996de	sch-01	BR-02	Uttara Campus	Sector 4, Uttara, Dhaka	+880 1711-000002	t	2026-10-20 00:50:23.540368+06	\N
br-6fd98e	sch-01	BR-03	Rayerbag	Rayerbag Dhaka	0172156321	t	2026-10-20 00:56:06.255669+06	\N
\.


--
-- Data for Name: schools; Type: TABLE DATA; Schema: school; Owner: postgres
--

COPY school.schools ("Id", "Name", "Code", "Address", "Contact", "Email", "Logo", "Website", "Status", "Timezone", "CreatedAt", "UpdatedAt") FROM stdin;
sch-01	Scholars International Academy (Central Campus)	DMSC-101	Plot 14, Road 2, Block-E, Dhaka 1212	+880 1711-000000	info@scholarsacademy.edu.bd	assets/images/logo.png	https://scholarsacademy.edu.bd	Active	Asia/Dhaka	2026-10-20 00:18:31.201413+06	2026-10-20 00:57:23.887681+06
\.


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: student; Owner: postgres
--

COPY student.enrollments ("Id", "SchoolId", "StudentId", "AcademicYearId", "ClassId", "SectionId", "RollNo", "EnrollmentDate", "Status", "CreatedAt", "UpdatedAt") FROM stdin;
enr-001	sch-01	stu-001	ay-2026	cls-10	sec-10a	01	2026-01-05 00:00:00+06	Active	2026-10-20 00:18:31.201413+06	\N
enr-002	sch-01	stu-002	ay-2026	cls-10	sec-10a	02	2026-01-05 00:00:00+06	Active	2026-10-20 00:18:31.201413+06	\N
enr-003	sch-01	stu-003	ay-2026	cls-10	sec-10a	03	2026-01-05 00:00:00+06	Active	2026-10-20 00:18:31.201413+06	\N
enr-004	sch-01	stu-004	ay-2026	cls-10	sec-10b	01	2026-01-06 00:00:00+06	Active	2026-10-20 00:18:31.201413+06	\N
enr-005	sch-01	stu-005	ay-2026	cls-10	sec-10b	02	2026-01-06 00:00:00+06	Active	2026-10-20 00:18:31.201413+06	\N
enr-006	sch-01	stu-006	ay-2026	cls-09	sec-09a	01	2026-01-07 00:00:00+06	Active	2026-10-20 00:18:31.201413+06	\N
enr-007	sch-01	stu-007	ay-2026	cls-09	sec-09b	01	2026-01-07 00:00:00+06	Active	2026-10-20 00:18:31.201413+06	\N
enr-008	sch-01	stu-008	ay-2026	cls-11	sec-11a	01	2026-01-08 00:00:00+06	Active	2026-10-20 00:18:31.201413+06	\N
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: student; Owner: postgres
--

COPY student.students ("Id", "SchoolId", "AdmissionNo", "FullName", "BanglaName", "DateOfBirth", "Gender", "BloodGroup", "Religion", "Email", "Phone", "PresentAddress", "PermanentAddress", "PhotoUrl", "GuardianName", "GuardianRelation", "GuardianPhone", "GuardianOccupation", "GuardianIncome", "AcademicYearId", "ClassId", "ClassName", "SectionId", "SectionName", "RollNo", "AdmissionDate", "Status", "CreatedAt", "UpdatedAt") FROM stdin;
stu-001	sch-01	ADM-2026-0089	Tanvir Ahmed	?????? ?????	2010-04-15 00:00:00+06	Male	O+	Islam	tanvir.ahmed@student.scholarsacademy.edu.bd	+880 1711-234567	Flat 4B, Concord Tower, Gulshan-2, Dhaka	Vill: Sreepur, Upazila: Boalmari, Faridpur	https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80	Rafiqul Ahmed	Father	+880 1819-000004	Senior Software Architect	250,000 BDT/Month	ay-2026	cls-10	Class 10	sec-10a	Padma (Section A)	01	2026-01-05 00:00:00+06	Active	2026-10-20 00:18:31.201413+06	\N
stu-002	sch-01	ADM-2026-0090	Nusrat Jahan	?????? ?????	2010-08-22 00:00:00+06	Female	A+	Islam	nusrat.jahan@student.scholarsacademy.edu.bd	+880 1711-234568	House 12, Road 4, Dhanmondi, Dhaka	Kotwali, Barishal	https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80	Jalal Uddin	Father	+880 1819-000021	Government Officer	120,000 BDT/Month	ay-2026	cls-10	Class 10	sec-10a	Padma (Section A)	02	2026-01-05 00:00:00+06	Active	2026-10-20 00:18:31.201413+06	\N
stu-003	sch-01	ADM-2026-0091	Fahim Shahriar	????? ?????????	2010-01-11 00:00:00+06	Male	B+	Islam	fahim.shahriar@student.scholarsacademy.edu.bd	+880 1711-234569	Sector 7, Uttara, Dhaka	Mirzapur, Tangail	https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80	Shahriar Kabir	Father	+880 1819-000022	Businessman	180,000 BDT/Month	ay-2026	cls-10	Class 10	sec-10a	Padma (Section A)	03	2026-01-05 00:00:00+06	Active	2026-10-20 00:18:31.201413+06	\N
stu-004	sch-01	ADM-2026-0092	Mehedi Hasan	?????? ?????	2010-06-19 00:00:00+06	Male	AB+	Islam	mehedi.hasan@student.scholarsacademy.edu.bd	+880 1711-234570	Mirpur 10, Dhaka	Bhairab, Kishoreganj	https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80	Anwar Hossain	Father	+880 1819-000023	Banker	140,000 BDT/Month	ay-2026	cls-10	Class 10	sec-10b	Meghna (Section B)	01	2026-01-06 00:00:00+06	Active	2026-10-20 00:18:31.201413+06	\N
stu-005	sch-01	ADM-2026-0093	Samia Akter	??????? ??????	2010-11-04 00:00:00+06	Female	O+	Islam	samia.akter@student.scholarsacademy.edu.bd	+880 1711-234571	Banani DOHS, Dhaka	Feni Sadar, Feni	https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80	Abdul Mannan	Father	+880 1819-000024	Engineer	200,000 BDT/Month	ay-2026	cls-10	Class 10	sec-10b	Meghna (Section B)	02	2026-01-06 00:00:00+06	Active	2026-10-20 00:18:31.201413+06	\N
stu-006	sch-01	ADM-2026-0094	Raihan Kabir	??????? ????	2011-03-14 00:00:00+06	Male	A+	Islam	raihan.kabir@student.scholarsacademy.edu.bd	+880 1711-234572	Mohakhali Wireless, Dhaka	Sadar, Mymensingh	https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80	Kabir Ahmed	Father	+880 1819-000025	Doctor	220,000 BDT/Month	ay-2026	cls-09	Class 9	sec-09a	Lotus (Section A)	01	2026-01-07 00:00:00+06	Active	2026-10-20 00:18:31.201413+06	\N
stu-007	sch-01	ADM-2026-0095	Anika Tabassum	????? ????????	2011-09-08 00:00:00+06	Female	B+	Islam	anika.tabassum@student.scholarsacademy.edu.bd	+880 1711-234573	Bashundhara R/A, Block C, Dhaka	Sylhet Sadar	https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80	Farukuzzaman	Father	+880 1819-000026	Professor	160,000 BDT/Month	ay-2026	cls-09	Class 9	sec-09b	Tulip (Section B)	01	2026-01-07 00:00:00+06	Active	2026-10-20 00:18:31.201413+06	\N
stu-008	sch-01	ADM-2026-0096	Zubair Mahmud	???????? ??????	2009-02-18 00:00:00+06	Male	O-	Islam	zubair.mahmud@student.scholarsacademy.edu.bd	+880 1711-234574	Lalmatia, Block E, Dhaka	Comilla Sadar	https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80	Mahmudul Hasan	Father	+880 1819-000027	Advocate, Supreme Court	210,000 BDT/Month	ay-2026	cls-11	Class 11	sec-11a	Science Section A	01	2026-01-08 00:00:00+06	Active	2026-10-20 00:18:31.201413+06	\N
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: system; Owner: postgres
--

COPY system.audit_logs ("Id", "SchoolId", "Timestamp", "UserName", "UserRole", "Action", "Module", "TargetRecord", "Details", "SchoolScope", "CreatedAt", "UpdatedAt") FROM stdin;
aud-001	sch-01	2026-10-15 00:18:31.201413+06	admin	Super Admin	Create	SYSTEM_INITIALIZE	Initial Seed Catalog	Standard production schemas, roles, dynamic menus, and master catalogs provisioned.	Main Campus	2026-10-20 00:18:31.201413+06	\N
aud-002	sch-01	2026-10-16 00:18:31.201413+06	teacher	Teacher	Create	EXAM_MARKS	Annual Examination Marks	Final term marks submitted for Class 10 Higher Math & Physics.	Main Campus	2026-10-20 00:18:31.201413+06	\N
aud-003	sch-01	2026-10-17 00:18:31.201413+06	accountant	Accountant	Create	FEE_COLLECTION	Invoice INV-2026-10089	Collected 4,500 BDT via bKash gateway. Receipt RCPT-2026-0941 generated.	Main Campus	2026-10-20 00:18:31.201413+06	\N
aud-004	sch-01	2026-10-18 00:18:31.201413+06	admin	Super Admin	Update	USER_PERMISSION	User Override: Tanvir Ahmed	Explicit ALLOW grant added for menu ACAD_ROUTINE.	Main Campus	2026-10-20 00:18:31.201413+06	\N
aud-005	sch-01	2026-10-19 00:18:31.201413+06	accountant	Accountant	Create	FEE_COLLECTION	Invoice INV-2026-10091	Collected partial payment 2,000 BDT in cash.	Main Campus	2026-10-20 00:18:31.201413+06	\N
\.


--
-- Data for Name: notices; Type: TABLE DATA; Schema: system; Owner: postgres
--

COPY system.notices ("Id", "SchoolId", "Title", "Category", "TargetAudience", "PublishedDate", "Content", "IsImportant", "Author", "CreatedAt", "UpdatedAt") FROM stdin;
not-001	sch-001	Annual Sports Day 2026 Announcement	Events	All	2026-10-18 00:29:39.384756+06	The Annual Inter-House Athletics and Sports Meet will take place on Saturday at the main sports complex. All students must wear their respective house uniforms.	t	Dr. Kamal Uddin	2026-10-20 00:29:39.384756+06	\N
not-002	sch-001	First Term Examination Schedule Published	Academic	Students, Guardians	2026-10-16 00:29:39.384756+06	The official examination routine for First Term 2026 has been published. Admit cards will be distributed from the class teachers.	t	Sarah Jenkins	2026-10-20 00:29:39.384756+06	\N
not-003	sch-001	Parent-Teacher Conference (PTC) Notice	General	Guardians	2026-10-13 00:29:39.384756+06	Parent-Teacher conference for Classes 9 and 10 will be conducted next Friday from 9:00 AM to 1:00 PM to review academic progress.	f	Farhana Haque	2026-10-20 00:29:39.384756+06	\N
not-004	sch-001	Science Fair & Robotics Exhibition Registrations Open	Events	Students	2026-10-10 00:29:39.384756+06	Students interested in showcasing projects in the National Science Fair 2026 are invited to submit their project proposals by next Wednesday.	f	Tariqul Islam	2026-10-20 00:29:39.384756+06	\N
not-005	sch-001	Monthly Tuition Fee Submission Reminder	Finance	Guardians	2026-10-08 00:29:39.384756+06	Dear guardians, please clear your pending tuition fee invoices for the current term to avoid late submission penalties.	t	Accounts Section	2026-10-20 00:29:39.384756+06	\N
\.


--
-- Name: class_routines PK_class_routines; Type: CONSTRAINT; Schema: academic; Owner: postgres
--

ALTER TABLE ONLY academic.class_routines
    ADD CONSTRAINT "PK_class_routines" PRIMARY KEY ("Id");


--
-- Name: class_subjects PK_class_subjects; Type: CONSTRAINT; Schema: academic; Owner: postgres
--

ALTER TABLE ONLY academic.class_subjects
    ADD CONSTRAINT "PK_class_subjects" PRIMARY KEY ("Id");


--
-- Name: classes PK_classes; Type: CONSTRAINT; Schema: academic; Owner: postgres
--

ALTER TABLE ONLY academic.classes
    ADD CONSTRAINT "PK_classes" PRIMARY KEY ("Id");


--
-- Name: sections PK_sections; Type: CONSTRAINT; Schema: academic; Owner: postgres
--

ALTER TABLE ONLY academic.sections
    ADD CONSTRAINT "PK_sections" PRIMARY KEY ("Id");


--
-- Name: subjects PK_subjects; Type: CONSTRAINT; Schema: academic; Owner: postgres
--

ALTER TABLE ONLY academic.subjects
    ADD CONSTRAINT "PK_subjects" PRIMARY KEY ("Id");


--
-- Name: attendance_correction_logs PK_attendance_correction_logs; Type: CONSTRAINT; Schema: attendance; Owner: postgres
--

ALTER TABLE ONLY attendance.attendance_correction_logs
    ADD CONSTRAINT "PK_attendance_correction_logs" PRIMARY KEY ("Id");


--
-- Name: student_attendance PK_student_attendance; Type: CONSTRAINT; Schema: attendance; Owner: postgres
--

ALTER TABLE ONLY attendance.student_attendance
    ADD CONSTRAINT "PK_student_attendance" PRIMARY KEY ("Id");


--
-- Name: menus AK_menus_Code; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.menus
    ADD CONSTRAINT "AK_menus_Code" UNIQUE ("Code");


--
-- Name: menus PK_menus; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.menus
    ADD CONSTRAINT "PK_menus" PRIMARY KEY ("Id");


--
-- Name: permissions PK_permissions; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.permissions
    ADD CONSTRAINT "PK_permissions" PRIMARY KEY ("Id");


--
-- Name: refresh_tokens PK_refresh_tokens; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("Id");


--
-- Name: role_menu_permissions PK_role_menu_permissions; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.role_menu_permissions
    ADD CONSTRAINT "PK_role_menu_permissions" PRIMARY KEY ("Id");


--
-- Name: roles PK_roles; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.roles
    ADD CONSTRAINT "PK_roles" PRIMARY KEY ("Id");


--
-- Name: user_menu_permissions PK_user_menu_permissions; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.user_menu_permissions
    ADD CONSTRAINT "PK_user_menu_permissions" PRIMARY KEY ("Id");


--
-- Name: user_roles PK_user_roles; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.user_roles
    ADD CONSTRAINT "PK_user_roles" PRIMARY KEY ("Id");


--
-- Name: users PK_users; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT "PK_users" PRIMARY KEY ("Id");


--
-- Name: teachers PK_teachers; Type: CONSTRAINT; Schema: employee; Owner: postgres
--

ALTER TABLE ONLY employee.teachers
    ADD CONSTRAINT "PK_teachers" PRIMARY KEY ("Id");


--
-- Name: exams PK_exams; Type: CONSTRAINT; Schema: exam; Owner: postgres
--

ALTER TABLE ONLY exam.exams
    ADD CONSTRAINT "PK_exams" PRIMARY KEY ("Id");


--
-- Name: marks PK_marks; Type: CONSTRAINT; Schema: exam; Owner: postgres
--

ALTER TABLE ONLY exam.marks
    ADD CONSTRAINT "PK_marks" PRIMARY KEY ("Id");


--
-- Name: fee_structures PK_fee_structures; Type: CONSTRAINT; Schema: finance; Owner: postgres
--

ALTER TABLE ONLY finance.fee_structures
    ADD CONSTRAINT "PK_fee_structures" PRIMARY KEY ("Id");


--
-- Name: fee_types PK_fee_types; Type: CONSTRAINT; Schema: finance; Owner: postgres
--

ALTER TABLE ONLY finance.fee_types
    ADD CONSTRAINT "PK_fee_types" PRIMARY KEY ("Id");


--
-- Name: invoices PK_invoices; Type: CONSTRAINT; Schema: finance; Owner: postgres
--

ALTER TABLE ONLY finance.invoices
    ADD CONSTRAINT "PK_invoices" PRIMARY KEY ("Id");


--
-- Name: payments PK_payments; Type: CONSTRAINT; Schema: finance; Owner: postgres
--

ALTER TABLE ONLY finance.payments
    ADD CONSTRAINT "PK_payments" PRIMARY KEY ("Id");


--
-- Name: __EFMigrationsHistory PK___EFMigrationsHistory; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."__EFMigrationsHistory"
    ADD CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId");


--
-- Name: academic_years PK_academic_years; Type: CONSTRAINT; Schema: school; Owner: postgres
--

ALTER TABLE ONLY school.academic_years
    ADD CONSTRAINT "PK_academic_years" PRIMARY KEY ("Id");


--
-- Name: branches PK_branches; Type: CONSTRAINT; Schema: school; Owner: postgres
--

ALTER TABLE ONLY school.branches
    ADD CONSTRAINT "PK_branches" PRIMARY KEY ("Id");


--
-- Name: schools PK_schools; Type: CONSTRAINT; Schema: school; Owner: postgres
--

ALTER TABLE ONLY school.schools
    ADD CONSTRAINT "PK_schools" PRIMARY KEY ("Id");


--
-- Name: enrollments PK_enrollments; Type: CONSTRAINT; Schema: student; Owner: postgres
--

ALTER TABLE ONLY student.enrollments
    ADD CONSTRAINT "PK_enrollments" PRIMARY KEY ("Id");


--
-- Name: students PK_students; Type: CONSTRAINT; Schema: student; Owner: postgres
--

ALTER TABLE ONLY student.students
    ADD CONSTRAINT "PK_students" PRIMARY KEY ("Id");


--
-- Name: audit_logs PK_audit_logs; Type: CONSTRAINT; Schema: system; Owner: postgres
--

ALTER TABLE ONLY system.audit_logs
    ADD CONSTRAINT "PK_audit_logs" PRIMARY KEY ("Id");


--
-- Name: notices PK_notices; Type: CONSTRAINT; Schema: system; Owner: postgres
--

ALTER TABLE ONLY system.notices
    ADD CONSTRAINT "PK_notices" PRIMARY KEY ("Id");


--
-- Name: IX_classes_SchoolId_Code; Type: INDEX; Schema: academic; Owner: postgres
--

CREATE UNIQUE INDEX "IX_classes_SchoolId_Code" ON academic.classes USING btree ("SchoolId", "Code");


--
-- Name: IX_sections_ClassId; Type: INDEX; Schema: academic; Owner: postgres
--

CREATE INDEX "IX_sections_ClassId" ON academic.sections USING btree ("ClassId");


--
-- Name: IX_student_attendance_SchoolId_StudentId_AttendanceDate; Type: INDEX; Schema: attendance; Owner: postgres
--

CREATE UNIQUE INDEX "IX_student_attendance_SchoolId_StudentId_AttendanceDate" ON attendance.student_attendance USING btree ("SchoolId", "StudentId", "AttendanceDate");


--
-- Name: IX_menus_Code; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "IX_menus_Code" ON auth.menus USING btree ("Code");


--
-- Name: IX_menus_ParentCode; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "IX_menus_ParentCode" ON auth.menus USING btree ("ParentCode");


--
-- Name: IX_permissions_Code; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "IX_permissions_Code" ON auth.permissions USING btree ("Code");


--
-- Name: IX_refresh_tokens_Token; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "IX_refresh_tokens_Token" ON auth.refresh_tokens USING btree ("Token");


--
-- Name: IX_refresh_tokens_UserId; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "IX_refresh_tokens_UserId" ON auth.refresh_tokens USING btree ("UserId");


--
-- Name: IX_role_menu_permissions_RoleId_MenuCode; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "IX_role_menu_permissions_RoleId_MenuCode" ON auth.role_menu_permissions USING btree ("RoleId", "MenuCode");


--
-- Name: IX_roles_SchoolId_Code; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "IX_roles_SchoolId_Code" ON auth.roles USING btree ("SchoolId", "Code");


--
-- Name: IX_user_menu_permissions_UserId_MenuCode_Action; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "IX_user_menu_permissions_UserId_MenuCode_Action" ON auth.user_menu_permissions USING btree ("UserId", "MenuCode", "Action");


--
-- Name: IX_user_roles_RoleId; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "IX_user_roles_RoleId" ON auth.user_roles USING btree ("RoleId");


--
-- Name: IX_user_roles_UserId; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "IX_user_roles_UserId" ON auth.user_roles USING btree ("UserId");


--
-- Name: IX_users_Email; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "IX_users_Email" ON auth.users USING btree ("Email");


--
-- Name: IX_users_Username; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "IX_users_Username" ON auth.users USING btree ("Username");


--
-- Name: IX_teachers_SchoolId_EmployeeCode; Type: INDEX; Schema: employee; Owner: postgres
--

CREATE UNIQUE INDEX "IX_teachers_SchoolId_EmployeeCode" ON employee.teachers USING btree ("SchoolId", "EmployeeCode");


--
-- Name: IX_marks_ExamId; Type: INDEX; Schema: exam; Owner: postgres
--

CREATE INDEX "IX_marks_ExamId" ON exam.marks USING btree ("ExamId");


--
-- Name: IX_invoices_InvoiceNo; Type: INDEX; Schema: finance; Owner: postgres
--

CREATE UNIQUE INDEX "IX_invoices_InvoiceNo" ON finance.invoices USING btree ("InvoiceNo");


--
-- Name: IX_payments_InvoiceId; Type: INDEX; Schema: finance; Owner: postgres
--

CREATE INDEX "IX_payments_InvoiceId" ON finance.payments USING btree ("InvoiceId");


--
-- Name: IX_payments_ReceiptNo; Type: INDEX; Schema: finance; Owner: postgres
--

CREATE UNIQUE INDEX "IX_payments_ReceiptNo" ON finance.payments USING btree ("ReceiptNo");


--
-- Name: IX_academic_years_SchoolId_Name; Type: INDEX; Schema: school; Owner: postgres
--

CREATE UNIQUE INDEX "IX_academic_years_SchoolId_Name" ON school.academic_years USING btree ("SchoolId", "Name");


--
-- Name: IX_branches_SchoolId_Code; Type: INDEX; Schema: school; Owner: postgres
--

CREATE UNIQUE INDEX "IX_branches_SchoolId_Code" ON school.branches USING btree ("SchoolId", "Code");


--
-- Name: IX_schools_Code; Type: INDEX; Schema: school; Owner: postgres
--

CREATE UNIQUE INDEX "IX_schools_Code" ON school.schools USING btree ("Code");


--
-- Name: IX_enrollments_SchoolId_AcademicYearId_SectionId_RollNo; Type: INDEX; Schema: student; Owner: postgres
--

CREATE INDEX "IX_enrollments_SchoolId_AcademicYearId_SectionId_RollNo" ON student.enrollments USING btree ("SchoolId", "AcademicYearId", "SectionId", "RollNo");


--
-- Name: IX_enrollments_StudentId; Type: INDEX; Schema: student; Owner: postgres
--

CREATE INDEX "IX_enrollments_StudentId" ON student.enrollments USING btree ("StudentId");


--
-- Name: IX_students_SchoolId_AdmissionNo; Type: INDEX; Schema: student; Owner: postgres
--

CREATE UNIQUE INDEX "IX_students_SchoolId_AdmissionNo" ON student.students USING btree ("SchoolId", "AdmissionNo");


--
-- Name: sections FK_sections_classes_ClassId; Type: FK CONSTRAINT; Schema: academic; Owner: postgres
--

ALTER TABLE ONLY academic.sections
    ADD CONSTRAINT "FK_sections_classes_ClassId" FOREIGN KEY ("ClassId") REFERENCES academic.classes("Id") ON DELETE CASCADE;


--
-- Name: menus FK_menus_menus_ParentCode; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.menus
    ADD CONSTRAINT "FK_menus_menus_ParentCode" FOREIGN KEY ("ParentCode") REFERENCES auth.menus("Code") ON DELETE RESTRICT;


--
-- Name: refresh_tokens FK_refresh_tokens_users_UserId; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT "FK_refresh_tokens_users_UserId" FOREIGN KEY ("UserId") REFERENCES auth.users("Id") ON DELETE CASCADE;


--
-- Name: role_menu_permissions FK_role_menu_permissions_roles_RoleId; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.role_menu_permissions
    ADD CONSTRAINT "FK_role_menu_permissions_roles_RoleId" FOREIGN KEY ("RoleId") REFERENCES auth.roles("Id") ON DELETE CASCADE;


--
-- Name: user_menu_permissions FK_user_menu_permissions_users_UserId; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.user_menu_permissions
    ADD CONSTRAINT "FK_user_menu_permissions_users_UserId" FOREIGN KEY ("UserId") REFERENCES auth.users("Id") ON DELETE CASCADE;


--
-- Name: user_roles FK_user_roles_roles_RoleId; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.user_roles
    ADD CONSTRAINT "FK_user_roles_roles_RoleId" FOREIGN KEY ("RoleId") REFERENCES auth.roles("Id") ON DELETE CASCADE;


--
-- Name: user_roles FK_user_roles_users_UserId; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.user_roles
    ADD CONSTRAINT "FK_user_roles_users_UserId" FOREIGN KEY ("UserId") REFERENCES auth.users("Id") ON DELETE CASCADE;


--
-- Name: marks FK_marks_exams_ExamId; Type: FK CONSTRAINT; Schema: exam; Owner: postgres
--

ALTER TABLE ONLY exam.marks
    ADD CONSTRAINT "FK_marks_exams_ExamId" FOREIGN KEY ("ExamId") REFERENCES exam.exams("Id") ON DELETE CASCADE;


--
-- Name: payments FK_payments_invoices_InvoiceId; Type: FK CONSTRAINT; Schema: finance; Owner: postgres
--

ALTER TABLE ONLY finance.payments
    ADD CONSTRAINT "FK_payments_invoices_InvoiceId" FOREIGN KEY ("InvoiceId") REFERENCES finance.invoices("Id") ON DELETE CASCADE;


--
-- Name: enrollments FK_enrollments_students_StudentId; Type: FK CONSTRAINT; Schema: student; Owner: postgres
--

ALTER TABLE ONLY student.enrollments
    ADD CONSTRAINT "FK_enrollments_students_StudentId" FOREIGN KEY ("StudentId") REFERENCES student.students("Id") ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict OZAeoemb5XPlSIFN2uE7nFnZJUvIAd15uOal5t4V6VW03IDd8x5J2pvakr748KU

