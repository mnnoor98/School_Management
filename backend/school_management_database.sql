--
-- PostgreSQL database dump
--

\restrict VplRTWXCKeRxuLxIKiZih3Z38uBkbot7Tzd7bdcknjNfNeTvmrIXNbbdedZZ6sJ

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
rt-1	sch-01	Sunday	1	08:30 AM	09:20 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-math	Higher Mathematics	usr-teacher	Sarah Jenkins	Science Lab 3	2026-10-20 00:14:13.17202+06	\N
rt-10	sch-01	Wednesday	1	08:30 AM	09:20 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-math	Higher Mathematics	usr-teacher	Sarah Jenkins	Science Lab 3	2026-10-20 00:14:13.211202+06	\N
rt-11	sch-01	Wednesday	2	09:25 AM	10:15 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-phys	Physics	usr-teacher	Sarah Jenkins	Room 204	2026-10-20 00:14:13.211218+06	\N
rt-12	sch-01	Wednesday	3	10:35 AM	11:25 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-chem	Chemistry	usr-teacher	Sarah Jenkins	Chem Lab 1	2026-10-20 00:14:13.211234+06	\N
rt-13	sch-01	Thursday	1	08:30 AM	09:20 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-math	Higher Mathematics	usr-teacher	Sarah Jenkins	Science Lab 3	2026-10-20 00:14:13.21125+06	\N
rt-14	sch-01	Thursday	2	09:25 AM	10:15 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-phys	Physics	usr-teacher	Sarah Jenkins	Room 204	2026-10-20 00:14:13.211266+06	\N
rt-15	sch-01	Thursday	3	10:35 AM	11:25 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-chem	Chemistry	usr-teacher	Sarah Jenkins	Chem Lab 1	2026-10-20 00:14:13.211292+06	\N
rt-2	sch-01	Sunday	2	09:25 AM	10:15 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-phys	Physics	usr-teacher	Sarah Jenkins	Room 204	2026-10-20 00:14:13.210936+06	\N
rt-3	sch-01	Sunday	3	10:35 AM	11:25 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-chem	Chemistry	usr-teacher	Sarah Jenkins	Chem Lab 1	2026-10-20 00:14:13.211044+06	\N
rt-4	sch-01	Monday	1	08:30 AM	09:20 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-math	Higher Mathematics	usr-teacher	Sarah Jenkins	Science Lab 3	2026-10-20 00:14:13.211074+06	\N
rt-5	sch-01	Monday	2	09:25 AM	10:15 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-phys	Physics	usr-teacher	Sarah Jenkins	Room 204	2026-10-20 00:14:13.211094+06	\N
rt-6	sch-01	Monday	3	10:35 AM	11:25 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-chem	Chemistry	usr-teacher	Sarah Jenkins	Chem Lab 1	2026-10-20 00:14:13.211112+06	\N
rt-7	sch-01	Tuesday	1	08:30 AM	09:20 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-math	Higher Mathematics	usr-teacher	Sarah Jenkins	Science Lab 3	2026-10-20 00:14:13.211128+06	\N
rt-8	sch-01	Tuesday	2	09:25 AM	10:15 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-phys	Physics	usr-teacher	Sarah Jenkins	Room 204	2026-10-20 00:14:13.211165+06	\N
rt-9	sch-01	Tuesday	3	10:35 AM	11:25 AM	cls-10	Class 10	sec-10a	Padma (Section A)	sub-chem	Chemistry	usr-teacher	Sarah Jenkins	Chem Lab 1	2026-10-20 00:14:13.211185+06	\N
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
cls-09	sch-01	Class 9	CLS-09	1	2026-10-20 00:14:13.096843+06	\N
cls-10	sch-01	Class 10	CLS-10	2	2026-10-20 00:14:13.096955+06	\N
cls-11	sch-01	Class 11	CLS-11	3	2026-10-20 00:14:13.096955+06	\N
cls-12	sch-01	Class 12	CLS-12	4	2026-10-20 00:14:13.096955+06	\N
\.


