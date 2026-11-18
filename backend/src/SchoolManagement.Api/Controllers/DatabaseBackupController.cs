using System.Diagnostics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.System.DTOs;
using SchoolManagement.Application.System.Services;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/database")]
[Authorize(Policy = SchoolManagement.Api.Security.SecurityPolicies.SystemAdministrator)]
public class DatabaseBackupController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly IAuditLogService _auditLogService;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<DatabaseBackupController> _logger;
    private bool IsBackupEnabled => _configuration.GetValue<bool>("FeatureManagement:EnableWebDatabaseBackup", true);

    public DatabaseBackupController(
        IConfiguration configuration,
        IAuditLogService auditLogService,
        IWebHostEnvironment environment,
        ILogger<DatabaseBackupController> logger)
    {
        _configuration = configuration;
        _auditLogService = auditLogService;
        _environment = environment;
        _logger = logger;
    }

    private string GetBackupDirectory()
    {
        // 1. Check if backend/backups exists in content root
        var contentRoot = _environment.ContentRootPath;
        var dir1 = Path.Combine(contentRoot, "..", "..", "backups");
        var dir2 = Path.Combine(contentRoot, "backups");
        var dir3 = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "backups");

        if (Directory.Exists(dir1)) return Path.GetFullPath(dir1);
        if (Directory.Exists(dir2)) return Path.GetFullPath(dir2);
        if (!Directory.Exists(dir3)) Directory.CreateDirectory(dir3);
        return Path.GetFullPath(dir3);
    }

    private (string host, int port, string database, string username, string password) GetConnectionParams()
    {
        var connStr = _configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=school_management;Username=postgres;Password=123456";

        try
        {
            var builder = new NpgsqlConnectionStringBuilder(connStr);
            return (
                builder.Host ?? "localhost",
                builder.Port > 0 ? builder.Port : 5432,
                builder.Database ?? "school_management",
                builder.Username ?? "postgres",
                builder.Password ?? "123456"
            );
        }
        catch
        {
            return ("localhost", 5432, "school_management", "postgres", "123456");
        }
    }

    private string FindPostgresExecutable(string executableName)
    {
        string[] candidates = {
            $@"C:\Program Files\PostgreSQL\18\bin\{executableName}.exe",
            $@"C:\Program Files\PostgreSQL\17\bin\{executableName}.exe",
            $@"C:\Program Files\PostgreSQL\16\bin\{executableName}.exe",
            $@"C:\Program Files\PostgreSQL\15\bin\{executableName}.exe",
            $@"C:\Program Files (x86)\PostgreSQL\18\bin\{executableName}.exe"
        };

        foreach (var path in candidates)
        {
            if (System.IO.File.Exists(path)) return path;
        }

        return executableName;
    }

    private static string FormatBytes(long bytes)
    {
        if (bytes < 1024) return $"{bytes} B";
        if (bytes < 1024 * 1024) return $"{bytes / 1024.0:F1} KB";
        return $"{bytes / (1024.0 * 1024.0):F2} MB";
    }

    [HttpGet("backups")]
    public ActionResult<ApiResponse<List<DatabaseBackupDto>>> GetBackups()
    {
        try
        {
            var backupDir = GetBackupDirectory();
            var directoryInfo = new DirectoryInfo(backupDir);

            if (!directoryInfo.Exists)
            {
                return Ok(ApiResponse<List<DatabaseBackupDto>>.Ok(new List<DatabaseBackupDto>()));
            }

            var files = directoryInfo.GetFiles("*.sql")
                .OrderByDescending(f => f.LastWriteTimeUtc)
                .Select(f => new DatabaseBackupDto
                {
                    FileName = f.Name,
                    FileSizeBytes = f.Length,
                    FileSizeFormatted = FormatBytes(f.Length),
                    CreatedAt = f.LastWriteTime,
                    Type = "SQL",
                    Status = "Completed"
                })
                .ToList();

            return Ok(ApiResponse<List<DatabaseBackupDto>>.Ok(files, "Backup archives retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve database backups");
            return StatusCode(500, ApiResponse<List<DatabaseBackupDto>>.Fail(ex.Message, "Failed to retrieve backups"));
        }
    }

    [HttpPost("backup")]
    public async Task<ActionResult<ApiResponse<DatabaseBackupDto>>> CreateBackup()
    {
        if (!IsBackupEnabled)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<DatabaseBackupDto>.Fail("Web-based database backup operations are disabled by system security policy."));
        }

        try
        {
            var backupDir = GetBackupDirectory();
            var timestamp = DateTime.Now.ToString("yyyy-MM-dd_HH-mm-ss");
            var fileName = $"school_management_backup_{timestamp}.sql";
            var filePath = Path.Combine(backupDir, fileName);

            var (host, port, database, username, password) = GetConnectionParams();
            var pgDump = FindPostgresExecutable("pg_dump");

            var startInfo = new ProcessStartInfo
            {
                FileName = pgDump,
                Arguments = $"-h {host} -p {port} -U {username} -d {database} --clean --if-exists -F p -f \"{filePath}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            startInfo.EnvironmentVariables["PGPASSWORD"] = password;

            using var process = new Process { StartInfo = startInfo };
            process.Start();

            var stderr = await process.StandardError.ReadToEndAsync();
            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                _logger.LogError("pg_dump failed with exit code {ExitCode}: {Stderr}", process.ExitCode, stderr);
                return BadRequest(ApiResponse<DatabaseBackupDto>.Fail($"Backup process error: {stderr}"));
            }

            var fileInfo = new FileInfo(filePath);

            // Record Audit Log
            try
            {
                await _auditLogService.LogActionAsync("System Admin", "Super Admin", "Create", "Database", fileName, $"Full PostgreSQL backup created ({FormatBytes(fileInfo.Length)})", "ALL");
            }
            catch
            {
                // Non-critical audit log failure
            }

            var result = new DatabaseBackupDto
            {
                FileName = fileInfo.Name,
                FileSizeBytes = fileInfo.Length,
                FileSizeFormatted = FormatBytes(fileInfo.Length),
                CreatedAt = fileInfo.LastWriteTime,
                Type = "SQL",
                Status = "Completed"
            };

            return Ok(ApiResponse<DatabaseBackupDto>.Ok(result, "Database backup archive created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception during database backup execution");
            return StatusCode(500, ApiResponse<DatabaseBackupDto>.Fail(ex.Message, "Backup execution failed"));
        }
    }

    [HttpGet("backups/{fileName}/download")]
    public IActionResult DownloadBackup(string fileName)
    {
        var safeFileName = Path.GetFileName(fileName);
        var backupDir = GetBackupDirectory();
        var filePath = Path.Combine(backupDir, safeFileName);

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound(ApiResponse<string>.Fail("Requested backup file not found on server"));
        }

        var fileBytes = System.IO.File.ReadAllBytes(filePath);
        return File(fileBytes, "application/sql", safeFileName);
    }

    [HttpPost("restore")]
    public async Task<ActionResult<ApiResponse<object>>> RestoreBackup([FromBody] RestoreBackupRequest request)
    {
        if (!IsBackupEnabled)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail("Web-based database restore operations are disabled by system security policy."));
        }

        if (string.IsNullOrWhiteSpace(request?.FileName))
        {
            return BadRequest(ApiResponse<object>.Fail("File name is required for database restoration"));
        }

        var safeFileName = Path.GetFileName(request.FileName);
        var backupDir = GetBackupDirectory();
        var filePath = Path.Combine(backupDir, safeFileName);

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound(ApiResponse<object>.Fail($"Backup file '{safeFileName}' does not exist on server"));
        }

        try
        {
            var (host, port, database, username, password) = GetConnectionParams();
            var psql = FindPostgresExecutable("psql");

            // 1. Flush and close all idle pooled connections before dropping schema
            NpgsqlConnection.ClearAllPools();

            // 2. Pre-clean application schemas with CASCADE so that any SQL backup (clean or uncleaned dump)
            // can recreate tables and copy data cleanly without relation collision or duplicate key errors.
            var dropSql = "DROP SCHEMA IF EXISTS academic, attendance, auth, employee, exam, finance, school, student, system CASCADE;";
            var cleanStartInfo = new ProcessStartInfo
            {
                FileName = psql,
                Arguments = $"-h {host} -p {port} -U {username} -d {database} -c \"{dropSql}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            cleanStartInfo.EnvironmentVariables["PGPASSWORD"] = password;

            using (var cleanProcess = new Process { StartInfo = cleanStartInfo })
            {
                cleanProcess.Start();
                await cleanProcess.WaitForExitAsync();
            }

            // 3. Restore the target snapshot SQL file
            var startInfo = new ProcessStartInfo
            {
                FileName = psql,
                Arguments = $"-h {host} -p {port} -U {username} -d {database} -f \"{filePath}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            startInfo.EnvironmentVariables["PGPASSWORD"] = password;

            using var process = new Process { StartInfo = startInfo };
            process.Start();

            var stderr = await process.StandardError.ReadToEndAsync();
            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                _logger.LogWarning("psql restore finished with exit code {ExitCode}: {Stderr}", process.ExitCode, stderr);
            }

            // 4. Clear connection pools again so subsequent queries open fresh connections to restored data
            NpgsqlConnection.ClearAllPools();

            // Record Audit Log
            try
            {
                await _auditLogService.LogActionAsync("System Admin", "Super Admin", "Update", "Database", safeFileName, $"Database restored from backup snapshot '{safeFileName}'", "ALL");
            }
            catch
            {
                // Non-critical audit log failure
            }

            return Ok(ApiResponse<object>.Ok(new
            {
                fileName = safeFileName,
                restoredAt = DateTime.UtcNow,
                status = "Restored"
            }, $"Database restored successfully from '{safeFileName}'"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to restore database from {FileName}", safeFileName);
            return StatusCode(500, ApiResponse<object>.Fail(ex.Message, "Database restore failed"));
        }
    }

    [HttpDelete("backups/{fileName}")]
    public IActionResult DeleteBackup(string fileName)
    {
        if (!IsBackupEnabled)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<bool>.Fail("Web-based database deletion operations are disabled by system security policy."));
        }

        var safeFileName = Path.GetFileName(fileName);
        var backupDir = GetBackupDirectory();
        var filePath = Path.Combine(backupDir, safeFileName);

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound(ApiResponse<bool>.Fail("Backup archive not found"));
        }

        try
        {
            System.IO.File.Delete(filePath);
            return Ok(ApiResponse<bool>.Ok(true, $"Backup archive '{safeFileName}' deleted successfully"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<bool>.Fail(ex.Message, "Failed to delete backup file"));
        }
    }
}
