using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Students.DTOs;
using SchoolManagement.Domain.Student;

namespace SchoolManagement.Application.Students.Services;

public class StudentService : IStudentService
{
    private readonly IApplicationDbContext _context;
    private readonly IExcelImportExportService _excelService;

    public StudentService(IApplicationDbContext context, IExcelImportExportService excelService)
    {
        _context = context;
        _excelService = excelService;
    }

    public async Task<List<StudentDto>> GetStudentsAsync(string? classId, string? sectionId, string? search, List<string>? allowedStudentIds = null)
    {
        var query = _context.Students.AsNoTracking().AsQueryable();

        if (allowedStudentIds != null)
        {
            query = query.Where(s => allowedStudentIds.Contains(s.Id));
        }

        if (!string.IsNullOrEmpty(classId)) query = query.Where(s => s.ClassId == classId);
        if (!string.IsNullOrEmpty(sectionId)) query = query.Where(s => s.SectionId == sectionId);
        if (!string.IsNullOrEmpty(search))
        {
            search = search.Trim().ToLower();
            query = query.Where(s => s.FullName.ToLower().Contains(search) || s.AdmissionNo.ToLower().Contains(search) || s.RollNo.Contains(search));
        }

        return await query
            .OrderBy(s => s.RollNo)
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    public async Task<StudentDto?> GetStudentByIdAsync(string id)
    {
        var student = await _context.Students.FindAsync(id);
        if (student == null) return null;
        return MapToDto(student);
    }

    public async Task<StudentDto> AdmitStudentAsync(AdmissionRequest request)
    {
        var academicYear = await _context.AcademicYears.FirstOrDefaultAsync(y => y.IsCurrent)
            ?? await _context.AcademicYears.IgnoreQueryFilters().FirstOrDefaultAsync(y => y.IsCurrent)
            ?? await _context.AcademicYears.IgnoreQueryFilters().OrderByDescending(y => y.StartDate).FirstOrDefaultAsync();

        var schoolClass = await _context.Classes.FindAsync(request.ClassId);
        var section = await _context.Sections.FindAsync(request.SectionId);

        int count = await _context.Students.CountAsync(s => s.ClassId == request.ClassId && s.SectionId == request.SectionId);
        string newRoll = (count + 1).ToString("D2");
        string admNo = $"ADM-{DateTime.UtcNow.Year}-" + (new Random().Next(1000, 9999));

        var student = new Student
        {
            AdmissionNo = admNo,
            FullName = request.FullName,
            BanglaName = request.BanglaName,
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender,
            BloodGroup = request.BloodGroup,
            Religion = request.Religion,
            Email = request.Email,
            Phone = request.Phone,
            PresentAddress = request.PresentAddress,
            PermanentAddress = request.PermanentAddress,
            PhotoUrl = string.IsNullOrEmpty(request.PhotoUrl) ? "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80" : request.PhotoUrl,
            GuardianName = request.GuardianName,
            GuardianRelation = request.GuardianRelation,
            GuardianPhone = request.GuardianPhone,
            GuardianOccupation = request.GuardianOccupation,
            GuardianIncome = request.GuardianIncome,
            FatherName = request.FatherName,
            FatherPhone = request.FatherPhone,
            FatherOccupation = request.FatherOccupation,
            FatherNid = request.FatherNid,
            MotherName = request.MotherName,
            MotherPhone = request.MotherPhone,
            MotherOccupation = request.MotherOccupation,
            MotherNid = request.MotherNid,
            Nationality = !string.IsNullOrEmpty(request.Nationality) ? request.Nationality : "Bangladeshi",
            PreviousSchool = request.PreviousSchool,
            Division = request.Division,
            District = request.District,
            Upazila = request.Upazila,
            EmergencyContactName = request.EmergencyContactName,
            EmergencyContactPhone = request.EmergencyContactPhone,
            EmergencyContactRelation = request.EmergencyContactRelation,
            Shift = !string.IsNullOrEmpty(request.Shift) ? request.Shift : "Morning",
            AdmissionCategory = !string.IsNullOrEmpty(request.AdmissionCategory) ? request.AdmissionCategory : "Regular",
            LastClassPassed = request.LastClassPassed,
            LastPassingYear = request.LastPassingYear,
            LastGpaMarks = request.LastGpaMarks,
            TcNumber = request.TcNumber,
            CoCurricular = request.CoCurricular,
            MedicalNotes = request.MedicalNotes,
            IsHostel = request.IsHostel,
            IsTransport = request.IsTransport,
            AcademicYearId = !string.IsNullOrEmpty(request.AcademicYearId) ? request.AcademicYearId : (academicYear?.Id ?? "ay-2026"),
            ClassId = request.ClassId,
            ClassName = schoolClass?.Name ?? "General Class",
            SectionId = request.SectionId,
            SectionName = section?.Name ?? "Section A",
            RollNo = !string.IsNullOrEmpty(request.RollNo) ? request.RollNo : newRoll,
            AdmissionDate = DateTime.UtcNow,
            Status = !string.IsNullOrEmpty(request.Status) ? request.Status : "Active"
        };

        _context.Students.Add(student);

        _context.Enrollments.Add(new Enrollment
        {
            StudentId = student.Id,
            AcademicYearId = student.AcademicYearId,
            ClassId = student.ClassId,
            SectionId = student.SectionId,
            RollNo = student.RollNo,
            EnrollmentDate = DateTime.UtcNow,
            Status = "Active"
        });

        await _context.SaveChangesAsync();
        return MapToDto(student);
    }

    public async Task<StudentDto?> UpdateStudentAsync(string id, UpdateStudentRequest request)
    {
        var student = await _context.Students.FindAsync(id);
        if (student == null) return null;

        if (!string.IsNullOrWhiteSpace(request.FullName))
            student.FullName = request.FullName;
        if (request.BanglaName != null)
            student.BanglaName = request.BanglaName;
        if (request.DateOfBirth != default)
            student.DateOfBirth = request.DateOfBirth;
        if (!string.IsNullOrWhiteSpace(request.Gender))
            student.Gender = request.Gender;
        if (!string.IsNullOrWhiteSpace(request.BloodGroup))
            student.BloodGroup = request.BloodGroup;
        if (!string.IsNullOrWhiteSpace(request.Religion))
            student.Religion = request.Religion;
        if (request.Email != null)
            student.Email = request.Email;
        if (request.Phone != null)
            student.Phone = request.Phone;
        if (request.PresentAddress != null)
            student.PresentAddress = request.PresentAddress;
        if (request.PermanentAddress != null)
            student.PermanentAddress = request.PermanentAddress;
        if (!string.IsNullOrEmpty(request.PhotoUrl))
        {
            student.PhotoUrl = request.PhotoUrl;
        }

        if (!string.IsNullOrWhiteSpace(request.GuardianName))
            student.GuardianName = request.GuardianName;
        if (!string.IsNullOrWhiteSpace(request.GuardianRelation))
            student.GuardianRelation = request.GuardianRelation;
        if (request.GuardianPhone != null)
            student.GuardianPhone = request.GuardianPhone;
        if (request.GuardianOccupation != null)
            student.GuardianOccupation = request.GuardianOccupation;
        if (request.GuardianIncome != null)
            student.GuardianIncome = request.GuardianIncome;

        if (request.FatherName != null) student.FatherName = request.FatherName;
        if (request.FatherPhone != null) student.FatherPhone = request.FatherPhone;
        if (request.FatherOccupation != null) student.FatherOccupation = request.FatherOccupation;
        if (request.FatherNid != null) student.FatherNid = request.FatherNid;
        if (request.MotherName != null) student.MotherName = request.MotherName;
        if (request.MotherPhone != null) student.MotherPhone = request.MotherPhone;
        if (request.MotherOccupation != null) student.MotherOccupation = request.MotherOccupation;
        if (request.MotherNid != null) student.MotherNid = request.MotherNid;
        if (!string.IsNullOrWhiteSpace(request.Nationality)) student.Nationality = request.Nationality;
        if (request.PreviousSchool != null) student.PreviousSchool = request.PreviousSchool;
        if (request.Division != null) student.Division = request.Division;
        if (request.District != null) student.District = request.District;
        if (request.Upazila != null) student.Upazila = request.Upazila;
        if (request.EmergencyContactName != null) student.EmergencyContactName = request.EmergencyContactName;
        if (request.EmergencyContactPhone != null) student.EmergencyContactPhone = request.EmergencyContactPhone;
        if (request.EmergencyContactRelation != null) student.EmergencyContactRelation = request.EmergencyContactRelation;
        if (!string.IsNullOrWhiteSpace(request.Shift)) student.Shift = request.Shift;
        if (!string.IsNullOrWhiteSpace(request.AdmissionCategory)) student.AdmissionCategory = request.AdmissionCategory;
        if (request.LastClassPassed != null) student.LastClassPassed = request.LastClassPassed;
        if (request.LastPassingYear != null) student.LastPassingYear = request.LastPassingYear;
        if (request.LastGpaMarks != null) student.LastGpaMarks = request.LastGpaMarks;
        if (request.TcNumber != null) student.TcNumber = request.TcNumber;
        if (request.CoCurricular != null) student.CoCurricular = request.CoCurricular;
        if (request.MedicalNotes != null) student.MedicalNotes = request.MedicalNotes;
        student.IsHostel = request.IsHostel;
        student.IsTransport = request.IsTransport;
        if (!string.IsNullOrWhiteSpace(request.Status))
            student.Status = request.Status;

        if (!string.IsNullOrEmpty(request.ClassId) && request.ClassId != student.ClassId)
        {
            var targetClass = await _context.Classes.FindAsync(request.ClassId);
            if (targetClass != null)
            {
                student.ClassId = targetClass.Id;
                student.ClassName = targetClass.Name;
            }
        }

        if (!string.IsNullOrEmpty(request.SectionId) && request.SectionId != student.SectionId)
        {
            var targetSection = await _context.Sections.FindAsync(request.SectionId);
            if (targetSection != null)
            {
                student.SectionId = targetSection.Id;
                student.SectionName = targetSection.Name;
            }
        }

        if (!string.IsNullOrEmpty(request.RollNo))
        {
            student.RollNo = request.RollNo;
        }

        student.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return MapToDto(student);
    }

    public async Task<StudentDto?> UpdateStudentStatusAsync(string id, string status, string? reason)
    {
        var student = await _context.Students.FindAsync(id);
        if (student == null) return null;

        student.Status = status;
        student.UpdatedAt = DateTime.UtcNow;

        _context.AuditLogs.Add(new Domain.System.AuditLog
        {
            Timestamp = DateTime.UtcNow,
            UserName = "Administrator",
            UserRole = "Staff",
            Action = "UpdateStatus",
            Module = "Student Lifecycle",
            TargetRecord = student.AdmissionNo,
            Details = $"Changed status of student '{student.FullName}' ({student.AdmissionNo}) to '{status}'. Reason: {reason ?? "Status updated via lifecycle manager."}",
            SchoolScope = student.BranchId
        });

        await _context.SaveChangesAsync();
        return MapToDto(student);
    }

    public async Task<bool> DeleteStudentAsync(string id)
    {
        var student = await _context.Students.FindAsync(id);
        if (student == null) return false;

        _context.Students.Remove(student);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> PromoteStudentAsync(string id, StudentPromotionRequest request)
    {
        var student = await _context.Students.FindAsync(id);
        if (student == null) return false;

        var targetClass = await _context.Classes.FindAsync(request.TargetClassId);
        var targetSection = await _context.Sections.FindAsync(request.TargetSectionId);

        student.AcademicYearId = request.TargetAcademicYearId;
        student.ClassId = request.TargetClassId;
        student.ClassName = targetClass?.Name ?? student.ClassName;
        student.SectionId = request.TargetSectionId;
        student.SectionName = targetSection?.Name ?? student.SectionName;
        student.RollNo = request.NewRollNo;
        student.UpdatedAt = DateTime.UtcNow;

        var existingEnrollment = await _context.Enrollments.FirstOrDefaultAsync(e => e.StudentId == student.Id && e.AcademicYearId == request.TargetAcademicYearId);
        if (existingEnrollment != null)
        {
            existingEnrollment.ClassId = request.TargetClassId;
            existingEnrollment.SectionId = request.TargetSectionId;
            existingEnrollment.RollNo = request.NewRollNo;
            existingEnrollment.Status = "Active";
            existingEnrollment.EnrollmentDate = DateTime.UtcNow;
        }
        else
        {
            _context.Enrollments.Add(new Enrollment
            {
                BranchId = student.BranchId,
                SchoolId = student.SchoolId,
                StudentId = student.Id,
                AcademicYearId = request.TargetAcademicYearId,
                ClassId = request.TargetClassId,
                SectionId = request.TargetSectionId,
                RollNo = request.NewRollNo,
                EnrollmentDate = DateTime.UtcNow,
                Status = "Active"
            });
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<int> BatchPromoteAsync(BatchStudentPromotionRequest request)
    {
        if (request.Students == null || !request.Students.Any())
            return 0;

        var defaultTargetClass = await _context.Classes.FindAsync(request.TargetClassId);
        var defaultTargetSection = await _context.Sections.FindAsync(request.TargetSectionId);

        var studentIds = request.Students.Select(s => s.StudentId).ToList();
        var students = await _context.Students.Where(s => studentIds.Contains(s.Id)).ToListAsync();

        int promotedCount = 0;
        foreach (var item in request.Students)
        {
            var student = students.FirstOrDefault(s => s.Id == item.StudentId);
            if (student == null) continue;

            string targetClassId = !string.IsNullOrEmpty(item.TargetClassId) ? item.TargetClassId : request.TargetClassId;
            string targetSectionId = !string.IsNullOrEmpty(item.TargetSectionId) ? item.TargetSectionId : request.TargetSectionId;

            var targetClass = targetClassId == request.TargetClassId ? defaultTargetClass : await _context.Classes.FindAsync(targetClassId);
            var targetSection = targetSectionId == request.TargetSectionId ? defaultTargetSection : await _context.Sections.FindAsync(targetSectionId);

            string status = item.Status ?? "Promoted";
            if (status.Equals("Detained", StringComparison.OrdinalIgnoreCase) || status.Equals("Retained", StringComparison.OrdinalIgnoreCase))
            {
                // Retained in same class for next academic year
                targetClassId = student.ClassId;
                targetSectionId = student.SectionId;
                targetClass = await _context.Classes.FindAsync(targetClassId);
                targetSection = await _context.Sections.FindAsync(targetSectionId);
            }

            student.AcademicYearId = request.TargetAcademicYearId;
            student.ClassId = targetClassId;
            student.ClassName = targetClass?.Name ?? student.ClassName;
            student.SectionId = targetSectionId;
            student.SectionName = targetSection?.Name ?? student.SectionName;
            student.RollNo = item.NewRollNo;
            student.UpdatedAt = DateTime.UtcNow;

            var existingEnrollment = await _context.Enrollments.FirstOrDefaultAsync(e => e.StudentId == student.Id && e.AcademicYearId == request.TargetAcademicYearId);
            if (existingEnrollment != null)
            {
                existingEnrollment.ClassId = targetClassId;
                existingEnrollment.SectionId = targetSectionId;
                existingEnrollment.RollNo = item.NewRollNo;
                existingEnrollment.Status = status;
                existingEnrollment.EnrollmentDate = DateTime.UtcNow;
            }
            else
            {
                _context.Enrollments.Add(new Enrollment
                {
                    BranchId = student.BranchId,
                    SchoolId = student.SchoolId,
                    StudentId = student.Id,
                    AcademicYearId = request.TargetAcademicYearId,
                    ClassId = targetClassId,
                    SectionId = targetSectionId,
                    RollNo = item.NewRollNo,
                    EnrollmentDate = DateTime.UtcNow,
                    Status = status
                });
            }

            promotedCount++;
        }

        var firstStudent = students.FirstOrDefault();
        if (firstStudent != null)
        {
            var audit = new SchoolManagement.Domain.System.AuditLog
            {
                BranchId = firstStudent.BranchId,
                SchoolId = firstStudent.SchoolId,
                Action = "BATCH_PROMOTION",
                Module = "Student Promotion",
                TargetRecord = defaultTargetClass?.Name ?? request.TargetClassId,
                Details = $"Batch processed {promotedCount} students to Class: {defaultTargetClass?.Name ?? request.TargetClassId} ({defaultTargetSection?.Name ?? request.TargetSectionId}) for Academic Year: {request.TargetAcademicYearId}",
                Timestamp = DateTime.UtcNow
            };
            _context.AuditLogs.Add(audit);
        }

        await _context.SaveChangesAsync();
        return promotedCount;
    }

    public byte[] DownloadImportTemplate()
    {
        return _excelService.GenerateStudentImportTemplate();
    }

    public async Task<(BulkImportResultDto? Result, string? Error)> BulkImportStudentsAsync(
        Stream stream,
        string fileName,
        string classId,
        string sectionId,
        string? academicYearId)
    {
        var schoolClass = await _context.Classes.FindAsync(classId);
        if (schoolClass == null)
            return (null, $"Specified ClassId '{classId}' does not exist in the active campus.");

        var section = await _context.Sections.FindAsync(sectionId);
        if (section == null)
            return (null, $"Specified SectionId '{sectionId}' does not exist in the active campus.");

        var currentYear = await _context.AcademicYears.FirstOrDefaultAsync(y => y.IsCurrent)
            ?? await _context.AcademicYears.IgnoreQueryFilters().FirstOrDefaultAsync(y => y.IsCurrent)
            ?? await _context.AcademicYears.IgnoreQueryFilters().OrderByDescending(y => y.StartDate).FirstOrDefaultAsync();
        var effectiveAcademicYearId = !string.IsNullOrEmpty(academicYearId) ? academicYearId : (currentYear?.Id ?? "ay-2026");

        List<BulkStudentImportRow> rows;
        List<string> parseErrors;
        rows = _excelService.ParseStudentImportExcel(stream, out parseErrors);

        var result = new BulkImportResultDto
        {
            TotalRows = rows.Count + parseErrors.Count,
            Errors = new List<string>(parseErrors)
        };

        if (rows.Count == 0)
        {
            result.SkippedCount = parseErrors.Count;
            return (result, parseErrors.Count > 0 ? string.Join("; ", parseErrors.Take(5)) : "No valid student rows found in template.");
        }

        int existingCount = await _context.Students.CountAsync(s => s.ClassId == classId && s.SectionId == sectionId);
        var random = new Random();

        foreach (var row in rows)
        {
            try
            {
                existingCount++;
                var rollNo = !string.IsNullOrWhiteSpace(row.RollNo) ? row.RollNo : existingCount.ToString("D2");
                var admNo = $"ADM-{DateTime.UtcNow.Year}-" + random.Next(1000, 9999);

                var student = new Student
                {
                    AdmissionNo = admNo,
                    FullName = row.FullName,
                    BanglaName = row.BanglaName,
                    DateOfBirth = row.DateOfBirth ?? new DateTime(2010, 1, 1),
                    Gender = row.Gender,
                    BloodGroup = row.BloodGroup,
                    Religion = row.Religion,
                    Email = string.IsNullOrWhiteSpace(row.Email)
                        ? $"{row.FullName.ToLowerInvariant().Replace(" ", "")}{random.Next(10, 99)}@student.school.edu"
                        : row.Email,
                    Phone = row.Phone,
                    PresentAddress = row.PresentAddress,
                    PermanentAddress = row.PermanentAddress,
                    PhotoUrl = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
                    GuardianName = row.GuardianName,
                    GuardianRelation = row.GuardianRelation,
                    GuardianPhone = row.GuardianPhone,
                    GuardianOccupation = row.GuardianOccupation,
                    GuardianIncome = row.GuardianIncome,
                    AcademicYearId = effectiveAcademicYearId,
                    ClassId = classId,
                    ClassName = schoolClass.Name,
                    SectionId = sectionId,
                    SectionName = section.Name,
                    RollNo = rollNo,
                    AdmissionDate = DateTime.UtcNow,
                    Status = "Active"
                };

                _context.Students.Add(student);

                _context.Enrollments.Add(new Enrollment
                {
                    StudentId = student.Id,
                    AcademicYearId = effectiveAcademicYearId,
                    ClassId = classId,
                    SectionId = sectionId,
                    RollNo = rollNo,
                    EnrollmentDate = DateTime.UtcNow,
                    Status = "Enrolled"
                });

                result.ImportedCount++;
                result.CreatedAdmissionNos.Add(admNo);
            }
            catch (Exception ex)
            {
                result.SkippedCount++;
                result.Errors.Add($"Row {row.RowNumber} ({row.FullName}): {ex.Message}");
            }
        }

        await _context.SaveChangesAsync();
        return (result, null);
    }

    private static StudentDto MapToDto(Student s) => new()
    {
        Id = s.Id,
        BranchId = s.BranchId,
        AdmissionNo = s.AdmissionNo,
        FullName = s.FullName,
        BanglaName = s.BanglaName,
        DateOfBirth = s.DateOfBirth,
        Gender = s.Gender,
        BloodGroup = s.BloodGroup,
        Religion = s.Religion,
        Email = s.Email,
        Phone = s.Phone,
        PresentAddress = s.PresentAddress,
        PermanentAddress = s.PermanentAddress,
        PhotoUrl = s.PhotoUrl,
        GuardianName = s.GuardianName,
        GuardianRelation = s.GuardianRelation,
        GuardianPhone = s.GuardianPhone,
        GuardianOccupation = s.GuardianOccupation,
        GuardianIncome = s.GuardianIncome,
        FatherName = s.FatherName,
        FatherPhone = s.FatherPhone,
        FatherOccupation = s.FatherOccupation,
        FatherNid = s.FatherNid,
        MotherName = s.MotherName,
        MotherPhone = s.MotherPhone,
        MotherOccupation = s.MotherOccupation,
        MotherNid = s.MotherNid,
        Nationality = s.Nationality,
        PreviousSchool = s.PreviousSchool,
        Division = s.Division,
        District = s.District,
        Upazila = s.Upazila,
        EmergencyContactName = s.EmergencyContactName,
        EmergencyContactPhone = s.EmergencyContactPhone,
        EmergencyContactRelation = s.EmergencyContactRelation,
        Shift = s.Shift,
        AdmissionCategory = s.AdmissionCategory,
        LastClassPassed = s.LastClassPassed,
        LastPassingYear = s.LastPassingYear,
        LastGpaMarks = s.LastGpaMarks,
        TcNumber = s.TcNumber,
        CoCurricular = s.CoCurricular,
        MedicalNotes = s.MedicalNotes,
        IsHostel = s.IsHostel,
        IsTransport = s.IsTransport,
        AcademicYearId = s.AcademicYearId,
        ClassId = s.ClassId,
        ClassName = s.ClassName,
        SectionId = s.SectionId,
        SectionName = s.SectionName,
        RollNo = s.RollNo,
        AdmissionDate = s.AdmissionDate,
        Status = s.Status
    };

    public async Task<AdmissionLookupsDto> GetAdmissionLookupsAsync()
    {
        var years = await _context.AcademicYears
            .OrderByDescending(y => y.IsCurrent)
            .ThenByDescending(y => y.StartDate)
            .Select(y => new LookupOptionDto { Id = y.Id, Label = y.Name, Description = y.IsCurrent ? "Current Session" : null })
            .ToListAsync();

        var classes = await _context.Classes
            .OrderBy(c => c.Name)
            .Select(c => new LookupOptionDto { Id = c.Id, Label = c.Name })
            .ToListAsync();

        return new AdmissionLookupsDto
        {
            AcademicYears = years,
            Classes = classes,
            Genders = new List<LookupOptionDto>
            {
                new() { Id = "Male", Label = "Male" },
                new() { Id = "Female", Label = "Female" },
                new() { Id = "Other", Label = "Other" }
            },
            BloodGroups = new List<LookupOptionDto>
            {
                new() { Id = "A+", Label = "A+" },
                new() { Id = "A-", Label = "A-" },
                new() { Id = "B+", Label = "B+" },
                new() { Id = "B-", Label = "B-" },
                new() { Id = "O+", Label = "O+" },
                new() { Id = "O-", Label = "O-" },
                new() { Id = "AB+", Label = "AB+" },
                new() { Id = "AB-", Label = "AB-" }
            },
            Religions = new List<LookupOptionDto>
            {
                new() { Id = "Islam", Label = "Islam" },
                new() { Id = "Hinduism", Label = "Hinduism" },
                new() { Id = "Christianity", Label = "Christianity" },
                new() { Id = "Buddhism", Label = "Buddhism" },
                new() { Id = "Other", Label = "Other" }
            },
            Nationalities = new List<LookupOptionDto>
            {
                new() { Id = "Bangladeshi", Label = "🇧🇩 Bangladeshi" },
                new() { Id = "Other", Label = "🌐 Other" }
            },
            GuardianRelations = new List<LookupOptionDto>
            {
                new() { Id = "Father", Label = "Father (পিতা)" },
                new() { Id = "Mother", Label = "Mother (মাতা)" },
                new() { Id = "Brother", Label = "Brother (ভাই)" },
                new() { Id = "Sister", Label = "Sister (বোন)" },
                new() { Id = "Uncle", Label = "Uncle (চাচা/মামা)" },
                new() { Id = "Aunt", Label = "Aunt (ফুফু/খালা)" },
                new() { Id = "Legal Guardian", Label = "Legal Guardian (আইনগত অভিভাবক)" },
                new() { Id = "Other", Label = "Other (অন্যান্য)" }
            },
            AdmissionCategories = new List<LookupOptionDto>
            {
                new() { Id = "Regular", Label = "Regular Student" },
                new() { Id = "Transfer", Label = "Transfer In" },
                new() { Id = "Scholarship", Label = "Merit Scholarship" },
                new() { Id = "Quota", Label = "Sibling / Quota" },
                new() { Id = "StaffWard", Label = "Staff Ward" }
            },
            AcademicShifts = new List<LookupOptionDto>
            {
                new() { Id = "Morning", Label = "Morning Shift (প্রভাতি)" },
                new() { Id = "Day", Label = "Day Shift (দিবা)" }
            },
            Divisions = GetBangladeshGeographicData()
        };
    }

    private static List<DivisionLookupDto> GetBangladeshGeographicData()
    {
        return new List<DivisionLookupDto>
        {
            new()
            {
                Name = "Dhaka",
                Districts = new List<DistrictLookupDto>
                {
                    new() { Name = "Dhaka", Upazilas = new() { "Dhanmondi", "Gulshan", "Mirpur", "Mohammadpur", "Uttara", "Tejgaon", "Badda", "Motijheel", "Khilgaon", "Savar", "Keraniganj", "Dhamrai" } },
                    new() { Name = "Gazipur", Upazilas = new() { "Gazipur Sadar", "Kaliakair", "Kapasia", "Sreepur", "Kaliganj", "Tongi" } },
                    new() { Name = "Narayanganj", Upazilas = new() { "Narayanganj Sadar", "Araihazar", "Bandar", "Rupganj", "Sonargaon" } },
                    new() { Name = "Tangail", Upazilas = new() { "Tangail Sadar", "Gopalpur", "Basail", "Bhuapur", "Delduar", "Ghatail", "Kalihati", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur" } },
                    new() { Name = "Faridpur", Upazilas = new() { "Faridpur Sadar", "Boalmari", "Alfadanga", "Madhukhali", "Bhanga", "Nagarkanda", "Charbhadrasan", "Sadarpur", "Saltha" } },
                    new() { Name = "Manikganj", Upazilas = new() { "Manikganj Sadar", "Singair", "Shivalaya", "Saturia", "Harirampur", "Ghior", "Daulatpur" } },
                    new() { Name = "Munshiganj", Upazilas = new() { "Munshiganj Sadar", "Sreenagar", "Sirajdikhan", "Louhajang", "Tongibari", "Gazaria" } },
                    new() { Name = "Narsingdi", Upazilas = new() { "Narsingdi Sadar", "Belabo", "Monohardi", "Palash", "Raipura", "Shibpur" } },
                    new() { Name = "Kishoreganj", Upazilas = new() { "Kishoreganj Sadar", "Bajitpur", "Bhairab", "Hossainpur", "Itna", "Karimganj", "Katiadi", "Kuliarchar", "Mithamain", "Nikli", "Pakundia", "Tarail" } },
                    new() { Name = "Gopalganj", Upazilas = new() { "Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara" } },
                    new() { Name = "Madaripur", Upazilas = new() { "Madaripur Sadar", "Kalkini", "Rajoir", "Shibchar" } },
                    new() { Name = "Rajbari", Upazilas = new() { "Rajbari Sadar", "Baliakandi", "Goalandaghat", "Pangsha", "Kalukhali" } },
                    new() { Name = "Shariatpur", Upazilas = new() { "Shariatpur Sadar", "Bhedarganj", "Damudya", "Gosairhat", "Naria", "Zajira" } }
                }
            },
            new()
            {
                Name = "Chattogram",
                Districts = new List<DistrictLookupDto>
                {
                    new() { Name = "Chattogram", Upazilas = new() { "Kotwali", "Panchlaish", "Pahartali", "Double Mooring", "Khulshi", "Halishahar", "Chandgaon", "Bakalia", "Hathazari", "Raozan", "Fatikchhari", "Sitakunda", "Mirsharai", "Patiya", "Boalkhali", "Anwara", "Chandanaish", "Lohagara", "Satkania", "Banshkhali" } },
                    new() { Name = "Cox's Bazar", Upazilas = new() { "Cox's Bazar Sadar", "Chakaria", "Kutubdia", "Maheshkhali", "Ramu", "Teknaf", "Ukhia", "Pekua" } },
                    new() { Name = "Cumilla", Upazilas = new() { "Cumilla Adarsha Sadar", "Cumilla Sadar Dakshin", "Barura", "Brahmanpara", "Burichang", "Chandina", "Chauddagram", "Daudkandi", "Debidwar", "Homna", "Laksam", "Muradnagar", "Nangalkot", "Meghna", "Titas", "Monohargonj", "Lalmai" } },
                    new() { Name = "Feni", Upazilas = new() { "Feni Sadar", "Chhagalnaiya", "Daganbhuiyan", "Parshuram", "Fulgazi", "Sonagazi" } },
                    new() { Name = "Brahmanbaria", Upazilas = new() { "Brahmanbaria Sadar", "Ashuganj", "Nasirnagar", "Nabinagar", "Sarail", "Kasba", "Akhaura", "Bancharampur", "Bijoynagar" } },
                    new() { Name = "Noakhali", Upazilas = new() { "Noakhali Sadar", "Begumganj", "Chatkhil", "Companiganj", "Hatiya", "Senbagh", "Sonaimuri", "Subarnachar", "Kabirhat" } },
                    new() { Name = "Chandpur", Upazilas = new() { "Chandpur Sadar", "Faridganj", "Haimchar", "Haziganj", "Kachua", "Matlab Dakshin", "Matlab Uttar", "Shahrasti" } },
                    new() { Name = "Lakshmipur", Upazilas = new() { "Lakshmipur Sadar", "Raipur", "Ramganj", "Ramgati", "Kamalnagar" } },
                    new() { Name = "Bandarban", Upazilas = new() { "Bandarban Sadar", "Alikadam", "Naikhongchhari", "Rowangchhari", "Ruma", "Thanchi", "Lama" } },
                    new() { Name = "Khagrachhari", Upazilas = new() { "Khagrachhari Sadar", "Dighinala", "Lakshmichhari", "Mahalchhari", "Manikchhari", "Matiranga", "Panchhari", "Ramgarh", "Guimara" } },
                    new() { Name = "Rangamati", Upazilas = new() { "Rangamati Sadar", "Bagaichhari", "Barkal", "Belaichhari", "Juraichhari", "Kaptai", "Kawkhali", "Langadu", "Naniarchar", "Rajasthali" } }
                }
            },
            new()
            {
                Name = "Rajshahi",
                Districts = new List<DistrictLookupDto>
                {
                    new() { Name = "Rajshahi", Upazilas = new() { "Boalia", "Rajpara", "Motihar", "Shah Mokdum", "Paba", "Godagari", "Tanore", "Mohanpur", "Bagmara", "Durgapur", "Bagha", "Charghat", "Puthia" } },
                    new() { Name = "Bogura", Upazilas = new() { "Bogura Sadar", "Adamdighi", "Dhunat", "Dhupchanchia", "Gabtali", "Kahaloo", "Nandigram", "Sariakandi", "Sahajanpur", "Sherpur", "Shibganj", "Sonatala" } },
                    new() { Name = "Pabna", Upazilas = new() { "Pabna Sadar", "Atgharia", "Bera", "Bhangura", "Chatmohar", "Faridpur", "Ishwardi", "Santhia", "Sujanagar" } },
                    new() { Name = "Sirajganj", Upazilas = new() { "Sirajganj Sadar", "Belkuchi", "Chauhali", "Kamarkhanda", "Kazipur", "Rayganj", "Shahjadpur", "Tarash", "Ullapara" } },
                    new() { Name = "Naogaon", Upazilas = new() { "Naogaon Sadar", "Atrai", "Badalgachhi", "Dhamoirhat", "Manda", "Mohadevpur", "Niamatpur", "Patnitala", "Porsha", "Raninagar", "Sapahar" } },
                    new() { Name = "Natore", Upazilas = new() { "Natore Sadar", "Bagatipara", "Baraigram", "Gurudaspur", "Lalpur", "Singra", "Naldanga" } },
                    new() { Name = "Chapai Nawabganj", Upazilas = new() { "Chapai Nawabganj Sadar", "Bholahat", "Gomastapur", "Nachole", "Shibganj" } },
                    new() { Name = "Joypurhat", Upazilas = new() { "Joypurhat Sadar", "Akkelpur", "Kalai", "Khetlal", "Panchbibi" } }
                }
            },
            new()
            {
                Name = "Khulna",
                Districts = new List<DistrictLookupDto>
                {
                    new() { Name = "Khulna", Upazilas = new() { "Khulna Sadar", "Daulatpur", "Khalishpur", "Khan Jahan Ali", "Sonadanga", "Batiaghata", "Dacope", "Dumuria", "Dighalia", "Koyra", "Paikgachha", "Phultala", "Rupsha", "Terokhada" } },
                    new() { Name = "Jashore", Upazilas = new() { "Jashore Sadar", "Abhaynagar", "Bagherpara", "Chaugachha", "Jhikargachha", "Keshabpur", "Manirampur", "Sharsha" } },
                    new() { Name = "Kushtia", Upazilas = new() { "Kushtia Sadar", "Bheramara", "Daulatpur", "Khoksa", "Kumarkhali", "Mirpur" } },
                    new() { Name = "Satkhira", Upazilas = new() { "Satkhira Sadar", "Assasuni", "Debhata", "Kalaroa", "Kaliganj", "Shyamnagar", "Tala" } },
                    new() { Name = "Bagerhat", Upazilas = new() { "Bagerhat Sadar", "Chitalmari", "Fakirhat", "Kachua", "Mollahat", "Mongla", "Morrelganj", "Rampal", "Sarankhola" } },
                    new() { Name = "Jhenaidah", Upazilas = new() { "Jhenaidah Sadar", "Harinakundu", "Kaliganj", "Kotchandpur", "Maheshpur", "Shailkupa" } },
                    new() { Name = "Chuadanga", Upazilas = new() { "Chuadanga Sadar", "Alamdanga", "Damurhuda", "Jibannagar" } },
                    new() { Name = "Magura", Upazilas = new() { "Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur" } },
                    new() { Name = "Meherpur", Upazilas = new() { "Meherpur Sadar", "Gangni", "Mujibnagar" } },
                    new() { Name = "Narail", Upazilas = new() { "Narail Sadar", "Kalia", "Lohagara" } }
                }
            },
            new()
            {
                Name = "Barishal",
                Districts = new List<DistrictLookupDto>
                {
                    new() { Name = "Barishal", Upazilas = new() { "Barishal Sadar", "Agailjhara", "Babuganj", "Bakerganj", "Banaripara", "Gaurnadi", "Hizla", "Mehendiganj", "Muladi", "Wazirpur" } },
                    new() { Name = "Bhola", Upazilas = new() { "Bhola Sadar", "Burhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin" } },
                    new() { Name = "Patuakhali", Upazilas = new() { "Patuakhali Sadar", "Bauphal", "Dashmina", "Galachipa", "Kalapara", "Mirzaganj", "Rangabali", "Dumki" } },
                    new() { Name = "Pirojpur", Upazilas = new() { "Pirojpur Sadar", "Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur", "Nesarabad", "Zianagar" } },
                    new() { Name = "Barguna", Upazilas = new() { "Barguna Sadar", "Amtali", "Bamna", "Betagi", "Patharghata", "Taltali" } },
                    new() { Name = "Jhalokathi", Upazilas = new() { "Jhalokathi Sadar", "Kathalia", "Nalchhiti", "Rajapur" } }
                }
            },
            new()
            {
                Name = "Sylhet",
                Districts = new List<DistrictLookupDto>
                {
                    new() { Name = "Sylhet", Upazilas = new() { "Sylhet Sadar", "Balaganj", "Beanibazar", "Bishwanath", "Companiganj", "Fenchuganj", "Golapganj", "Gowainghat", "Jaintiapur", "Kanaighat", "Zakiganj", "South Surma", "Osmani Nagar" } },
                    new() { Name = "Moulvibazar", Upazilas = new() { "Moulvibazar Sadar", "Barlekha", "Juri", "Kamalganj", "Kulaura", "Rajnagar", "Sreemangal" } },
                    new() { Name = "Habiganj", Upazilas = new() { "Habiganj Sadar", "Ajmiriganj", "Bahubal", "Baniachong", "Chunarughat", "Lakhai", "Madhabpur", "Nabiganj", "Sayestaganj" } },
                    new() { Name = "Sunamganj", Upazilas = new() { "Sunamganj Sadar", "Bishwamvarpur", "Chhatak", "Derai", "Dharampasha", "Dowarabazar", "Jagannathpur", "Jamalganj", "Shalla", "South Sunamganj", "Tahirpur" } }
                }
            },
            new()
            {
                Name = "Rangpur",
                Districts = new List<DistrictLookupDto>
                {
                    new() { Name = "Rangpur", Upazilas = new() { "Rangpur Sadar", "Badarganj", "Gangachhara", "Kaunia", "Mithapukur", "Pirgachha", "Pirganj", "Taraganj" } },
                    new() { Name = "Dinajpur", Upazilas = new() { "Dinajpur Sadar", "Birampur", "Birganj", "Biral", "Bochaganj", "Chirirbandar", "Phulbari", "Ghoraghat", "Hakimpur", "Kaharole", "Khansama", "Nawabganj", "Parbatipur" } },
                    new() { Name = "Kurigram", Upazilas = new() { "Kurigram Sadar", "Bhurungamari", "Char Rajibpur", "Chilmari", "Phulbari", "Nageshwari", "Rajarhat", "Raomari", "Ulipur" } },
                    new() { Name = "Gaibandha", Upazilas = new() { "Gaibandha Sadar", "Fulchhari", "Gobindaganj", "Palashbari", "Sadullapur", "Saghata", "Sundarganj" } },
                    new() { Name = "Nilphamari", Upazilas = new() { "Nilphamari Sadar", "Dimla", "Domar", "Jaldhaka", "Kishoreganj", "Syedpur" } },
                    new() { Name = "Thakurgaon", Upazilas = new() { "Thakurgaon Sadar", "Baliadangi", "Haripur", "Pirganj", "Ranisankail" } },
                    new() { Name = "Lalmonirhat", Upazilas = new() { "Lalmonirhat Sadar", "Aditmari", "Kaliganj", "Hatibandha", "Patgram" } },
                    new() { Name = "Panchagarh", Upazilas = new() { "Panchagarh Sadar", "Atwari", "Boda", "Debiganj", "Tetulia" } }
                }
            },
            new()
            {
                Name = "Mymensingh",
                Districts = new List<DistrictLookupDto>
                {
                    new() { Name = "Mymensingh", Upazilas = new() { "Mymensingh Sadar", "Bhaluka", "Dhobaura", "Fulbaria", "Gafargaon", "Gauripur", "Haluaghat", "Ishwarganj", "Muktagachha", "Nandail", "Phulpur", "Trishal", "Tara Khanda" } },
                    new() { Name = "Jamalpur", Upazilas = new() { "Jamalpur Sadar", "Baksiganj", "Dewanganj", "Islampur", "Madarganj", "Melandaha", "Sarishabari" } },
                    new() { Name = "Netrokona", Upazilas = new() { "Netrokona Sadar", "Atpara", "Barhatta", "Durgapur", "Khaliajuri", "Kalmakanda", "Kendua", "Madan", "Mohanganj", "Purbadhala" } },
                    new() { Name = "Sherpur", Upazilas = new() { "Sherpur Sadar", "Jhenaigati", "Nakla", "Nalitabari", "Sreebardi" } }
                }
            }
        };
    }
}