--
-- Data for Name: sections; Type: TABLE DATA; Schema: academic; Owner: postgres
--

COPY academic.sections ("Id", "SchoolId", "ClassId", "ClassName", "Name", "Capacity", "ClassTeacherId", "ClassTeacherName", "CreatedAt", "UpdatedAt") FROM stdin;
sec-09a	sch-01	cls-09	Class 9	Lotus (Section A)	40	usr-teacher	Sarah Jenkins	2026-10-20 00:14:13.116972+06	\N
sec-09b	sch-01	cls-09	Class 9	Tulip (Section B)	40	usr-teacher	Sarah Jenkins	2026-10-20 00:14:13.116973+06	\N
sec-10a	sch-01	cls-10	Class 10	Padma (Section A)	45	usr-teacher	Sarah Jenkins	2026-10-20 00:14:13.116768+06	\N
sec-10b	sch-01	cls-10	Class 10	Meghna (Section B)	40	usr-teacher	Sarah Jenkins	2026-10-20 00:14:13.116972+06	\N
\.


--
-- Data for Name: subjects; Type: TABLE DATA; Schema: academic; Owner: postgres
--

COPY academic.subjects ("Id", "SchoolId", "Code", "Name", "Type", "FullMarks", "PassMarks", "CreatedAt", "UpdatedAt") FROM stdin;
sub-bio	sch-01	BIO-106	Biology	Optional	100.00	33.00	2026-10-20 00:14:13.145976+06	\N
sub-chem	sch-01	CHE-103	Chemistry	Compulsory	100.00	33.00	2026-10-20 00:14:13.145975+06	\N
sub-eng	sch-01	ENG-104	English Literature	Compulsory	100.00	33.00	2026-10-20 00:14:13.145975+06	\N
sub-ict	sch-01	ICT-105	Information Technology	Compulsory	100.00	33.00	2026-10-20 00:14:13.145975+06	\N
sub-math	sch-01	MATH-101	Higher Mathematics	Compulsory	100.00	33.00	2026-10-20 00:14:13.145814+06	\N
sub-phys	sch-01	PHY-102	Physics	Compulsory	100.00	33.00	2026-10-20 00:14:13.145973+06	\N
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
att-001	sch-01	enr-001	stu-001	Tanvir Ahmed	01	cls-10	sec-10a	2026-10-19 06:00:00+06	Present	On-time arrival	Sarah Jenkins	2026-10-20 00:14:13.34445+06	\N
\.


