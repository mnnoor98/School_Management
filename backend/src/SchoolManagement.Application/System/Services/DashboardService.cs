using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.System.DTOs;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Employee;
using SchoolManagement.Domain.Exam;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Domain.School;
using SchoolManagement.Domain.Student;
using SchoolManagement.Domain.System;

namespace SchoolManagement.Application.System.Services;

public class DashboardService : IDashboardService
{
    private readonly IApplicationDbContext _context;
    private readonly IStudentAccessService _studentAccess;
    private readonly ICurrentUserService _currentUser;

    public DashboardService(
        IApplicationDbContext context,
        IStudentAccessService studentAccess,
        ICurrentUserService currentUser)
    {
        _context = context;
        _studentAccess = studentAccess;
        _currentUser = currentUser;
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync()
    {
        var allowedIds = await _studentAccess.GetAllowedStudentIdsAsync();
        if (allowedIds != null)
        {
            var studentInvoices = await _context.StudentInvoices
                .AsNoTracking()
                .Where(i => allowedIds.Contains(i.StudentId))
                .ToListAsync();

            var studentAttendance = await _context.AttendanceRecords
                .AsNoTracking()
                .Where(a => allowedIds.Contains(a.StudentId))
                .ToListAsync();

            decimal attendanceRate = studentAttendance.Count > 0
                ? Math.Round((decimal)studentAttendance.Count(a => a.Status == "Present") / studentAttendance.Count * 100, 1)
                : 0m;

            decimal totalRevenue = studentInvoices.Sum(i => i.NetAmount);
            decimal collectedRevenue = studentInvoices.Sum(i => i.PaidAmount);
            decimal dueRevenue = studentInvoices.Sum(i => i.DueAmount);
            decimal collectionRate = totalRevenue > 0 ? Math.Round((collectedRevenue / totalRevenue) * 100, 1) : 100m;

            return new DashboardStatsDto
            {
                TotalStudents = allowedIds.Count,
                TotalTeachers = await _context.Teachers.CountAsync(t => t.Status == "Active"),
                ActiveClasses = await _context.Students.Where(s => allowedIds.Contains(s.Id)).Select(s => s.ClassId).Distinct().CountAsync(),
                TodayPresent = studentAttendance.Count(a => a.AttendanceDate.Date == DateTime.UtcNow.Date && a.Status == "Present"),
                TodayTotal = studentAttendance.Count(a => a.AttendanceDate.Date == DateTime.UtcNow.Date),
                ActiveExams = await _context.Exams.CountAsync(),
                AttendanceRate = attendanceRate,
                FeeCollectionRate = collectionRate,
                TotalCollectedRevenue = collectedRevenue,
                TotalDueRevenue = dueRevenue
            };
        }

        int studentCount = await _context.Students.CountAsync(s => s.Status == "Active");
        int teacherCount = await _context.Teachers.CountAsync(t => t.Status == "Active");
        int classCount = await _context.Classes.CountAsync();
        int examCount = await _context.Exams.CountAsync();

        var today = DateTime.UtcNow.Date;
        var todayAttendance = await _context.AttendanceRecords.Where(a => a.AttendanceDate.Date == today).ToListAsync();
        decimal staffAttendanceRate = todayAttendance.Count > 0
            ? Math.Round((decimal)todayAttendance.Count(a => a.Status == "Present") / todayAttendance.Count * 100, 1)
            : 0m;

        decimal staffTotalRevenue = await _context.StudentInvoices.SumAsync(i => i.NetAmount);
        decimal staffCollectedRevenue = await _context.StudentInvoices.SumAsync(i => i.PaidAmount);
        decimal staffDueRevenue = await _context.StudentInvoices.SumAsync(i => i.DueAmount);
        decimal staffCollectionRate = staffTotalRevenue > 0 ? Math.Round((staffCollectedRevenue / staffTotalRevenue) * 100, 1) : 100m;

        return new DashboardStatsDto
        {
            TodayPresent = todayAttendance.Count(a => a.Status == "Present"),
            TodayTotal = todayAttendance.Count,
            TotalStudents = studentCount,
            TotalTeachers = teacherCount,
            ActiveClasses = classCount,
            ActiveExams = examCount,
            AttendanceRate = staffAttendanceRate,
            FeeCollectionRate = staffCollectionRate,
            TotalCollectedRevenue = staffCollectedRevenue,
            TotalDueRevenue = staffDueRevenue
        };
    }

    public async Task<PrincipalDashboardDto> GetPrincipalDashboardAsync()
    {
        var today = DateTime.UtcNow.Date;
        var activeStudents = await _context.Students.Where(s => s.Status == "Active").ToListAsync();
        var totalStudents = activeStudents.Count;
        var totalTeachers = await _context.Teachers.CountAsync(t => t.Status == "Active");

        var todayAttendance = await _context.AttendanceRecords
            .Where(a => a.AttendanceDate.Date == today)
            .ToListAsync();

        var todayPresent = todayAttendance.Count(a => a.Status == "Present");
        decimal attendanceRate = totalStudents > 0
            ? Math.Round((decimal)todayPresent / totalStudents * 100, 1)
            : 0m;

        // Class breakdown
        var classes = await _context.Classes.OrderBy(c => c.SortOrder).ToListAsync();
        var classMetrics = new List<ClassAttendanceMetricDto>();
        int unsubmittedSections = 0;

        foreach (var cls in classes)
        {
            var classStudentCount = activeStudents.Count(s => s.ClassId == cls.Id);
            var classPresent = todayAttendance.Count(a => a.ClassId == cls.Id && a.Status == "Present");
            var hasSubmitted = todayAttendance.Any(a => a.ClassId == cls.Id);
            if (!hasSubmitted && classStudentCount > 0)
            {
                unsubmittedSections++;
            }

            decimal rate = classStudentCount > 0 ? Math.Round((decimal)classPresent / classStudentCount * 100, 1) : 0m;
            classMetrics.Add(new ClassAttendanceMetricDto
            {
                ClassId = cls.Id,
                ClassName = cls.Name,
                TotalStudents = classStudentCount,
                PresentToday = classPresent,
                AttendanceRate = rate,
                HasSubmitted = hasSubmitted
            });
        }

        // Pending teacher leaves
        var pendingLeaves = await _context.TeacherLeaveApplications
            .Where(l => l.Status == "Pending")
            .OrderByDescending(l => l.CreatedAt)
            .Take(10)
            .Select(l => new PendingTeacherLeaveDto
            {
                ApplicationId = l.Id,
                TeacherName = l.TeacherName,
                Department = l.Department,
                LeaveType = l.LeaveType,
                StartDate = l.StartDate,
                EndDate = l.EndDate,
                TotalDays = l.TotalDays,
                Reason = l.Reason,
                AppliedAt = l.CreatedAt
            })
            .ToListAsync();

        // Latest Exam Analytics
        var latestExam = await _context.Exams
            .OrderByDescending(e => e.CreatedAt)
            .FirstOrDefaultAsync();

        var examAnalytics = new ExamPerformanceAnalyticsDto();
        decimal avgGpa = 0m;

        if (latestExam != null)
        {
            var marks = await _context.ExamMarks.Where(m => m.ExamId == latestExam.Id).ToListAsync();
            examAnalytics.ExamId = latestExam.Id;
            examAnalytics.ExamName = latestExam.Name;
            examAnalytics.TotalEvaluated = marks.Count;
            examAnalytics.PassCount = marks.Count(m => m.IsPass);
            examAnalytics.FailCount = marks.Count(m => !m.IsPass);
            examAnalytics.PassRate = marks.Count > 0 ? Math.Round((decimal)examAnalytics.PassCount / marks.Count * 100, 1) : 0m;
            examAnalytics.AverageGpa = marks.Count > 0 ? Math.Round(marks.Average(m => m.GradePoint), 2) : 0m;
            avgGpa = examAnalytics.AverageGpa;

            examAnalytics.GradeDistribution = new Dictionary<string, int>
            {
                ["A+"] = marks.Count(m => m.Grade == "A+"),
                ["A"] = marks.Count(m => m.Grade == "A"),
                ["A-"] = marks.Count(m => m.Grade == "A-"),
                ["B"] = marks.Count(m => m.Grade == "B"),
                ["C"] = marks.Count(m => m.Grade == "C"),
                ["D"] = marks.Count(m => m.Grade == "D"),
                ["F"] = marks.Count(m => m.Grade == "F")
            };
        }

        // Financial collection rate
        decimal totalInvoiced = await _context.StudentInvoices.SumAsync(i => i.NetAmount);
        decimal totalPaid = await _context.StudentInvoices.SumAsync(i => i.PaidAmount);
        decimal feeRate = totalInvoiced > 0 ? Math.Round((totalPaid / totalInvoiced) * 100, 1) : 100m;

        // Alerts
        var alerts = new List<DashboardAlertDto>();
        if (unsubmittedSections > 0)
        {
            alerts.Add(new DashboardAlertDto
            {
                Severity = "Danger",
                Title = "Attendance Alert",
                Message = $"{unsubmittedSections} class(es) have not registered student attendance today.",
                ActionRoute = "/app/attendance/entry",
                ActionText = "Take Attendance"
            });
        }

        if (pendingLeaves.Count > 0)
        {
            alerts.Add(new DashboardAlertDto
            {
                Severity = "Warning",
                Title = "Leave Applications",
                Message = $"{pendingLeaves.Count} faculty leave request(s) waiting for principal approval.",
                ActionRoute = "/app/teachers/leave",
                ActionText = "Review Leaves"
            });
        }

        if (attendanceRate < 80 && attendanceRate > 0)
        {
            alerts.Add(new DashboardAlertDto
            {
                Severity = "Warning",
                Title = "Attendance Shortage",
                Message = $"Overall campus attendance today is {attendanceRate}%, below target threshold of 80%.",
                ActionRoute = "/app/attendance/reports",
                ActionText = "View Attendance Report"
            });
        }

        return new PrincipalDashboardDto
        {
            Kpis = new CampusKpiSummaryDto
            {
                TodayAttendanceRate = attendanceRate,
                TodayPresentCount = todayPresent,
                TodayTotalExpected = totalStudents,
                TotalStudents = totalStudents,
                TotalTeachers = totalTeachers,
                UnsubmittedAttendanceSections = unsubmittedSections,
                PendingTeacherLeavesCount = pendingLeaves.Count,
                LatestExamAverageGpa = avgGpa,
                FeeCollectionRate = feeRate
            },
            ClassAttendanceBreakdown = classMetrics,
            PendingTeacherLeaves = pendingLeaves,
            LatestExamAnalytics = examAnalytics,
            CriticalAlerts = alerts
        };
    }

    public async Task<TeacherDashboardDto> GetTeacherDashboardAsync(string? teacherId = null)
    {
        Teacher? teacher = null;
        if (!string.IsNullOrEmpty(teacherId))
        {
            teacher = await _context.Teachers.FindAsync(teacherId);
        }
        if (teacher == null && !string.IsNullOrEmpty(_currentUser.Username))
        {
            teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.FullName.Contains(_currentUser.Username) || t.Email == _currentUser.Username);
        }
        if (teacher == null)
        {
            teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.Status == "Active") ??
                      await _context.Teachers.FirstOrDefaultAsync();
        }

