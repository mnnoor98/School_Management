using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Attendance.DTOs;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Domain.Attendance;
using SchoolManagement.Domain.System;

namespace SchoolManagement.Application.Attendance.Services;

public class AttendanceService : IAttendanceService
{
    private readonly IApplicationDbContext _context;
    private readonly ISmsGatewayService _smsGateway;
    private static readonly object _fileLock = new();

    public AttendanceService(IApplicationDbContext context, ISmsGatewayService smsGateway)
    {
        _context = context;
        _smsGateway = smsGateway;
    }

    public async Task<List<AttendanceRecordDto>> GetStudentAttendanceAsync(string? classId, string? sectionId, DateTime? date, DateTime? startDate = null, DateTime? endDate = null, List<string>? allowedStudentIds = null)
    {
        DateTime startUtc;
        DateTime endUtc;

        if (startDate.HasValue && endDate.HasValue)
        {
            startUtc = DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc);
            endUtc = DateTime.SpecifyKind(endDate.Value.Date.AddDays(1), DateTimeKind.Utc);
        }
        else
        {
            var rawDate = date ?? DateTime.UtcNow;
            startUtc = DateTime.SpecifyKind(rawDate.Date, DateTimeKind.Utc);
            endUtc = startUtc.AddDays(1);
        }

        var query = _context.AttendanceRecords.AsNoTracking()
            .Where(a => a.AttendanceDate >= startUtc && a.AttendanceDate < endUtc);

        if (allowedStudentIds != null)
        {
            query = query.Where(a => allowedStudentIds.Contains(a.StudentId));
        }

        if (!string.IsNullOrEmpty(classId)) query = query.Where(a => a.ClassId == classId);
        if (!string.IsNullOrEmpty(sectionId)) query = query.Where(a => a.SectionId == sectionId);