--
-- Data for Name: menus; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.menus ("Id", "Code", "Name", "ParentCode", "Route", "Icon", "Type", "DisplayOrder", "IsActive", "IsVisible", "PermissionCode", "Badge", "CreatedAt", "UpdatedAt") FROM stdin;
25cf0c83-77e2-427a-bc3f-dde54a51017a	STUDENTS	Student Management	\N	\N	school	0	2	t	t	\N	\N	2026-10-20 00:14:12.991369+06	\N
25cf1f96-eb29-4773-ae8c-ccf6eb558bab	SECURITY	Security & RBAC	\N	\N	security	0	8	t	t	\N	\N	2026-10-20 00:14:12.991471+06	\N
4be8eb17-e900-4cf4-b0d1-138f7462ee6d	DASHBOARD	Dashboard	\N	/dashboard	dashboard	1	1	t	t	\N	\N	2026-10-20 00:14:12.991032+06	\N
757afb9d-dc06-47de-bb1d-5a871232f38e	REPORTS	Reports & Analytics	\N	\N	insert_chart	0	7	t	t	\N	\N	2026-10-20 00:14:12.991461+06	\N
7b04dd08-23ae-4233-854b-9753cc0beded	ATTENDANCE	Attendance Engine	\N	\N	event_available	0	4	t	t	\N	\N	2026-10-20 00:14:12.991446+06	\N
a1fea135-84df-4e63-93df-b9eaaa0fd83b	FINANCE	Finance & Fees	\N	\N	account_balance	0	6	t	t	\N	\N	2026-10-20 00:14:12.99146+06	\N
bbc9cb5a-89dc-4436-be67-e19a1b2ca984	ACADEMICS	Academic Operations	\N	\N	auto_stories	0	3	t	t	\N	\N	2026-10-20 00:14:12.991439+06	\N
c09c9c76-795f-4e0f-ad9f-7c4dd5fbf811	EXAMS	Examinations	\N	\N	quiz	0	5	t	t	\N	\N	2026-10-20 00:14:12.991456+06	\N
11e72036-59d6-4517-b241-800645f45708	SEC_MENUS	Dynamic Menus	SECURITY	/security/menus	menu_open	1	3	t	t	\N	\N	2026-10-20 00:14:12.991473+06	\N
1597099a-b664-43f9-8ea1-671506119bc4	ACAD_CLASSES	Classes & Sections	ACADEMICS	/academic/classes	meeting_room	1	2	t	t	\N	\N	2026-10-20 00:14:12.991445+06	\N
31f4f3e6-bc70-447a-bc89-b417090ff8a6	FIN_FEES	Fee Structures	FINANCE	/finance/fee-structure	price_change	1	1	t	t	\N	\N	2026-10-20 00:14:12.99146+06	\N
3cc49597-38e5-4096-ab71-a01f58f80e65	ACAD_ROUTINE	Class Timetable	ACADEMICS	/academic/routine	calendar_month	1	1	t	t	\N	\N	2026-10-20 00:14:12.991444+06	\N
473cf8fe-cc39-41a1-96cc-f5ba77888e3d	EXAM_RESULTS	Marksheet & Results	EXAMS	/exams/results	workspace_premium	1	3	t	t	\N	\N	2026-10-20 00:14:12.991459+06	\N
55efd664-8e14-4eab-bc4d-6500e19ac178	SEC_USERS	User Accounts	SECURITY	/security/users	manage_accounts	1	1	t	t	\N	\N	2026-10-20 00:14:12.991472+06	\N
6878f5d3-591d-4333-bda2-7f48e7851460	STU_LIST	Student Directory	STUDENTS	/students	people	1	1	t	t	\N	\N	2026-10-20 00:14:12.99137+06	\N
75126151-9dbb-4eb0-ac29-cef18a0931c6	EXAM_MARKS	Marks Entry	EXAMS	/exams/marks	edit_note	1	2	t	t	\N	\N	2026-10-20 00:14:12.991458+06	\N
78ab3c75-6061-41a0-8a45-9d23b8c932df	ATT_STUDENT	Daily Attendance	ATTENDANCE	/attendance/student	checklist	1	1	t	t	\N	\N	2026-10-20 00:14:12.991447+06	\N
7b73e7c7-6994-441f-8f78-1ba01b5e6f43	FIN_COLLECTION	Collection & Receipts	FINANCE	/finance/collection	point_of_sale	1	2	t	t	\N	\N	2026-10-20 00:14:12.991461+06	\N
ae7a58c0-08e8-49d1-83f1-16fb8fc478c3	REP_ACADEMIC	Academic Performance	REPORTS	/reports/academic	analytics	1	1	t	t	\N	\N	2026-10-20 00:14:12.991462+06	\N
d0b53b03-07ed-46d7-a210-69c3ce3bc19b	REP_FINANCE	Financial Ledger	REPORTS	/reports/financial	receipt_long	1	2	t	t	\N	\N	2026-10-20 00:14:12.991466+06	\N
e12f0526-3676-44cf-a4ba-f16f180a2065	SEC_AUDIT	Security Audit Trail	SECURITY	/security/audit-logs	policy	1	4	t	t	\N	\N	2026-10-20 00:14:12.991473+06	\N
e4aa6069-3479-4c59-ae21-fd73f8e3eb8a	STU_ADMIT	New Admission	STUDENTS	/students/admission	person_add	1	2	t	t	\N	\N	2026-10-20 00:14:12.991438+06	\N
eccedf23-c05f-4ffa-b144-fba69e34fd0c	ATT_REPORT	Attendance Records	ATTENDANCE	/attendance/report	summarize	1	2	t	t	\N	\N	2026-10-20 00:14:12.991455+06	\N
f20f659f-3294-46c7-8ce0-5e0eee85ee58	EXAM_SETUP	Exam Configuration	EXAMS	/exams/setup	assignment	1	1	t	t	\N	\N	2026-10-20 00:14:12.991457+06	\N
f3b34f71-2e6a-4f57-8a6c-2d578e97f13a	SEC_ROLES	Role Permissions	SECURITY	/security/roles	badge	1	2	t	t	\N	\N	2026-10-20 00:14:12.991472+06	\N
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
41fc383b-304a-4e15-95be-76ec905a0ad7	usr-admin	+YeFmy6AOgRgbqQCArXinB9RRUl6Z0JNuDebV0pw/mZm2csx05MH0XBQZS46dNDeB2Z1l/isxgnPtigpOWpYwg==	2026-10-27 00:14:22.54381+06	f	\N	2026-10-20 00:14:22.543754+06	\N
45d572ab-9966-4fec-b26b-675e9c0c6dbc	usr-student	wviXehAxaftzUC6qL3GnrySzL9QGiPPeixXnMXF6JBqkRJCAJoL2rMY/Kfw/d5NAp7wolLy/OYDwxToVlgtKTw==	2026-10-27 00:14:23.245901+06	f	\N	2026-10-20 00:14:23.2459+06	\N
\.


