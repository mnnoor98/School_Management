using SchoolManagement.Application.Certificates.DTOs;

namespace SchoolManagement.Application.Certificates.Services;

public interface ICertificateService
{
    List<CertificateTypeDto> GetCertificateTypes();
    Task<CertificateDossierDto> GenerateCertificateAsync(GenerateCertificateRequest request, string issuedBy);
    Task<List<CertificateDossierDto>> GetIssuedCertificatesAsync(string? studentId);
}