        var teacherName = teacher?.FullName ?? _currentUser.Username ?? "Faculty Member";
        var department = teacher?.Department ?? "Academic Faculty";
        var tId = teacher?.Id ?? "tch-01";

        var todayDay = DateTime.UtcNow.DayOfWeek.ToString(); // e.g. "Sunday", "Monday"
        var routineList = await _context.RoutinePeriods
            .Where(r => r.TeacherId == tId || r.TeacherName == teacherName)
            .OrderBy(r => r.PeriodNumber)
            .ToListAsync();

        var todayRoutine = routineList
            .Where(r => string.Equals(r.Day, todayDay, StringComparison.OrdinalIgnoreCase))
            .Select(r => new TeacherRoutinePeriodDto
            {
                PeriodNumber = r.PeriodNumber,
                StartTime = r.StartTime,
                EndTime = r.EndTime,
                ClassName = r.ClassName,
                SectionName = r.SectionName,
                SubjectName = r.SubjectName,
                RoomNumber = r.RoomNo
            })
            .ToList();

        // If no routine for current day of week, provide sample/upcoming routine from schedule
        if (!todayRoutine.Any() && routineList.Any())
        {
            todayRoutine = routineList.Take(5).Select(r => new TeacherRoutinePeriodDto
            {
                PeriodNumber = r.PeriodNumber,
                StartTime = r.StartTime,
                EndTime = r.EndTime,
                ClassName = r.ClassName,
                SectionName = r.SectionName,
                SubjectName = r.SubjectName,
                RoomNumber = r.RoomNo
            }).ToList();
        }