--
-- Data for Name: role_menu_permissions; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.role_menu_permissions ("Id", "RoleId", "MenuCode", "View", "Create", "Edit", "Delete", "Approve", "Export", "CreatedAt", "UpdatedAt") FROM stdin;
02f1a25f-c2fc-4fb2-88ab-ed9b6e799a7e	role-accountant	REPORTS	t	f	f	f	f	t	2026-10-20 00:14:13.076431+06	\N
0e26d7fa-ae5f-4ef7-8d0e-dffefccf38ff	role-superadmin	FIN_COLLECTION	t	t	t	t	t	t	2026-10-20 00:14:13.076289+06	\N
0e529c0e-7c18-46bf-91a4-5de383e5d0f8	role-teacher	STU_LIST	t	f	f	f	f	t	2026-10-20 00:14:13.075178+06	\N
0fcd0fe9-ee07-4ec5-bd09-cefcee2ff804	role-student	FINANCE	t	f	f	f	f	f	2026-10-20 00:14:13.076157+06	\N
14035bef-1a24-4f59-b169-0a68b992c58d	role-teacher	ATTENDANCE	t	f	f	f	f	t	2026-10-20 00:14:13.075581+06	\N
151eff50-27ab-484f-85c8-e46da57e0a0d	role-superadmin	SEC_AUDIT	t	t	t	t	t	t	2026-10-20 00:14:13.076716+06	\N
1b9a5c3a-06fe-4aae-a4d4-94ee3f358fd8	role-superadmin	EXAM_MARKS	t	t	t	t	t	t	2026-10-20 00:14:13.075983+06	\N
1fc7600e-9e83-47ae-96be-f52ecc53c7de	role-student	FIN_COLLECTION	t	f	f	f	f	t	2026-10-20 00:14:13.076317+06	\N
21550443-f311-4f8b-b8a7-6877ff1d9aed	role-superadmin	ATT_REPORT	t	t	t	t	t	t	2026-10-20 00:14:13.075709+06	\N
2622324d-02f9-4a19-b205-42c86bc89653	role-teacher	EXAM_MARKS	t	t	t	f	t	t	2026-10-20 00:14:13.076011+06	\N
2837e747-a85e-4825-8dc0-9cf7e22de5db	role-accountant	FINANCE	t	f	f	f	f	t	2026-10-20 00:14:13.076188+06	\N
2f376b66-f732-47cd-997f-14993516c79d	role-superadmin	ACAD_ROUTINE	t	t	t	t	t	t	2026-10-20 00:14:13.07542+06	\N
304a3687-ebbd-4f71-ad93-54055bf9c2af	role-superadmin	SEC_USERS	t	t	t	t	t	t	2026-10-20 00:14:13.076623+06	\N
4761d5a8-4f34-41f0-967a-0d1e168f9eda	role-student	EXAM_RESULTS	t	f	f	f	f	t	2026-10-20 00:14:13.076102+06	\N
49bd606b-52ae-484a-b3e5-ad8af4d39017	role-superadmin	STU_ADMIT	t	t	t	t	t	t	2026-10-20 00:14:13.075256+06	\N
4d3594b9-ff19-4df6-a0e2-9438f30c90a8	role-student	ACAD_ROUTINE	t	f	f	f	f	f	2026-10-20 00:14:13.075494+06	\N
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
8b91ab6f-3478-4ee7-a77f-b5a3c901637f	role-student	EXAMS	t	f	f	f	f	f	2026-10-20 00:14:13.075876+06	\N
95532a1a-ee34-4cf7-b643-9cd6d328e80c	role-teacher	ATT_STUDENT	t	t	t	f	f	t	2026-10-20 00:14:13.075675+06	\N
96563ce0-6c4d-4531-a630-a92dcf7f2255	role-superadmin	FINANCE	t	t	t	t	t	t	2026-10-20 00:14:13.07613+06	\N
9764ace3-4208-4a3e-aede-85595321823d	role-teacher	EXAMS	t	f	f	f	f	t	2026-10-20 00:14:13.075847+06	\N
9d852191-10c0-454e-a851-dd50d27381cd	role-teacher	ATT_REPORT	t	f	f	f	f	t	2026-10-20 00:14:13.075746+06	\N
a826c2cb-350d-4be2-b72a-4395888c23a5	role-teacher	REPORTS	t	f	f	f	f	t	2026-10-20 00:14:13.076403+06	\N
a89491c6-d490-497b-8326-9e19f76635d5	role-student	ATT_REPORT	t	f	f	f	f	f	2026-10-20 00:14:13.075779+06	\N
aaa613bc-72fb-4835-832c-ed75eaff4844	role-student	DASHBOARD	t	f	f	f	f	f	2026-10-20 00:14:13.074943+06	\N
ad89eaa3-7db6-4e6c-98bd-271ad9dcdf4f	role-superadmin	SECURITY	t	t	t	t	t	t	2026-10-20 00:14:13.076574+06	\N
b3d68714-0893-438e-a287-04be597930a6	role-superadmin	ACADEMICS	t	t	t	t	t	t	2026-10-20 00:14:13.075296+06	\N
b6a7e242-aa31-459d-9762-9d1d8d61a5c0	role-superadmin	REP_ACADEMIC	t	t	t	t	t	t	2026-10-20 00:14:13.076461+06	\N
c1cade5c-c915-4694-be14-820f8d717430	role-superadmin	ATT_STUDENT	t	t	t	t	t	t	2026-10-20 00:14:13.075643+06	\N
c4bd70f9-1fe9-45d0-9dcf-2b4e5419d85b	role-student	ATTENDANCE	t	f	f	f	f	f	2026-10-20 00:14:13.075608+06	\N
cbbbdbad-f11c-4ad2-b481-06a5ff3b47b5	role-teacher	ACADEMICS	t	f	f	f	f	t	2026-10-20 00:14:13.075325+06	\N
cc767e30-f754-46fb-8b9f-79ed659f4903	role-superadmin	ACAD_CLASSES	t	t	t	t	t	t	2026-10-20 00:14:13.075524+06	\N
d401b0de-85f3-4d41-97bc-b484c59bcf4a	role-superadmin	EXAMS	t	t	t	t	t	t	2026-10-20 00:14:13.075809+06	\N
d45e8858-2aa0-4663-a2db-8f07e6b48d32	role-accountant	FIN_COLLECTION	t	t	t	f	t	t	2026-10-20 00:14:13.076347+06	\N
d8214440-561a-4c4e-b250-01f949ba1623	role-student	ACADEMICS	t	f	f	f	f	f	2026-10-20 00:14:13.07536+06	\N
da527642-3125-417e-a6d1-c08e3c7aace2	role-teacher	EXAM_SETUP	t	f	f	f	f	t	2026-10-20 00:14:13.075954+06	\N
dba08e32-6404-408d-9db0-a1c908f37b00	role-teacher	ACAD_ROUTINE	t	f	f	f	f	t	2026-10-20 00:14:13.075449+06	\N
e1eaa031-2f90-405b-9741-70ae9510c5a9	role-teacher	STUDENTS	t	f	f	f	f	t	2026-10-20 00:14:13.075084+06	\N
e66aabdd-454b-4516-b4db-5f9ea7c7c811	role-superadmin	EXAM_SETUP	t	t	t	t	t	t	2026-10-20 00:14:13.075926+06	\N
ef29a54b-65b8-4e7a-89a2-41c735021d16	role-accountant	STUDENTS	t	f	f	f	f	t	2026-10-20 00:14:13.075115+06	\N
f3c4a90b-bcf6-4493-9633-357799dd0b0f	role-superadmin	FIN_FEES	t	t	t	t	t	t	2026-10-20 00:14:13.076231+06	\N
fe367a5e-4d3c-4004-980e-e9665459f80e	role-teacher	EXAM_RESULTS	t	f	f	f	f	t	2026-10-20 00:14:13.076074+06	\N
ffdd4bc9-b560-4a7a-8cc1-4e06b7cd9adc	role-superadmin	STU_LIST	t	t	t	t	t	t	2026-10-20 00:14:13.075146+06	\N
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
\.


