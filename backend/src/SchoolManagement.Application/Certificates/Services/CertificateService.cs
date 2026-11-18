using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Certificates.DTOs;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Domain.System;

namespace SchoolManagement.Application.Certificates.Services;

public class CertificateService : ICertificateService
{
    private readonly IApplicationDbContext _context;
    private readonly ICampusContext _campusContext;

    public CertificateService(IApplicationDbContext context, ICampusContext campusContext)
    {
        _context = context;
        _campusContext = campusContext;
    }

    public List<CertificateTypeDto> GetCertificateTypes()
    {
        return new List<CertificateTypeDto>
        {
            new()
            {
                Code = "TransferCertificate",
                TitleEnglish = "Transfer Certificate (ছাড়পত্র)",
                TitleBangla = "বিদ্যালয় পরিত্যাগের ছাড়পত্র (টি.সি.)",
                Description = "Official clearance certificate issued when a student transfers or departs from the institution."
            },
            new()
            {
                Code = "Testimonial",
                TitleEnglish = "Character Certificate & Testimonial (প্রশংসাপত্র)",
                TitleBangla = "চারিত্রিক প্রশংসাপত্র ও প্রত্যয়নপত্র",
                Description = "Academic testimonial certifying moral character, discipline, and examination credentials."
            },
            new()
            {
                Code = "Bonafide",
                TitleEnglish = "Bonafide Student Certificate (অধ্যয়নরত প্রত্যয়নপত্র)",
                TitleBangla = "নিয়মিত অধ্যয়নরত প্রত্যয়নপত্র",
                Description = "Institutional certification verifying current active enrollment for passport, visa, or scholarships."
            },
            new()
            {
                Code = "MeritCertificate",
                TitleEnglish = "Certificate of Academic Distinction (মেধা সনদপত্র)",
                TitleBangla = "মেধা ও শিক্ষাগত কৃতিত্ব সনদপত্র",
                Description = "Special honor certificate awarded for exceptional academic rank and top examination performance."
            }
        };
    }