        // Attendance for teacher's primary assigned class/section
        TeacherClassSectionAttendanceDto? classAttendance = null;
        var firstClass = routineList.FirstOrDefault();
        if (firstClass != null)
        {
            var today = DateTime.UtcNow.Date;
            var studentsInClass = await _context.Students
                .Where(s => s.ClassId == firstClass.ClassId && s.Status == "Active")
                .ToListAsync();

            var attRecords = await _context.AttendanceRecords
                .Where(a => a.ClassId == firstClass.ClassId && a.AttendanceDate.Date == today)
                .ToListAsync();

            var present = attRecords.Count(a => a.Status == "Present");
            classAttendance = new TeacherClassSectionAttendanceDto
            {
                ClassId = firstClass.ClassId,
                ClassName = firstClass.ClassName,
                SectionId = firstClass.SectionId,
                SectionName = firstClass.SectionName,
                TotalStudents = studentsInClass.Count,
                PresentToday = present,
                AbsentToday = Math.Max(0, studentsInClass.Count - present),
                IsAttendanceSubmittedToday = attRecords.Any()
            };
        }

        // Pending Marks Entries
        var pendingMarks = new List<TeacherPendingMarksSubjectDto>();
        var activeExams = await _context.Exams.OrderByDescending(e => e.CreatedAt).Take(2).ToListAsync();
        foreach (var ex in activeExams)
        {
            var subjects = await _context.ClassSubjectMappings
                .Where(m => m.TeacherId == tId || m.TeacherName == teacherName)
                .Take(4)
                .ToListAsync();

            foreach (var s in subjects)
            {
                var total = await _context.Students.CountAsync(st => st.ClassId == s.ClassId && st.Status == "Active");
                var evaluated = await _context.ExamMarks.CountAsync(m => m.ExamId == ex.Id && m.ClassId == s.ClassId && m.SubjectId == s.SubjectId);
                decimal progress = total > 0 ? Math.Round((decimal)evaluated / total * 100, 1) : 0m;

                pendingMarks.Add(new TeacherPendingMarksSubjectDto
                {
                    ExamId = ex.Id,
                    ExamName = ex.Name,
                    ClassId = s.ClassId,
                    ClassName = s.ClassName,
                    SubjectId = s.SubjectId,
                    SubjectName = s.SubjectName,
                    TotalStudents = total,
                    EvaluatedStudents = evaluated,
                    ProgressPercent = progress
                });
            }
        }