--
-- Data for Name: teachers; Type: TABLE DATA; Schema: employee; Owner: postgres
--

COPY employee.teachers ("Id", "SchoolId", "EmployeeCode", "FullName", "Designation", "Department", "Qualification", "Email", "Phone", "JoiningDate", "Status", "Avatar", "AssignedSubjectsJson", "CreatedAt", "UpdatedAt") FROM stdin;
tch-001	sch-01	FAC-2022-045	Sarah Jenkins	Assistant Professor	Department of Physical Sciences	M.Sc in Applied Mathematics, University of Dhaka	sarah.jenkins@scholarsacademy.edu.bd	+880 1819-000002	2022-06-01 06:00:00+06	Active	https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80	{"subjects": ["Higher Mathematics", "Physics"]}	2026-10-20 00:14:13.308374+06	\N
\.


--
-- Data for Name: exams; Type: TABLE DATA; Schema: exam; Owner: postgres
--

COPY exam.exams ("Id", "SchoolId", "AcademicYearId", "Name", "Term", "AcademicYear", "StartDate", "EndDate", "IsPublished", "CreatedAt", "UpdatedAt") FROM stdin;
ex-annual-2026	sch-01	ay-2026	Annual Examination 2026	Final Term	2026	2026-11-10 06:00:00+06	2026-11-28 06:00:00+06	t	2026-10-20 00:14:13.376765+06	\N
\.


