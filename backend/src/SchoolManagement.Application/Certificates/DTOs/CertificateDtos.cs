namespace SchoolManagement.Application.Certificates.DTOs;

public class CertificateTypeDto
{
    public string Code { get; set; } = string.Empty;
    public string TitleEnglish { get; set; } = string.Empty;
    public string TitleBangla { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class GenerateCertificateRequest
{
    public string StudentId { get; set; } = string.Empty;
    public string CertificateType { get; set; } = "Testimonial"; // TransferCertificate, Testimonial, Bonafide, MeritCertificate
    public string? ReferenceNo { get; set; }
    public DateTime? IssueDate { get; set; }
    public string? Conduct { get; set; } = "Satisfactory";
    public string? ReasonForLeaving { get; set; }
    public string? ExamPassed { get; set; }
    public string? GpaOrMarks { get; set; }
    public string? CustomRemarks { get; set; }
}

public class CertificateDossierDto
{
    public string CertificateNo { get; set; } = string.Empty;
    public string CertificateType { get; set; } = string.Empty;
    public string TypeTitleEnglish { get; set; } = string.Empty;
    public string TypeTitleBangla { get; set; } = string.Empty;
    public string IssueDate { get; set; } = string.Empty;

    // School Details
    public string SchoolName { get; set; } = string.Empty;
    public string SchoolAddress { get; set; } = string.Empty;
    public string CampusName { get; set; } = string.Empty;
    public string EiinNo { get; set; } = "DMSC-101";
    public string Affiliation { get; set; } = "Dhaka Education Board";

    // Student Details
    public string StudentId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? BanglaName { get; set; }
    public string AdmissionNo { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string AcademicSession { get; set; } = string.Empty;
    public string? DateOfBirth { get; set; }
    public string? FatherName { get; set; }
    public string? MotherName { get; set; }
    public string? Address { get; set; }
    public string? Avatar { get; set; }

    // Academic & Conduct Details
    public string Conduct { get; set; } = "Satisfactory";
    public string? ReasonForLeaving { get; set; }
    public string? ExamPassed { get; set; }
    public string? GpaOrMarks { get; set; }
    public string? CustomRemarks { get; set; }

    // Pre-formatted Official Text Paragraphs
    public string ParagraphEnglish { get; set; } = string.Empty;
    public string ParagraphBangla { get; set; } = string.Empty;

    // Security & Signatures
    public string SecurityVerificationCode { get; set; } = string.Empty;
    public string SignatoryHeadTitle { get; set; } = "Principal & Head of Institution";
    public string SignatoryTeacherTitle { get; set; } = "Class Teacher / Registrar";
}