        // At risk students (attendance < 75% or GPA == 0.00)
        var atRiskList = new List<TeacherAtRiskStudentDto>();
        var allStudents = await _context.Students.Where(s => s.Status == "Active").Take(15).ToListAsync();
        foreach (var st in allStudents)
        {
            var stAtt = await _context.AttendanceRecords.Where(a => a.StudentId == st.Id).ToListAsync();
            decimal rate = stAtt.Count > 0 ? Math.Round((decimal)stAtt.Count(a => a.Status == "Present") / stAtt.Count * 100, 1) : 100m;
            var latestMark = await _context.ExamMarks.Where(m => m.StudentId == st.Id).OrderByDescending(m => m.CreatedAt).FirstOrDefaultAsync();
            decimal gpa = latestMark?.GradePoint ?? 3.5m;

            if (rate < 75 || gpa == 0)
            {
                atRiskList.Add(new TeacherAtRiskStudentDto
                {
                    StudentId = st.Id,
                    AdmissionNo = st.AdmissionNo,
                    RollNo = st.RollNo,
                    StudentName = st.FullName,
                    ClassName = st.ClassName,
                    SectionName = st.SectionName,
                    AttendanceRate = rate,
                    LatestExamGpa = gpa,
                    RiskType = rate < 75 && gpa == 0 ? "Both" : (rate < 75 ? "Shortage" : "Failing")
                });
            }
        }