--
-- Data for Name: marks; Type: TABLE DATA; Schema: exam; Owner: postgres
--

COPY exam.marks ("Id", "SchoolId", "ExamId", "StudentId", "StudentName", "RollNo", "ClassId", "SectionId", "SubjectId", "SubjectName", "FullMarks", "ObtainedMarks", "Grade", "GradePoint", "IsPass", "CreatedAt", "UpdatedAt") FROM stdin;
mk-1	sch-01	ex-annual-2026	stu-001	Tanvir Ahmed	01	cls-10	sec-10a	sub-math	Higher Mathematics	100.00	96.00	A+	5.00	t	2026-10-20 00:14:13.402363+06	\N
mk-2	sch-01	ex-annual-2026	stu-001	Tanvir Ahmed	01	cls-10	sec-10a	sub-phys	Physics	100.00	92.00	A+	5.00	t	2026-10-20 00:14:13.405904+06	\N
mk-3	sch-01	ex-annual-2026	stu-001	Tanvir Ahmed	01	cls-10	sec-10a	sub-chem	Chemistry	100.00	88.00	A+	5.00	t	2026-10-20 00:14:13.405906+06	\N
mk-4	sch-01	ex-annual-2026	stu-001	Tanvir Ahmed	01	cls-10	sec-10a	sub-eng	English Literature	100.00	85.00	A+	5.00	t	2026-10-20 00:14:13.405907+06	\N
mk-5	sch-01	ex-annual-2026	stu-001	Tanvir Ahmed	01	cls-10	sec-10a	sub-ict	Information Technology	100.00	98.00	A+	5.00	t	2026-10-20 00:14:13.405922+06	\N
\.