        return await query
            .OrderBy(a => a.RollNo)
            .Select(a => new AttendanceRecordDto
            {
                Id = a.Id,
                BranchId = a.BranchId,
                Date = a.AttendanceDate,
                StudentId = a.StudentId,
                StudentName = a.StudentName,
                RollNo = a.RollNo,
                ClassId = a.ClassId,
                SectionId = a.SectionId,
                Status = a.Status,
                Remark = a.Remark,
                MarkedBy = a.MarkedBy,
                LastUpdated = a.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<bool> SaveStudentAttendanceRosterAsync(SaveRosterAttendanceRequest request, string markedBy, string branchId = "br-01")
    {
        var startOfDay = DateTime.SpecifyKind(request.Date.Date, DateTimeKind.Utc);
        if (startOfDay > DateTime.UtcNow.Date.AddDays(1))
        {
            throw new InvalidOperationException("Attendance cannot be recorded for future dates beyond current system date.");
        }

        var dateStr = request.Date.ToString("yyyy-MM-dd");

        // Validate Weekend and Holiday restrictions (unless declared as Special Working Day)
        var safeBranch = string.IsNullOrWhiteSpace(branchId) ? "br-01" : branchId.Trim();
        var calendar = LoadOrCreateCalendarData(safeBranch);
        var isSpecialWorkingDay = calendar.SpecialWorkingDays.Any(s => s.IsActive && s.Date == dateStr);

        // Fallback: If not declared in current branch file, check if declared in any branch/central calendar
        if (!isSpecialWorkingDay)
        {
            isSpecialWorkingDay = CheckIfSpecialWorkingDayGlobally(dateStr);
        }

        if (!isSpecialWorkingDay)
        {
            int dayOfWeek = (int)request.Date.DayOfWeek;
            var weekendDays = calendar.WeekendSettings?.WeekendDays ?? new List<int> { 5, 6 };
            if (weekendDays.Contains(dayOfWeek))
            {
                var dayName = request.Date.ToString("dddd");
                throw new InvalidOperationException($"Attendance entry is closed on weekends ({dayName}). Attendance cannot be recorded unless authorized as a special working day.");
            }

            var holiday = calendar.Holidays.FirstOrDefault(h => h.IsActive && string.Compare(dateStr, h.StartDate) >= 0 && string.Compare(dateStr, h.EndDate) <= 0);
            if (holiday != null)
            {
                throw new InvalidOperationException($"Attendance entry is closed on official holiday: {holiday.Title}. Attendance cannot be recorded unless authorized as a special working day.");
            }
        }

        var endOfDay = startOfDay.AddDays(1);

        foreach (var item in request.Records)
        {
            var existing = await _context.AttendanceRecords
                .FirstOrDefaultAsync(a => a.StudentId == item.StudentId && a.AttendanceDate >= startOfDay && a.AttendanceDate < endOfDay);

            if (existing != null)
            {
                existing.Status = item.Status;
                existing.Remark = item.Remark;
                existing.MarkedBy = markedBy;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _context.AttendanceRecords.Add(new AttendanceRecord
                {
                    StudentId = item.StudentId,
                    StudentName = item.StudentName,
                    RollNo = item.RollNo,
                    ClassId = request.ClassId,
                    SectionId = request.SectionId,
                    AttendanceDate = startOfDay,
                    Status = item.Status,
                    Remark = item.Remark,
                    MarkedBy = markedBy
                });
            }
        }

        await _context.SaveChangesAsync();

        // Automated SMS dispatch for absent students
        var absentItems = request.Records.Where(r => r.Status.Equals("Absent", StringComparison.OrdinalIgnoreCase)).ToList();
        if (absentItems.Count > 0)
        {
            try
            {
                var absentStudentIds = absentItems.Select(r => r.StudentId).ToList();
                var studentInfos = await _context.Students
                    .AsNoTracking()
                    .Where(s => absentStudentIds.Contains(s.Id) && !string.IsNullOrEmpty(s.GuardianPhone))
                    .Select(s => new { s.Id, s.FullName, s.RollNo, s.GuardianPhone })
                    .ToListAsync();

                foreach (var student in studentInfos)
                {
                    var text = $"Dear Guardian, your ward {student.FullName} (Roll: {student.RollNo}) is marked ABSENT today ({startOfDay:dd/MM/yyyy}). - School Authority";
                    await _smsGateway.SendSmsAsync(student.GuardianPhone, text);

                    _context.SmsDispatchLogs.Add(new SmsDispatchLog
                    {
                        RecipientGroup = $"Absent Alert: {student.FullName} ({student.GuardianPhone})",
                        RecipientCount = 1,
                        Message = text,
                        SenderName = markedBy,
                        SentAt = DateTime.UtcNow,
                        Status = "Delivered",
                        CreditsUsed = 1
                    });
                }
                await _context.SaveChangesAsync();
            }
            catch
            {
                // SMS dispatch failure should not block attendance roster saving
            }
        }

        return true;
    }

    public async Task<bool> LogAttendanceCorrectionAsync(AttendanceCorrectionDto request, string updatedBy)
    {
        var record = await _context.AttendanceRecords.FindAsync(request.AttendanceId);
        if (record != null)
        {
            record.Status = request.NewStatus;
            record.UpdatedAt = DateTime.UtcNow;
        }

        _context.AttendanceCorrectionLogs.Add(new AttendanceCorrectionLog
        {
            AttendanceRecordId = request.AttendanceId,
            Date = DateTime.SpecifyKind(request.Date, DateTimeKind.Utc),
            StudentName = request.StudentName,
            PreviousStatus = request.PreviousStatus,
            NewStatus = request.NewStatus,
            Reason = request.Reason,
            UpdatedBy = updatedBy,
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<AttendanceCorrectionDto>> GetAttendanceCorrectionsAsync()
    {
        return await _context.AttendanceCorrectionLogs
            .AsNoTracking()
            .OrderByDescending(c => c.Timestamp)
            .Take(100)
            .Select(c => new AttendanceCorrectionDto
            {
                Id = c.Id,
                BranchId = c.BranchId,
                AttendanceId = c.AttendanceRecordId,
                Date = c.Date,
                StudentName = c.StudentName,
                PreviousStatus = c.PreviousStatus,
                NewStatus = c.NewStatus,
                Reason = c.Reason,
                UpdatedBy = c.UpdatedBy,
                Timestamp = c.Timestamp
            })
            .ToListAsync();
    }

    private class BranchCalendarData
    {
        public WeekendSettingsDto WeekendSettings { get; set; } = new();
        public List<AcademicHolidayDto> Holidays { get; set; } = new();
        public List<SpecialWorkingDayDto> SpecialWorkingDays { get; set; } = new();
    }

    private string GetCalendarFilePath(string branchId)
    {
        var safeBranch = string.IsNullOrWhiteSpace(branchId) ? "br-01" : branchId.Trim();
        var baseDir = Path.Combine(AppContext.BaseDirectory, "calendar_data");
        if (!Directory.Exists(baseDir)) Directory.CreateDirectory(baseDir);
        return Path.Combine(baseDir, $"calendar_{safeBranch}.json");
    }

    private BranchCalendarData LoadOrCreateCalendarData(string branchId)
    {
        var safeBranch = string.IsNullOrWhiteSpace(branchId) ? "br-01" : branchId.Trim();
        var filePath = GetCalendarFilePath(safeBranch);

        lock (_fileLock)
        {
            if (File.Exists(filePath))
            {
                try
                {
                    var json = File.ReadAllText(filePath);
                    var data = JsonSerializer.Deserialize<BranchCalendarData>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (data != null) return data;
                }
                catch
                {
                    // Fall back to default seed
                }
            }

            var defaultData = new BranchCalendarData
            {
                WeekendSettings = new WeekendSettingsDto
                {
                    BranchId = safeBranch,
                    WeekendDays = new List<int> { 5, 6 }, // Friday (5) & Saturday (6)
                    CustomNote = "Standard Institutional Weekend: Friday & Saturday (5-Day Academic Week)",
                    UpdatedBy = "Principal / Academic Council",
                    UpdatedAt = DateTime.UtcNow
                },
                Holidays = new List<AcademicHolidayDto>
                {
                    new() { Id = "hol-01", BranchId = safeBranch, Title = "Shaheed Day & International Mother Language Day", StartDate = "2026-02-21", EndDate = "2026-02-21", Type = "Public", Description = "National holiday commemorating Bengali language martyrs", IsActive = true },
                    new() { Id = "hol-02", BranchId = safeBranch, Title = "Holy Eid-ul-Fitr & Shab-e-Qadr Vacation", StartDate = "2026-03-20", EndDate = "2026-03-24", Type = "Religious", Description = "Islamic festival celebration and academic closure", IsActive = true },
                    new() { Id = "hol-03", BranchId = safeBranch, Title = "Independence & National Day", StartDate = "2026-03-26", EndDate = "2026-03-26", Type = "Public", Description = "Commemoration of Bangladesh Declaration of Independence", IsActive = true },
                    new() { Id = "hol-04", BranchId = safeBranch, Title = "Bengali New Year (Pohela Boishakh)", StartDate = "2026-04-14", EndDate = "2026-04-14", Type = "Public", Description = "Celebration of the Bengali New Year 1433", IsActive = true },
                    new() { Id = "hol-05", BranchId = safeBranch, Title = "May Day (International Workers' Day)", StartDate = "2026-05-01", EndDate = "2026-05-01", Type = "Public", Description = "International holiday for labour rights", IsActive = true },
                    new() { Id = "hol-06", BranchId = safeBranch, Title = "Holy Eid-ul-Adha Vacation", StartDate = "2026-05-26", EndDate = "2026-05-30", Type = "Religious", Description = "Sacrifice festival and academic recess", IsActive = true },
                    new() { Id = "hol-07", BranchId = safeBranch, Title = "Mid-Term Summer Vacation", StartDate = "2026-07-01", EndDate = "2026-07-07", Type = "Vacation", Description = "Institutional recess before second term", IsActive = true },
                    new() { Id = "hol-08", BranchId = safeBranch, Title = "National Mourning Day", StartDate = "2026-08-15", EndDate = "2026-08-15", Type = "Public", Description = "Official national observance", IsActive = true },
                    new() { Id = "hol-09", BranchId = safeBranch, Title = "Durga Puja (Bijoya Dashami)", StartDate = "2026-10-19", EndDate = "2026-10-21", Type = "Religious", Description = "Hindu religious festival closure", IsActive = true },
                    new() { Id = "hol-10", BranchId = safeBranch, Title = "Victory Day (Bijoy Dibos)", StartDate = "2026-12-16", EndDate = "2026-12-16", Type = "Public", Description = "National holiday celebrating Bangladesh liberation", IsActive = true },
                    new() { Id = "hol-11", BranchId = safeBranch, Title = "Christmas Day & Winter Vacation", StartDate = "2026-12-25", EndDate = "2026-12-31", Type = "Vacation", Description = "Annual institutional winter break", IsActive = true }
                }
            };

            SaveCalendarData(safeBranch, defaultData);
            return defaultData;
        }
    }

    private void SaveCalendarData(string branchId, BranchCalendarData data)
    {
        var safeBranch = string.IsNullOrWhiteSpace(branchId) ? "br-01" : branchId.Trim();
        var filePath = GetCalendarFilePath(safeBranch);
        lock (_fileLock)
        {
            var json = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(filePath, json);
        }
    }

    public Task<WeekendSettingsDto> GetWeekendSettingsAsync(string branchId)
    {
        var data = LoadOrCreateCalendarData(branchId);
        return Task.FromResult(data.WeekendSettings);
    }

    public Task<WeekendSettingsDto> SaveWeekendSettingsAsync(string branchId, WeekendSettingsDto settings, string updatedBy)
    {
        var data = LoadOrCreateCalendarData(branchId);
        data.WeekendSettings.WeekendDays = settings.WeekendDays ?? new List<int> { 5, 6 };
        data.WeekendSettings.CustomNote = settings.CustomNote ?? string.Empty;
        data.WeekendSettings.UpdatedBy = updatedBy;
        data.WeekendSettings.UpdatedAt = DateTime.UtcNow;
        data.WeekendSettings.BranchId = string.IsNullOrWhiteSpace(branchId) ? "br-01" : branchId.Trim();

        SaveCalendarData(branchId, data);
        return Task.FromResult(data.WeekendSettings);
    }

    public Task<List<AcademicHolidayDto>> GetHolidaysAsync(string branchId)
    {
        var data = LoadOrCreateCalendarData(branchId);
        return Task.FromResult(data.Holidays);
    }

    public Task<AcademicHolidayDto> SaveHolidayAsync(string branchId, AcademicHolidayDto holiday)
    {
        var data = LoadOrCreateCalendarData(branchId);
        if (string.IsNullOrWhiteSpace(holiday.Id))
        {
            holiday.Id = "hol-" + Guid.NewGuid().ToString("N")[..8];
            holiday.BranchId = string.IsNullOrWhiteSpace(branchId) ? "br-01" : branchId.Trim();
            data.Holidays.Add(holiday);
        }
        else
        {
            var idx = data.Holidays.FindIndex(h => h.Id == holiday.Id);
            if (idx >= 0)
            {
                data.Holidays[idx] = holiday;
            }
            else
            {
                data.Holidays.Add(holiday);
            }
        }

        SaveCalendarData(branchId, data);
        return Task.FromResult(holiday);
    }

    public Task<bool> DeleteHolidayAsync(string branchId, string id)
    {
        var data = LoadOrCreateCalendarData(branchId);
        var removed = data.Holidays.RemoveAll(h => h.Id == id);
        if (removed > 0)
        {
            SaveCalendarData(branchId, data);
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }

    private bool CheckIfSpecialWorkingDayGlobally(string dateStr)
    {
        try
        {
            var baseDir = Path.Combine(AppContext.BaseDirectory, "calendar_data");
            if (!Directory.Exists(baseDir)) return false;

            var files = Directory.GetFiles(baseDir, "calendar_*.json");
            foreach (var file in files)
            {
                var json = File.ReadAllText(file);
                var data = JsonSerializer.Deserialize<BranchCalendarData>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (data?.SpecialWorkingDays != null && data.SpecialWorkingDays.Any(s => s.IsActive && s.Date == dateStr))
                {
                    return true;
                }
            }
        }
        catch
        {
            // fallback
        }
        return false;
    }

    public Task<List<SpecialWorkingDayDto>> GetSpecialWorkingDaysAsync(string branchId)
    {
        var safeBranch = string.IsNullOrWhiteSpace(branchId) ? "br-01" : branchId.Trim();
        var data = LoadOrCreateCalendarData(safeBranch);
        var map = new Dictionary<string, SpecialWorkingDayDto>(StringComparer.OrdinalIgnoreCase);

        foreach (var swd in data.SpecialWorkingDays)
        {
            if (!string.IsNullOrEmpty(swd.Date)) map[swd.Date] = swd;
        }

        try
        {
            var baseDir = Path.Combine(AppContext.BaseDirectory, "calendar_data");
            if (Directory.Exists(baseDir))
            {
                var files = Directory.GetFiles(baseDir, "calendar_*.json");
                foreach (var file in files)
                {
                    var json = File.ReadAllText(file);
                    var otherData = JsonSerializer.Deserialize<BranchCalendarData>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (otherData?.SpecialWorkingDays != null)
                    {
                        foreach (var swd in otherData.SpecialWorkingDays)
                        {
                            if (!string.IsNullOrEmpty(swd.Date) && !map.ContainsKey(swd.Date))
                            {
                                map[swd.Date] = swd;
                            }
                        }
                    }
                }
            }
        }
        catch
        {
            // fallback
        }

        return Task.FromResult(map.Values.ToList());
    }

    public Task<SpecialWorkingDayDto> DeclareSpecialWorkingDayAsync(string branchId, SpecialWorkingDayDto request, string declaredBy)
    {
        var safeBranch = string.IsNullOrWhiteSpace(branchId) ? "br-01" : branchId.Trim();
        var data = LoadOrCreateCalendarData(safeBranch);
        var safeDate = (request.Date ?? string.Empty).Trim();

        var existing = data.SpecialWorkingDays.FirstOrDefault(s => s.Date == safeDate);
        if (existing != null)
        {
            existing.Reason = request.Reason;
            existing.OrderReference = request.OrderReference;
            existing.DeclaredBy = declaredBy;
            existing.DeclaredAt = DateTime.UtcNow;
            existing.IsActive = true;
            SaveCalendarData(safeBranch, data);

            // Also sync to br-01 if different
            if (safeBranch != "br-01")
            {
                try
                {
                    var mainData = LoadOrCreateCalendarData("br-01");
                    var mainExist = mainData.SpecialWorkingDays.FirstOrDefault(s => s.Date == safeDate);
                    if (mainExist != null)
                    {
                        mainExist.Reason = request.Reason;
                        mainExist.OrderReference = request.OrderReference;
                        mainExist.DeclaredBy = declaredBy;
                        mainExist.IsActive = true;
                    }
                    else
                    {
                        mainData.SpecialWorkingDays.Add(existing);
                    }
                    SaveCalendarData("br-01", mainData);
                }
                catch {}
            }

            return Task.FromResult(existing);
        }

        var newEntry = new SpecialWorkingDayDto
        {
            Id = "swd-" + Guid.NewGuid().ToString("N")[..8],
            BranchId = safeBranch,
            Date = safeDate,
            Reason = request.Reason,
            OrderReference = request.OrderReference,
            DeclaredBy = declaredBy,
            DeclaredAt = DateTime.UtcNow,
            IsActive = true
        };

        data.SpecialWorkingDays.Add(newEntry);
        SaveCalendarData(safeBranch, data);

        // Also sync to br-01 if different
        if (safeBranch != "br-01")
        {
            try
            {
                var mainData = LoadOrCreateCalendarData("br-01");
                if (!mainData.SpecialWorkingDays.Any(s => s.Date == safeDate))
                {
                    mainData.SpecialWorkingDays.Add(newEntry);
                    SaveCalendarData("br-01", mainData);
                }
            }
            catch {}
        }

        return Task.FromResult(newEntry);
    }

    public Task<bool> RemoveSpecialWorkingDayAsync(string branchId, string dateOrId)
    {
        var safeBranch = string.IsNullOrWhiteSpace(branchId) ? "br-01" : branchId.Trim();
        var data = LoadOrCreateCalendarData(safeBranch);
        var removed = data.SpecialWorkingDays.RemoveAll(s => s.Id == dateOrId || s.Date == dateOrId);
        if (removed > 0)
        {
            SaveCalendarData(safeBranch, data);
        }

        try
        {
            var baseDir = Path.Combine(AppContext.BaseDirectory, "calendar_data");
            if (Directory.Exists(baseDir))
            {
                var files = Directory.GetFiles(baseDir, "calendar_*.json");
                foreach (var file in files)
                {
                    var json = File.ReadAllText(file);
                    var otherData = JsonSerializer.Deserialize<BranchCalendarData>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (otherData?.SpecialWorkingDays != null)
                    {
                        var count = otherData.SpecialWorkingDays.RemoveAll(s => s.Id == dateOrId || s.Date == dateOrId);
                        if (count > 0)
                        {
                            var bId = Path.GetFileNameWithoutExtension(file).Replace("calendar_", "");
                            SaveCalendarData(bId, otherData);
                            removed += count;
                        }
                    }
                }
            }
        }
        catch {}

        return Task.FromResult(removed > 0);
    }
}