        return new TeacherDashboardDto
        {
            TeacherId = tId,
            TeacherName = teacherName,
            Department = department,
            TodayRoutine = todayRoutine,
            ClassTeacherSection = classAttendance,
            PendingMarksEntries = pendingMarks,
            AtRiskStudents = atRiskList.Take(6).ToList()
        };
    }

    public async Task<AccountantDashboardDto> GetAccountantDashboardAsync()
    {
        var today = DateTime.UtcNow.Date;
        var todayPayments = await _context.FeePayments
            .Where(p => p.PaymentDate.Date == today)
            .ToListAsync();

        decimal todayTotal = todayPayments.Sum(p => p.AmountPaid);
        decimal todayCash = todayPayments.Where(p => p.PaymentMethod == "Cash").Sum(p => p.AmountPaid);
        decimal todayMfs = todayPayments.Where(p => p.PaymentMethod == "bKash" || p.PaymentMethod == "Nagad").Sum(p => p.AmountPaid);
        decimal todayBank = todayPayments.Where(p => p.PaymentMethod == "Bank Transfer").Sum(p => p.AmountPaid);

        // Monthly Target & Collections
        var invoices = await _context.StudentInvoices.ToListAsync();
        decimal totalInvoiced = invoices.Sum(i => i.NetAmount);
        decimal totalPaid = invoices.Sum(i => i.PaidAmount);
        decimal totalDue = invoices.Sum(i => i.DueAmount);
        decimal collectionRate = totalInvoiced > 0 ? Math.Round((totalPaid / totalInvoiced) * 100, 1) : 100m;

        // Overdue aging
        var unpaid = invoices.Where(i => i.DueAmount > 0).ToList();
        var now = DateTime.UtcNow;
        decimal due0To30 = 0m, due31To60 = 0m, due61To90 = 0m, dueAbove90 = 0m;

        foreach (var inv in unpaid)
        {
            var days = (now - inv.DueDate).TotalDays;
            if (days <= 30) due0To30 += inv.DueAmount;
            else if (days <= 60) due31To60 += inv.DueAmount;
            else if (days <= 90) due61To90 += inv.DueAmount;
            else dueAbove90 += inv.DueAmount;
        }

        // Class-wise breakdown by ClassName
        var classBreakdown = invoices
            .GroupBy(i => i.ClassName)
            .Select(g => new ClassFeeSummaryDto
            {
                ClassId = g.Key,
                ClassName = g.Key,
                TotalInvoiced = g.Sum(x => x.NetAmount),
                TotalCollected = g.Sum(x => x.PaidAmount),
                TotalDue = g.Sum(x => x.DueAmount),
                CollectionRate = g.Sum(x => x.NetAmount) > 0 ? Math.Round(g.Sum(x => x.PaidAmount) / g.Sum(x => x.NetAmount) * 100, 1) : 100m
            })
            .OrderByDescending(c => c.TotalDue)
            .Take(10)
            .ToList();

        // Recent Receipts
        var recentReceipts = await _context.FeePayments
            .OrderByDescending(p => p.PaymentDate)
            .Take(8)
            .Select(p => new RecentReceiptSummaryDto
            {
                ReceiptNo = p.ReceiptNo,
                StudentName = p.StudentName,
                RollNo = p.RollNo,
                ClassName = p.ClassName,
                AmountPaid = p.AmountPaid,
                PaymentMethod = p.PaymentMethod,
                PaymentDate = p.PaymentDate,
                FeeTypeName = p.Notes ?? "Institutional Fee Collection"
            })
            .ToListAsync();

        return new AccountantDashboardDto
        {
            TodayTotalCollected = todayTotal,
            TodayCashInDrawer = todayCash,
            TodayMfsTotal = todayMfs,
            TodayBankTotal = todayBank,
            TodayReceiptCount = todayPayments.Count,
            MonthlyTargetRevenue = totalInvoiced,
            MonthlyCollectedRevenue = totalPaid,
            MonthlyDueRevenue = totalDue,
            MonthlyCollectionRate = collectionRate,
            OverdueAging = new OverdueAgingDto
            {
                CurrentDue0To30 = due0To30,
                Overdue31To60 = due31To60,
                Overdue61To90 = due61To90,
                OverdueAbove90 = dueAbove90
            },
            ClassCollectionBreakdown = classBreakdown,
            RecentReceipts = recentReceipts
        };
    }

    public async Task<SuperAdminDashboardDto> GetSuperAdminDashboardAsync()
    {
        var branches = await _context.Branches.ToListAsync();
        var allStudents = await _context.Students.Where(s => s.Status == "Active").ToListAsync();
        var allTeachers = await _context.Teachers.Where(t => t.Status == "Active").ToListAsync();
        var allInvoices = await _context.StudentInvoices.ToListAsync();

        decimal globalRevenue = allInvoices.Sum(i => i.NetAmount);
        decimal globalCollected = allInvoices.Sum(i => i.PaidAmount);
        decimal globalRate = globalRevenue > 0 ? Math.Round((globalCollected / globalRevenue) * 100, 1) : 100m;

        var today = DateTime.UtcNow.Date;
        var campusSummaries = new List<CampusSummaryMetricDto>();

        foreach (var b in branches)
        {
            var bStudents = allStudents.Count(s => s.BranchId == b.Id);
            var bTeachers = allTeachers.Count(t => t.BranchId == b.Id);
            var bInvoices = allInvoices.Where(i => i.BranchId == b.Id).ToList();
            decimal bRevenue = bInvoices.Sum(i => i.NetAmount);
            decimal bCollected = bInvoices.Sum(i => i.PaidAmount);
            decimal bRate = bRevenue > 0 ? Math.Round((bCollected / bRevenue) * 100, 1) : 100m;

            var bAttendance = await _context.AttendanceRecords
                .Where(a => a.BranchId == b.Id && a.AttendanceDate.Date == today)
                .ToListAsync();
            decimal bAttRate = bStudents > 0 ? Math.Round((decimal)bAttendance.Count(a => a.Status == "Present") / bStudents * 100, 1) : 0m;

            campusSummaries.Add(new CampusSummaryMetricDto
            {
                BranchId = b.Id,
                BranchCode = b.Code,
                BranchName = b.Name,
                StudentCount = bStudents,
                TeacherCount = bTeachers,
                TodayAttendanceRate = bAttRate,
                FeeCollectionRate = bRate,
                TotalCollected = bCollected,
                IsActive = b.IsActive
            });
        }

        var recentLogs = await _context.AuditLogs
            .OrderByDescending(a => a.Timestamp)
            .Take(8)
            .Select(a => new AuditLogDto
            {
                BranchId = a.BranchId,
                Id = a.Id,
                Timestamp = a.Timestamp,
                UserName = a.UserName,
                UserRole = a.UserRole,
                Action = a.Action,
                Module = a.Module,
                Details = a.Details
            })
            .ToListAsync();

        return new SuperAdminDashboardDto
        {
            TotalCampuses = branches.Count,
            TotalGlobalStudents = allStudents.Count,
            TotalGlobalTeachers = allTeachers.Count,
            GlobalMonthlyRevenue = globalRevenue,
            GlobalMonthlyCollected = globalCollected,
            GlobalCollectionRate = globalRate,
            CampusSummaries = campusSummaries,
            RecentAuditLogs = recentLogs
        };
    }

    public async Task<StudentDashboardDto> GetStudentDashboardAsync(string? studentId = null)
    {
        Student? student = null;
        if (!string.IsNullOrEmpty(studentId))
        {
            student = await _context.Students.FindAsync(studentId);
        }
        if (student == null && !string.IsNullOrEmpty(_currentUser.Username))
        {
            student = await _context.Students.FirstOrDefaultAsync(s => s.FullName.Contains(_currentUser.Username) || s.AdmissionNo == _currentUser.Username);
        }
        if (student == null)
        {
            student = await _context.Students.FirstOrDefaultAsync(s => s.Status == "Active") ??
                      await _context.Students.FirstOrDefaultAsync();
        }

        var sId = student?.Id ?? "stu-001";
        var sName = student?.FullName ?? "Student";
        var admissionNo = student?.AdmissionNo ?? "ADM-2026-001";
        var rollNo = student?.RollNo ?? "01";
        var className = student?.ClassName ?? "Class 10";
        var sectionName = student?.SectionName ?? "Section A";

        // Attendance stats
        var attRecords = await _context.AttendanceRecords.Where(a => a.StudentId == sId).ToListAsync();
        var presentDays = attRecords.Count(a => a.Status == "Present");
        decimal attRate = attRecords.Count > 0 ? Math.Round((decimal)presentDays / attRecords.Count * 100, 1) : 100m;

        // Due fee
        var studentInvoices = await _context.StudentInvoices.Where(i => i.StudentId == sId).ToListAsync();
        decimal totalDue = studentInvoices.Sum(i => i.DueAmount);

        // Result
        var latestMarks = await _context.ExamMarks.Where(m => m.StudentId == sId).ToListAsync();
        StudentLatestResultDto? result = null;
        if (latestMarks.Any())
        {
            decimal total = latestMarks.Sum(m => m.FullMarks);
            decimal obtained = latestMarks.Sum(m => m.ObtainedMarks);
            decimal avgGpa = Math.Round(latestMarks.Average(m => m.GradePoint), 2);
            string letterGrade = avgGpa >= 5.0m ? "A+" : (avgGpa >= 4.0m ? "A" : (avgGpa >= 3.5m ? "A-" : (avgGpa >= 3.0m ? "B" : (avgGpa >= 2.0m ? "C" : (avgGpa >= 1.0m ? "D" : "F")))));

            var firstMarkExam = latestMarks.First().Exam;
            result = new StudentLatestResultDto
            {
                ExamName = firstMarkExam?.Name ?? "First Term Examination 2026",
                TotalMarks = total,
                ObtainedMarks = obtained,
                Gpa = avgGpa,
                LetterGrade = letterGrade,
                PositionInClass = 1
            };
        }

        // Upcoming exams
        var upcomingExams = await _context.ExamScheduleItems
            .Where(e => e.ExamDate >= DateTime.UtcNow.Date)
            .OrderBy(e => e.ExamDate)
            .Take(4)
            .Select(e => new UpcomingExamScheduleDto
            {
                ExamName = "Upcoming Term Exam",
                SubjectName = e.SubjectName,
                ExamDate = e.ExamDate,
                StartTime = e.StartTime,
                EndTime = e.EndTime,
                RoomNumber = e.RoomNo
            })
            .ToListAsync();

        // Routine
        var studentClassId = student?.ClassId ?? string.Empty;
        var routine = await _context.RoutinePeriods
            .Where(r => r.ClassId == studentClassId || r.ClassName == className)
            .OrderBy(r => r.PeriodNumber)
            .Take(5)
            .Select(r => new TeacherRoutinePeriodDto
            {
                PeriodNumber = r.PeriodNumber,
                StartTime = r.StartTime,
                EndTime = r.EndTime,
                ClassName = r.ClassName,
                SectionName = r.SectionName,
                SubjectName = r.SubjectName,
                RoomNumber = r.RoomNo
            })
            .ToListAsync();

        return new StudentDashboardDto
        {
            StudentId = sId,
            AdmissionNo = admissionNo,
            RollNo = rollNo,
            FullName = sName,
            ClassName = className,
            SectionName = sectionName,
            AttendanceRate = attRate,
            TotalDaysHeld = attRecords.Count,
            TotalPresentDays = presentDays,
            IsAttendanceShortage = attRate < 75m,
            TotalDueFee = totalDue,
            LatestResult = result,
            UpcomingExams = upcomingExams,
            TodayRoutine = routine
        };
    }

    public async Task<GuardianDashboardDto> GetGuardianDashboardAsync(string? guardianUserId = null)
    {
        var ward = await GetStudentDashboardAsync(null);
        var today = DateTime.UtcNow.Date;
        var todayAtt = await _context.AttendanceRecords
            .FirstOrDefaultAsync(a => a.StudentId == ward.StudentId && a.AttendanceDate.Date == today);

        var urgentNotices = await _context.Notices
            .Where(n => n.IsImportant || n.TargetAudience == "All" || n.TargetAudience == "Guardians")
            .OrderByDescending(n => n.PublishedDate)
            .Take(4)
            .Select(n => new NoticeDto
            {
                Id = n.Id,
                Title = n.Title,
                Category = n.Category,
                Content = n.Content,
                PublishedDate = n.PublishedDate,
                IsImportant = n.IsImportant,
                Author = n.Author
            })
            .ToListAsync();

        return new GuardianDashboardDto
        {
            GuardianName = _currentUser.Username ?? "Guardian",
            Ward = ward,
            TodayAttendanceStatus = todayAtt != null ? todayAtt.Status : "Not Registered",
            TodayAttendanceTime = todayAtt != null ? todayAtt.AttendanceDate.ToString("hh:mm tt") : "Awaiting School Check-in",
            UrgentNotices = urgentNotices
        };
    }
}