--
-- Data for Name: fee_structures; Type: TABLE DATA; Schema: finance; Owner: postgres
--

COPY finance.fee_structures ("Id", "SchoolId", "AcademicYearId", "ClassId", "ClassName", "FeeTypeId", "FeeTypeName", "Amount", "DueDate", "CreatedAt", "UpdatedAt") FROM stdin;
fs-10	sch-01	ay-2026	cls-10	Class 10	ft-monthly	Monthly Tuition Fee	4500.00	2026-10-10 06:00:00+06	2026-10-20 00:14:13.464056+06	\N
\.


--
-- Data for Name: fee_types; Type: TABLE DATA; Schema: finance; Owner: postgres
--

COPY finance.fee_types ("Id", "SchoolId", "Name", "Code", "Frequency", "Description", "CreatedAt", "UpdatedAt") FROM stdin;
ft-lab	sch-01	Science Lab Maintenance	FEETYPE-LAB	Term-Wise	Physics & Chemistry lab fee	2026-10-20 00:14:13.446103+06	\N
ft-monthly	sch-01	Monthly Tuition Fee	FEETYPE-TUIT	Monthly	Regular monthly tuition fee	2026-10-20 00:14:13.445932+06	\N
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: finance; Owner: postgres
--

COPY finance.invoices ("Id", "SchoolId", "InvoiceNo", "StudentId", "StudentName", "RollNo", "ClassName", "SectionName", "FeeTypeId", "FeeTypeName", "TotalAmount", "DiscountAmount", "NetAmount", "PaidAmount", "DueAmount", "DueDate", "Status", "CreatedAt", "UpdatedAt") FROM stdin;
inv-2026-10	sch-01	INV-2026-10089	stu-001	Tanvir Ahmed	01	Class 10	Padma (Section A)	ft-monthly	Monthly Tuition Fee	4500.00	0.00	4500.00	4500.00	0.00	2026-10-15 06:00:00+06	Paid	2026-10-20 00:14:13.485546+06	\N
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: finance; Owner: postgres
--

COPY finance.payments ("Id", "SchoolId", "ReceiptNo", "InvoiceId", "StudentId", "StudentName", "RollNo", "ClassName", "AmountPaid", "PaymentMethod", "TransactionRef", "PaymentDate", "CollectedBy", "Notes", "CreatedAt", "UpdatedAt") FROM stdin;
pmt-001	sch-01	RCPT-2026-0941	inv-2026-10	stu-001	Tanvir Ahmed	01	Class 10	4500.00	bKash	TRX-9BK874108	2026-10-12 20:30:00+06	Online Gateway (bKash Auto-settle)	October Tuition full settlement	2026-10-20 00:14:13.529267+06	\N
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
ay-2026	sch-01	2026-2027	2026-01-01 06:00:00+06	2027-01-01 05:59:59+06	t	f	2026-10-20 00:14:11.916131+06	\N
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: school; Owner: postgres
--