    public async Task<CertificateDossierDto> GenerateCertificateAsync(GenerateCertificateRequest request, string issuedBy)
    {
        var student = await _context.Students.FindAsync(request.StudentId);
        if (student == null)
        {
            throw new KeyNotFoundException($"Student with ID '{request.StudentId}' not found.");
        }

        var school = await _context.Schools.FirstOrDefaultAsync();
        var schoolName = school?.Name ?? "Scholars International Academy";
        var schoolAddress = school?.Address ?? "Plot 14, Road 2, Block-E, Dhaka 1212, Bangladesh";

        var branch = await _context.Branches.FirstOrDefaultAsync(b => b.Id == student.BranchId);
        var campusName = branch?.Name ?? "Main Campus";

        var issueDate = request.IssueDate ?? DateTime.UtcNow;
        var dateFormatted = issueDate.ToString("dd MMMM, yyyy");

        var certType = string.IsNullOrWhiteSpace(request.CertificateType) ? "Testimonial" : request.CertificateType;
        var typeInfo = GetCertificateTypes().FirstOrDefault(t => t.Code.Equals(certType, StringComparison.OrdinalIgnoreCase))
                       ?? GetCertificateTypes()[1];

        // Unique Institutional Serial
        var refCode = certType switch
        {
            "TransferCertificate" => "TC",
            "Bonafide" => "BON",
            "MeritCertificate" => "MRT",
            _ => "TST"
        };
        var randomSuffix = RandomNumberGenerator.GetInt32(1000, 9999);
        var certNo = !string.IsNullOrWhiteSpace(request.ReferenceNo)
            ? request.ReferenceNo
            : $"SIA/{refCode}/{issueDate.Year}/{student.BranchId.ToUpper()}-{randomSuffix}";

        // Security Hash
        var rawKey = $"{certNo}:{student.AdmissionNo}:{issueDate:yyyyMMdd}:{student.Id}";
        using var sha = SHA256.Create();
        var hashBytes = sha.ComputeHash(Encoding.UTF8.GetBytes(rawKey));
        var verificationCode = Convert.ToHexString(hashBytes)[..12];

        // Format Paragraphs
        var dobStr = student.DateOfBirth.ToString("dd MMMM, yyyy");
        var father = string.IsNullOrWhiteSpace(student.FatherName) ? "Guardian" : student.FatherName;
        var mother = string.IsNullOrWhiteSpace(student.MotherName) ? "Guardian" : student.MotherName;
        var addr = string.IsNullOrWhiteSpace(student.PresentAddress) ? "Dhaka, Bangladesh" : student.PresentAddress;
        var session = string.IsNullOrWhiteSpace(student.AcademicYearId) ? "2026 - 2027" : student.AcademicYearId;
        var conduct = string.IsNullOrWhiteSpace(request.Conduct) ? "Satisfactory" : request.Conduct;
        var exam = string.IsNullOrWhiteSpace(request.ExamPassed) ? "Annual Academic Examination" : request.ExamPassed;
        var gpa = string.IsNullOrWhiteSpace(request.GpaOrMarks) ? "5.00" : request.GpaOrMarks;
        var reason = string.IsNullOrWhiteSpace(request.ReasonForLeaving) ? "Guardian's Occupational Relocation" : request.ReasonForLeaving;

        string pEng;
        string pBng;

        switch (certType)
        {
            case "TransferCertificate":
                pEng = $"This is to certify that {student.FullName}, Son/Daughter of {father} and {mother}, residing at {addr}, was a bonafide student of this institution in {student.ClassName}, Section {student.SectionName}, Class Roll No. {student.RollNo}, Admission No. {student.AdmissionNo}. He/She has cleared all institutional tuition dues up to date. To the best of our knowledge, he/she bears an {conduct.ToLower()} moral character. He/She is leaving the institution due to: \"{reason}\". We wish the student all success in future academic endeavors.";
                pBng = $"এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, {student.BanglaName ?? student.FullName}, পিতা: {father}, মাতা: {mother}, বর্তমান ঠিকানা: {addr}; অত্র বিদ্যালয়ের {student.ClassName} শ্রেণির {student.SectionName} শাখার একজন নিয়মিত শিক্ষার্থী ছিল। তার শ্রেণি রোল নং {student.RollNo} এবং ভর্তি নং {student.AdmissionNo}। বিদ্যালয়ের যাবতীয় বেতন ও অন্যান্য পাওনাদি পরিশোধিত রয়েছে। তার আচরণ ও নৈতিক চরিত্র {conduct}। অভিভাবকের আবেদনের প্রেক্ষিতে (কারণ: {reason}) তাকে অত্র বিদ্যালয় ত্যাগের ছাড়পত্র (Transfer Certificate) প্রদান করা হলো। আমরা তার উজ্জ্বল ভবিষ্যৎ কামনা করি।";
                break;

            case "Bonafide":
                pEng = $"This is to certify that {student.FullName}, Son/Daughter of {father} and {mother}, is a bonafide and actively enrolled regular student of {schoolName} ({campusName}) in {student.ClassName}, Section {student.SectionName}, Class Roll No. {student.RollNo}, Admission No. {student.AdmissionNo} for the academic session {session}. As per the institutional admission register, his/her recorded Date of Birth is {dobStr}.";
                pBng = $"এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, {student.BanglaName ?? student.FullName}, পিতা: {father}, মাতা: {mother}; অত্র {schoolName}-এর {campusName} ক্যাম্পাসে {session} শিক্ষাবর্ষে {student.ClassName} শ্রেণির {student.SectionName} শাখায় নিয়মিত অধ্যয়নরত আছে। ভর্তি রেজিস্টার অনুযায়ী তার জন্ম তারিখ: {dobStr}। সে অত্র প্রতিষ্ঠানের একজন নিয়মিত শিক্ষার্থী।";
                break;

            case "MeritCertificate":
                pEng = $"This Certificate of Academic Distinction is proudly conferred upon {student.FullName}, Class Roll No. {student.RollNo}, in recognition of outstanding scholastic excellence, high academic merit, and exemplary discipline demonstrated in {exam}, securing a remarkable Grade Point Average (GPA) of {gpa} on a 5.00 scale.";
                pBng = $"মেধা ও শিক্ষাগত কৃতিত্বের স্বীকৃতিস্বরূপ এই প্রশংসাপত্রটি গৌরবময়ভাবে {student.BanglaName ?? student.FullName}-কে প্রদান করা হলো। সে {exam}-এ কৃতিত্বপূর্ণ ফলাফল প্রদর্শনপূর্বক জিপিএ {gpa} অর্জন করেছে। তার এই অসাধারণ সাফল্য ও নিষ্ঠার জন্য তাকে উষ্ণ অভিনন্দন জানানো হচ্ছে।";
                break;

            case "Testimonial":
            default:
                pEng = $"This is to certify that {student.FullName}, Son/Daughter of {father} and {mother}, was a regular student of {schoolName}. During the tenure of his/her academic study at this institution, he/she maintained an {conduct.ToLower()} moral character and exemplary civic discipline. He/She appeared in / completed {exam} securing GPA {gpa}. To the best of our institutional records, he/she did not participate in any subversive or antisocial activities.";
                pBng = $"এই মর্মে চারিত্রিক প্রশংসাপত্র প্রদান করা যাচ্ছে যে, {student.BanglaName ?? student.FullName}, পিতা: {father}, মাতা: {mother}; অত্র বিদ্যালয়ের একজন নিয়মিত শিক্ষার্থী ছিল। অধ্যয়নকালে তার স্বভাব-চরিত্র ও নৈতিক আচার-আচরণ অত্যন্ত সন্তোষজনক ছিল। সে {exam}-এ অংশগ্রহণ করে জিপিএ {gpa} অর্জন করেছে। আমাদের জানা মতে, সে বিদ্যালয় বা রাষ্ট্রবিরোধী কোনো কার্যকলাপে জড়িত ছিল না।";
                break;
        }

        // Audit Log
        _context.AuditLogs.Add(new AuditLog
        {
            Timestamp = DateTime.UtcNow,
            UserName = issuedBy,
            UserRole = "Staff",
            Action = "GenerateCertificate",
            Module = "Certificate Engine",
            TargetRecord = certNo,
            Details = $"Issued {typeInfo.TitleEnglish} for student '{student.FullName}' ({student.AdmissionNo}) - Ref: {certNo}",
            SchoolScope = student.BranchId
        });

        await _context.SaveChangesAsync();

        return new CertificateDossierDto
        {
            CertificateNo = certNo,
            CertificateType = certType,
            TypeTitleEnglish = typeInfo.TitleEnglish,
            TypeTitleBangla = typeInfo.TitleBangla,
            IssueDate = dateFormatted,
            SchoolName = schoolName,
            SchoolAddress = schoolAddress,
            CampusName = campusName,
            EiinNo = "DMSC-101",
            Affiliation = "Dhaka Education Board & Ministry of Education",
            StudentId = student.Id,
            FullName = student.FullName,
            BanglaName = student.BanglaName,
            AdmissionNo = student.AdmissionNo,
            RollNo = student.RollNo,
            ClassName = student.ClassName,
            SectionName = student.SectionName,
            AcademicSession = session,
            DateOfBirth = dobStr,
            FatherName = father,
            MotherName = mother,
            Address = addr,
            Avatar = string.IsNullOrWhiteSpace(student.PhotoUrl) ? "assets/default-avatar.png" : student.PhotoUrl,
            Conduct = conduct,
            ReasonForLeaving = reason,
            ExamPassed = exam,
            GpaOrMarks = gpa,
            CustomRemarks = request.CustomRemarks,
            ParagraphEnglish = pEng,
            ParagraphBangla = pBng,
            SecurityVerificationCode = verificationCode,
            SignatoryHeadTitle = "Principal & Head of Institution",
            SignatoryTeacherTitle = "Class Teacher / Registrar"
        };
    }

    public async Task<List<CertificateDossierDto>> GetIssuedCertificatesAsync(string? studentId)
    {
        var logsQuery = _context.AuditLogs.AsNoTracking()
            .Where(l => l.Module == "Certificate Engine" && l.Action == "GenerateCertificate");

        if (!string.IsNullOrEmpty(studentId))
        {
            logsQuery = logsQuery.Where(l => l.Details.Contains(studentId));
        }

        var logs = await logsQuery.OrderByDescending(l => l.Timestamp).Take(50).ToListAsync();

        return logs.Select(l => new CertificateDossierDto
        {
            CertificateNo = l.TargetRecord,
            IssueDate = l.Timestamp.ToString("dd MMM yyyy, hh:mm tt"),
            CustomRemarks = l.Details,
            SecurityVerificationCode = l.TargetRecord.Length > 8 ? l.TargetRecord[^8..] : "VERIFIED"
        }).ToList();
    }
}
