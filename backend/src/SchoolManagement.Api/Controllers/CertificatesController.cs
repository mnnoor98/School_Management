using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Certificates.DTOs;
using SchoolManagement.Application.Certificates.Services;
using SchoolManagement.Application.Common.Interfaces;
using SchoolManagement.Application.Common.Models;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class CertificatesController : ControllerBase
{
    private readonly ICertificateService _certificateService;
    private readonly ICurrentUserService _currentUser;
    private readonly IStudentAccessService _studentAccess;

    public CertificatesController(
        ICertificateService certificateService,
        ICurrentUserService currentUser,
        IStudentAccessService studentAccess)
    {
        _certificateService = certificateService;
        _currentUser = currentUser;
        _studentAccess = studentAccess;
    }

    [HttpGet("types")]
    public ActionResult<ApiResponse<List<CertificateTypeDto>>> GetCertificateTypes()
    {
        var types = _certificateService.GetCertificateTypes();
        return Ok(ApiResponse<List<CertificateTypeDto>>.Ok(types));
    }

    [HttpPost("generate")]
    public async Task<ActionResult<ApiResponse<CertificateDossierDto>>> GenerateCertificate([FromBody] GenerateCertificateRequest request)
    {
        if (await _studentAccess.IsRestrictedUserAsync())
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(request.StudentId))
        {
            return BadRequest(ApiResponse<CertificateDossierDto>.Fail("StudentId is required."));
        }

        try
        {
            var issuedBy = _currentUser.UserId ?? "Administrator";
            var result = await _certificateService.GenerateCertificateAsync(request, issuedBy);
            return Ok(ApiResponse<CertificateDossierDto>.Ok(result, "Certificate generated successfully."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<CertificateDossierDto>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<CertificateDossierDto>.Fail(ex.Message));
        }
    }

    [HttpGet("issued")]
    public async Task<ActionResult<ApiResponse<List<CertificateDossierDto>>>> GetIssuedCertificates([FromQuery] string? studentId)
    {
        var list = await _certificateService.GetIssuedCertificatesAsync(studentId);
        return Ok(ApiResponse<List<CertificateDossierDto>>.Ok(list));
    }
}