COPY school.branches ("Id", "SchoolId", "Code", "Name", "Address", "Phone", "IsActive", "CreatedAt", "UpdatedAt") FROM stdin;
br-01	sch-01	BR-01	Main Campus	Plot 14, Road 2, Block-E, Dhaka	+880 1711-000000	t	2026-10-20 00:14:11.880559+06	\N
\.


--
-- Data for Name: schools; Type: TABLE DATA; Schema: school; Owner: postgres
--

COPY school.schools ("Id", "Name", "Code", "Address", "Contact", "Email", "Logo", "Website", "Status", "Timezone", "CreatedAt", "UpdatedAt") FROM stdin;
sch-01	Scholars International Academy	SCH-01	Plot 14, Road 2, Block-E, Dhaka 1212	+880 1711-000000	info@scholarsacademy.edu.bd	assets/images/logo.png	https://scholarsacademy.edu.bd	Active	Asia/Dhaka	2026-10-20 00:14:11.746405+06	\N
\.


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: student; Owner: postgres
--

COPY student.enrollments ("Id", "SchoolId", "StudentId", "AcademicYearId", "ClassId", "SectionId", "RollNo", "EnrollmentDate", "Status", "CreatedAt", "UpdatedAt") FROM stdin;
enr-001	sch-01	stu-001	ay-2026	cls-10	sec-10a	01	2026-01-05 06:00:00+06	Active	2026-10-20 00:14:13.280165+06	\N
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: student; Owner: postgres
--

COPY student.students ("Id", "SchoolId", "AdmissionNo", "FullName", "BanglaName", "DateOfBirth", "Gender", "BloodGroup", "Religion", "Email", "Phone", "PresentAddress", "PermanentAddress", "PhotoUrl", "GuardianName", "GuardianRelation", "GuardianPhone", "GuardianOccupation", "GuardianIncome", "AcademicYearId", "ClassId", "ClassName", "SectionId", "SectionName", "RollNo", "AdmissionDate", "Status", "CreatedAt", "UpdatedAt") FROM stdin;
stu-001	sch-01	ADM-2026-0089	Tanvir Ahmed	তানভীর আহমেদ	2010-04-15 06:00:00+06	Male	O+	Islam	tanvir.ahmed@student.scholarsacademy.edu.bd	+880 1711-234567	Flat 4B, Concord Tower, Gulshan-2, Dhaka	Vill: Sreepur, Upazila: Boalmari, Faridpur	https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80	Rafiqul Ahmed	Father	+880 1819-000004	Senior Software Architect	250,000 BDT/Month	ay-2026	cls-10	Class 10	sec-10a	Padma (Section A)	01	2026-01-05 06:00:00+06	Active	2026-10-20 00:14:13.211559+06	\N
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: system; Owner: postgres
--

COPY system.audit_logs ("Id", "SchoolId", "Timestamp", "UserName", "UserRole", "Action", "Module", "TargetRecord", "Details", "SchoolScope", "CreatedAt", "UpdatedAt") FROM stdin;
aud-001	sch-01	2026-10-20 00:14:13.574072+06	admin	Super Admin	Create	SYSTEM_INITIALIZE	Initial Seed Catalog	Standard production schemas, roles, dynamic menus, and master catalogs provisioned.	Main Campus	2026-10-20 00:14:13.574014+06	\N
\.


--
-- Data for Name: notices; Type: TABLE DATA; Schema: system; Owner: postgres
--

COPY system.notices ("Id", "SchoolId", "Title", "Category", "TargetAudience", "PublishedDate", "Content", "IsImportant", "Author", "CreatedAt", "UpdatedAt") FROM stdin;
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

\unrestrict VplRTWXCKeRxuLxIKiZih3Z38uBkbot7Tzd7bdcknjNfNeTvmrIXNbbdedZZ6sJ

