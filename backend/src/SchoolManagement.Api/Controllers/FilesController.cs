using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.Common.Interfaces;
using Microsoft.AspNetCore.StaticFiles;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private readonly ICampusContext _campus;

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf", ".doc", ".docx", ".xls", ".xlsx"
    };

    private const long MaxFileSize = 30 * 1024 * 1024; // 30 MB

    public FilesController(IWebHostEnvironment environment, ICampusContext campus)
    {
        _environment = environment;
        _campus = campus;
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<FileUploadResultDto>>> Upload(IFormFile? file, [FromForm] string? folder)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse<FileUploadResultDto>.Fail("No file provided for upload."));
        }

        if (file.Length > MaxFileSize)
        {
            return BadRequest(ApiResponse<FileUploadResultDto>.Fail("File size exceeds 10MB limit."));
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext))
        {
            return BadRequest(ApiResponse<FileUploadResultDto>.Fail($"Unsupported file format '{ext}'. Allowed: images, PDFs, and documents."));
        }

        var subFolder = "general";
        if (!string.IsNullOrWhiteSpace(folder))
        {
            var cleaned = folder.Trim().ToLowerInvariant();
            if (!System.Text.RegularExpressions.Regex.IsMatch(cleaned, "^[a-z0-9_-]{1,40}$"))
                return BadRequest(ApiResponse<FileUploadResultDto>.Fail("Invalid upload folder."));
            subFolder = cleaned;
        }

        var uploadDir = Path.Combine(GetCampusStorage(), subFolder);
        if (!Directory.Exists(uploadDir))
        {
            Directory.CreateDirectory(uploadDir);
        }

        var uniqueName = $"{Guid.NewGuid():N}{ext}";
        var physicalPath = Path.Combine(uploadDir, uniqueName);

        using (var stream = new FileStream(physicalPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var relativeUrl = $"/api/v1/files/content/{subFolder}/{uniqueName}";

        var result = new FileUploadResultDto
        {
            Url = relativeUrl,
            FileName = file.FileName,
            FileSizeBytes = file.Length,
            ContentType = file.ContentType
        };

        return Ok(ApiResponse<FileUploadResultDto>.Ok(result, "File uploaded successfully"));
    }

    private string GetCampusStorage()
    {
        if (!_campus.IsResolved || string.IsNullOrEmpty(_campus.BranchId))
            throw new UnauthorizedAccessException("Select a campus first.");
        // Encode IDs so even unusual database IDs cannot alter filesystem paths.
        var school = Convert.ToHexString(System.Text.Encoding.UTF8.GetBytes(_campus.SchoolId));
        var branch = Convert.ToHexString(System.Text.Encoding.UTF8.GetBytes(_campus.BranchId));
        return Path.Combine(_environment.ContentRootPath, "storage", "campus-uploads", school, branch);
    }

    [HttpGet("content/{folder}/{fileName}")]
    public IActionResult Read(string folder, string fileName)
    {
        if (!System.Text.RegularExpressions.Regex.IsMatch(folder, "^[a-z0-9_-]{1,40}$")
            || !System.Text.RegularExpressions.Regex.IsMatch(fileName, "^[a-fA-F0-9]{32}\\.[a-zA-Z0-9]+$")) return NotFound();
        var path = Path.Combine(GetCampusStorage(), folder, fileName);
        if (!System.IO.File.Exists(path)) return NotFound();
        new FileExtensionContentTypeProvider().TryGetContentType(fileName, out var contentType);
        Response.Headers.CacheControl = "private, no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return PhysicalFile(path, contentType ?? "application/octet-stream");
    }

}

public class FileUploadResultDto
{
    public string Url { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string ContentType { get; set; } = string.Empty;
}
