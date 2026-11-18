using System.Diagnostics;
using System.IO.Compression;
using System.Runtime.InteropServices;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Common.Models;
using SchoolManagement.Application.System.DTOs;
using SchoolManagement.Application.System.Services;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v1/deployment")]
[Authorize(Policy = SchoolManagement.Api.Security.SecurityPolicies.SystemAdministrator)]
public class DeploymentController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private readonly IAuditLogService _auditLogService;
    private readonly IConfiguration _configuration;
    private readonly IHostApplicationLifetime _lifetime;
    private readonly ILogger<DeploymentController> _logger;

    private static readonly DateTime StartTime = DateTime.UtcNow;
    private bool IsDeploymentEnabled => _configuration.GetValue<bool>("FeatureManagement:EnableWebDeployment", false);

    public DeploymentController(
        IWebHostEnvironment environment,
        IAuditLogService auditLogService,
        IConfiguration configuration,
        IHostApplicationLifetime lifetime,
        ILogger<DeploymentController> logger)
    {
        _environment = environment;
        _auditLogService = auditLogService;
        _configuration = configuration;
        _lifetime = lifetime;
        _logger = logger;
    }

    private string GetWebRoot()
    {
        var root = _environment.WebRootPath;
        if (string.IsNullOrWhiteSpace(root))
        {
            root = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }
        if (!Directory.Exists(root))
        {
            Directory.CreateDirectory(root);
        }
        return Path.GetFullPath(root);
    }

    private string GetDeploymentsDirectory()
    {
        var contentRoot = _environment.ContentRootPath;
        var dir = Path.Combine(contentRoot, "deployments");
        if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
        var archives = Path.Combine(dir, "archives");
        if (!Directory.Exists(archives)) Directory.CreateDirectory(archives);
        var backups = Path.Combine(dir, "backups");
        if (!Directory.Exists(backups)) Directory.CreateDirectory(backups);
        var logs = Path.Combine(dir, "logs");
        if (!Directory.Exists(logs)) Directory.CreateDirectory(logs);
        return Path.GetFullPath(dir);
    }

    private string GetManifestPath()
    {
        return Path.Combine(GetDeploymentsDirectory(), "manifest.json");
    }

    private List<DeploymentRecordDto> LoadManifest()
    {
        try
        {
            var path = GetManifestPath();
            if (System.IO.File.Exists(path))
            {
                var json = System.IO.File.ReadAllText(path);
                return JsonSerializer.Deserialize<List<DeploymentRecordDto>>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }) ?? new List<DeploymentRecordDto>();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to read deployment manifest");
        }
        return new List<DeploymentRecordDto>();
    }

    private void SaveManifest(List<DeploymentRecordDto> records)
    {
        try
        {
            var path = GetManifestPath();
            var json = JsonSerializer.Serialize(records, new JsonSerializerOptions
            {
                WriteIndented = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
            System.IO.File.WriteAllText(path, json);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save deployment manifest");
        }
    }

    private void AppendDeployLog(string message)
    {
        try
        {
            var logPath = Path.Combine(GetDeploymentsDirectory(), "logs", "deploy.log");
            var line = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] {message}{Environment.NewLine}";
            System.IO.File.AppendAllText(logPath, line);
        }
        catch {}
    }

    private static string FormatBytes(long bytes)
    {
        if (bytes < 1024) return $"{bytes} B";
        if (bytes < 1024 * 1024) return $"{bytes / 1024.0:F1} KB";
        return $"{bytes / (1024.0 * 1024.0):F2} MB";
    }

    [HttpGet("status")]
    public async Task<ActionResult<ApiResponse<SystemServerStatusDto>>> GetStatus()
    {
        var proc = Process.GetCurrentProcess();
        var uptimeSpan = DateTime.UtcNow - StartTime;
        var uptimeStr = $"{(int)uptimeSpan.TotalHours}h {uptimeSpan.Minutes}m {uptimeSpan.Seconds}s";

        // Check DB ping
        bool dbHealthy = false;
        double dbLatencyMs = 0;
        try
        {
            var sw = Stopwatch.StartNew();
            dbHealthy = await _auditLogService.PingDatabaseAsync();
            sw.Stop();
            dbLatencyMs = Math.Round(sw.Elapsed.TotalMilliseconds, 2);
        }
        catch
        {
            dbHealthy = false;
        }

        var webRoot = GetWebRoot();
        var indexHtmlPath = Path.Combine(webRoot, "index.html");
        bool hasIndex = System.IO.File.Exists(indexHtmlPath);

        long totalSize = 0;
        int fileCount = 0;
        if (Directory.Exists(webRoot))
        {
            var dirInfo = new DirectoryInfo(webRoot);
            foreach (var f in dirInfo.GetFiles("*", SearchOption.AllDirectories))
            {
                // Exclude uploads directory from bundle stats
                if (!f.FullName.Contains(Path.Combine("wwwroot", "uploads")))
                {
                    totalSize += f.Length;
                    fileCount++;
                }
            }
        }

        var manifest = LoadManifest();
        var active = manifest.FirstOrDefault(m => m.Status == "Active");

        var status = new SystemServerStatusDto
        {
            ServerTime = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss UTC"),
            Uptime = uptimeStr,
            MachineName = Environment.MachineName,
            OsDescription = RuntimeInformation.OSDescription,
            DotnetVersion = RuntimeInformation.FrameworkDescription,
            ProcessId = Environment.ProcessId,
            MemoryUsageFormatted = FormatBytes(proc.WorkingSet64),
            DatabaseHealthy = dbHealthy,
            DatabaseName = "school_management (PostgreSQL 18.4)",
            DatabaseLatencyMs = dbLatencyMs,
            FrontendDeployed = hasIndex,
            ActiveFrontendVersion = active?.Version ?? (hasIndex ? "Pre-installed Build" : "Not Deployed"),
            FrontendDeployedAt = active?.DeployedAt.ToString("yyyy-MM-dd HH:mm:ss") ?? (hasIndex ? "Active" : "-"),
            FrontendDeployedBy = active?.DeployedBy ?? (hasIndex ? "System" : "-"),
            FrontendBundleSize = FormatBytes(totalSize),
            AppBaseUrl = "http://localhost:5000/",
            TotalDeployedFiles = fileCount
        };

        return Ok(ApiResponse<SystemServerStatusDto>.Ok(status, "System status retrieved"));
    }

    [HttpGet("history")]
    public ActionResult<ApiResponse<List<DeploymentRecordDto>>> GetHistory()
    {
        var manifest = LoadManifest();
        return Ok(ApiResponse<List<DeploymentRecordDto>>.Ok(manifest, "Deployment history retrieved"));
    }

    [HttpPost("upload-deploy")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<DeploymentRecordDto>>> UploadAndDeploy(
        IFormFile? file,
        [FromForm] string? version,
        [FromForm] string? notes)
    {
        if (!IsDeploymentEnabled)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<DeploymentRecordDto>.Fail("Web-based deployment operations are disabled by system security policy."));
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse<DeploymentRecordDto>.Fail("No zip package provided."));
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext != ".zip")
        {
            return BadRequest(ApiResponse<DeploymentRecordDto>.Fail("Only .zip archives containing the compiled frontend build are supported."));
        }

        var deployDir = GetDeploymentsDirectory();
        var archivesDir = Path.Combine(deployDir, "archives");
        var backupsDir = Path.Combine(deployDir, "backups");
        var webRoot = GetWebRoot();

        var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
        var ver = string.IsNullOrWhiteSpace(version) ? $"deploy_{timestamp}" : version.Trim();
        var zipFileName = $"{ver}_{timestamp}.zip";
        var zipFilePath = Path.Combine(archivesDir, zipFileName);

        // 1. Save uploaded zip archive
        using (var stream = new FileStream(zipFilePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // 2. Backup existing wwwroot if index.html exists
        var currentBackupName = $"backup_pre_{ver}_{timestamp}.zip";
        var currentBackupPath = Path.Combine(backupsDir, currentBackupName);
        BackupWwwroot(webRoot, currentBackupPath);

        // 3. Extract new zip to temp directory
        var tempExtract = Path.Combine(Path.GetTempPath(), $"sms_deploy_{Guid.NewGuid():N}");
        try
        {
            ZipFile.ExtractToDirectory(zipFilePath, tempExtract, overwriteFiles: true);

            // Find where index.html is located in extracted contents
            var indexFiles = Directory.GetFiles(tempExtract, "index.html", SearchOption.AllDirectories);
            if (indexFiles.Length == 0)
            {
                return BadRequest(ApiResponse<DeploymentRecordDto>.Fail("Invalid frontend bundle: 'index.html' was not found in the uploaded archive."));
            }

            var sourceDir = Path.GetDirectoryName(indexFiles[0])!;

            // 4. Clean wwwroot (preserving uploads folder)
            CleanWwwroot(webRoot);

            // 5. Copy new files into wwwroot
            CopyDirectory(sourceDir, webRoot);
        }
        finally
        {
            try { if (Directory.Exists(tempExtract)) Directory.Delete(tempExtract, true); } catch {}
        }

        // 6. Calculate deployed file count & size
        long deployedBytes = 0;
        int deployedFiles = 0;
        var dirInfo = new DirectoryInfo(webRoot);
        foreach (var f in dirInfo.GetFiles("*", SearchOption.AllDirectories))
        {
            if (!f.FullName.Contains(Path.Combine("wwwroot", "uploads")))
            {
                deployedBytes += f.Length;
                deployedFiles++;
            }
        }

        // 7. Update Manifest
        var manifest = LoadManifest();
        foreach (var m in manifest) m.Status = "Archived";

        var record = new DeploymentRecordDto
        {
            Id = Guid.NewGuid().ToString("N")[..8],
            Version = ver,
            ArchiveName = zipFileName,
            DeployedAt = DateTime.UtcNow,
            DeployedBy = "System Administrator",
            FileSizeBytes = deployedBytes,
            FileSizeFormatted = FormatBytes(deployedBytes),
            FileCount = deployedFiles,
            Status = "Active",
            HasIndexHtml = true,
            Notes = notes ?? "Frontend ZIP bundle uploaded and deployed"
        };
        manifest.Insert(0, record);
        SaveManifest(manifest);

        AppendDeployLog($"SUCCESS: Deployed version '{ver}' from archive '{zipFileName}' ({deployedFiles} files, {FormatBytes(deployedBytes)})");

        // Record Audit Log
        try
        {
            await _auditLogService.LogActionAsync("System Administrator", "Super Admin", "Deploy", "Deployment", ver, $"Uploaded & deployed frontend build '{ver}' ({FormatBytes(deployedBytes)})", "ALL");
        }
        catch {}

        return Ok(ApiResponse<DeploymentRecordDto>.Ok(record, $"Frontend version '{ver}' successfully deployed to live hosting!"));
    }

    [HttpPost("build-and-deploy")]
    public async Task<ActionResult<ApiResponse<BuildDeployResultDto>>> BuildAndDeployLocalFrontend()
    {
        if (!IsDeploymentEnabled)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<BuildDeployResultDto>.Fail("Web-based deployment operations are disabled by system security policy."));
        }

        var contentRoot = _environment.ContentRootPath;
        // Locate Fontend directory
        var frontendDir1 = Path.GetFullPath(Path.Combine(contentRoot, "..", "..", "..", "Fontend"));
        var frontendDir2 = Path.GetFullPath(Path.Combine(contentRoot, "..", "..", "Fontend"));
        var frontendDir3 = @"G:\dotnetproject\School_management\Fontend";
        var frontendDir = Directory.Exists(frontendDir1) ? frontendDir1 :
                          Directory.Exists(frontendDir2) ? frontendDir2 : frontendDir3;

        if (!Directory.Exists(frontendDir))
        {
            return BadRequest(ApiResponse<BuildDeployResultDto>.Fail($"Frontend source directory not found at '{frontendDir1}'"));
        }

        AppendDeployLog($"Initiating local frontend build in '{frontendDir}'...");

        var startInfo = new ProcessStartInfo
        {
            FileName = "cmd.exe",
            Arguments = "/c npm run build",
            WorkingDirectory = frontendDir,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        string stdout = "";
        string stderr = "";
        int exitCode = -1;

        using (var proc = new Process { StartInfo = startInfo })
        {
            proc.Start();
            var outTask = proc.StandardOutput.ReadToEndAsync();
            var errTask = proc.StandardError.ReadToEndAsync();
            await Task.WhenAll(outTask, errTask);
            stdout = outTask.Result;
            stderr = errTask.Result;
            await proc.WaitForExitAsync();
            exitCode = proc.ExitCode;
        }

        if (exitCode != 0)
        {
            AppendDeployLog($"ERROR: Frontend build failed with code {exitCode}. Details: {stderr}");
            return BadRequest(ApiResponse<BuildDeployResultDto>.Fail($"Frontend build failed with exit code {exitCode}: {stderr}"));
        }

        // Look for compiled browser output
        var distDir = Path.Combine(frontendDir, "dist", "school-management-frontend", "browser");
        if (!Directory.Exists(distDir))
        {
            distDir = Path.Combine(frontendDir, "dist", "school-management-frontend");
        }

        var indexFile = Path.Combine(distDir, "index.html");
        if (!System.IO.File.Exists(indexFile))
        {
            return BadRequest(ApiResponse<BuildDeployResultDto>.Fail($"Build output index.html not found in '{distDir}'"));
        }

        var webRoot = GetWebRoot();
        var deployDir = GetDeploymentsDirectory();
        var backupsDir = Path.Combine(deployDir, "backups");
        var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
        var ver = $"auto_build_{timestamp}";

        // Backup current
        BackupWwwroot(webRoot, Path.Combine(backupsDir, $"backup_pre_{ver}.zip"));

        // Deploy new files
        CleanWwwroot(webRoot);
        CopyDirectory(distDir, webRoot);

        long deployedBytes = 0;
        int deployedFiles = 0;
        var dirInfo = new DirectoryInfo(webRoot);
        foreach (var f in dirInfo.GetFiles("*", SearchOption.AllDirectories))
        {
            if (!f.FullName.Contains(Path.Combine("wwwroot", "uploads")))
            {
                deployedBytes += f.Length;
                deployedFiles++;
            }
        }

        var manifest = LoadManifest();
        foreach (var m in manifest) m.Status = "Archived";

        var record = new DeploymentRecordDto
        {
            Id = Guid.NewGuid().ToString("N")[..8],
            Version = ver,
            ArchiveName = "Local Angular Pipeline",
            DeployedAt = DateTime.UtcNow,
            DeployedBy = "System Administrator",
            FileSizeBytes = deployedBytes,
            FileSizeFormatted = FormatBytes(deployedBytes),
            FileCount = deployedFiles,
            Status = "Active",
            HasIndexHtml = true,
            Notes = "Compiled from local repository via automated pipeline"
        };
        manifest.Insert(0, record);
        SaveManifest(manifest);

        AppendDeployLog($"SUCCESS: Auto-built and deployed version '{ver}' ({deployedFiles} files, {FormatBytes(deployedBytes)})");

        var result = new BuildDeployResultDto
        {
            Success = true,
            Version = ver,
            Message = $"Compiled and deployed {deployedFiles} files ({FormatBytes(deployedBytes)}) to live web root.",
            DeployedFileCount = deployedFiles,
            TotalSizeFormatted = FormatBytes(deployedBytes),
            DeployedAt = DateTime.UtcNow,
            BuildLog = stdout
        };

        return Ok(ApiResponse<BuildDeployResultDto>.Ok(result, "Frontend successfully built and deployed to live server!"));
    }

    [HttpPost("rollback")]
    public async Task<ActionResult<ApiResponse<bool>>> Rollback([FromBody] RollbackDeploymentRequest request)
    {
        if (!IsDeploymentEnabled)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<bool>.Fail("Web-based deployment operations are disabled by system security policy."));
        }

        var manifest = LoadManifest();
        var target = manifest.FirstOrDefault(m => m.Id == request.DeploymentId || m.Version == request.DeploymentId);
        if (target == null)
        {
            return NotFound(ApiResponse<bool>.Fail("Deployment snapshot record not found."));
        }

        var deployDir = GetDeploymentsDirectory();
        var backupsDir = Path.Combine(deployDir, "backups");
        var archivesDir = Path.Combine(deployDir, "archives");

        // Find archive file
        var archiveFile = Path.Combine(archivesDir, target.ArchiveName);
        if (!System.IO.File.Exists(archiveFile))
        {
            // Try backup file matching version
            var candidateBackups = Directory.GetFiles(backupsDir, $"*{target.Version}*.zip");
            if (candidateBackups.Length > 0) archiveFile = candidateBackups[0];
        }

        if (!System.IO.File.Exists(archiveFile))
        {
            return NotFound(ApiResponse<bool>.Fail($"Deployment archive for version '{target.Version}' is no longer on disk."));
        }

        var webRoot = GetWebRoot();
        CleanWwwroot(webRoot);

        var tempExtract = Path.Combine(Path.GetTempPath(), $"sms_rollback_{Guid.NewGuid():N}");
        try
        {
            ZipFile.ExtractToDirectory(archiveFile, tempExtract, overwriteFiles: true);
            var indexFiles = Directory.GetFiles(tempExtract, "index.html", SearchOption.AllDirectories);
            var sourceDir = indexFiles.Length > 0 ? Path.GetDirectoryName(indexFiles[0])! : tempExtract;
            CopyDirectory(sourceDir, webRoot);
        }
        finally
        {
            try { if (Directory.Exists(tempExtract)) Directory.Delete(tempExtract, true); } catch {}
        }

        foreach (var m in manifest) m.Status = (m.Id == target.Id) ? "Active" : "Archived";
        SaveManifest(manifest);

        AppendDeployLog($"SUCCESS: Rolled back to version '{target.Version}'");

        try
        {
            await _auditLogService.LogActionAsync("System Administrator", "Super Admin", "Rollback", "Deployment", target.Version, $"Rolled back frontend hosting to deployment '{target.Version}'", "ALL");
        }
        catch {}

        return Ok(ApiResponse<bool>.Ok(true, $"Successfully rolled back to version '{target.Version}'!"));
    }

    [HttpPost("restart-server")]
    public ActionResult<ApiResponse<bool>> RestartServer()
    {
        if (!IsDeploymentEnabled)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<bool>.Fail("Web-based deployment operations are disabled by system security policy."));
        }

        AppendDeployLog("NOTICE: Graceful server restart requested from Admin Deployment Center");

        // Trigger asynchronous restart after sending response
        Task.Run(async () =>
        {
            await Task.Delay(1000);
            _lifetime.StopApplication();
        });

        return Ok(ApiResponse<bool>.Ok(true, "Server restart command dispatched. The service is recycling now."));
    }

    [HttpGet("logs")]
    public ActionResult<ApiResponse<List<string>>> GetLogs()
    {
        var logPath = Path.Combine(GetDeploymentsDirectory(), "logs", "deploy.log");
        var lines = new List<string>();
        if (System.IO.File.Exists(logPath))
        {
            lines = System.IO.File.ReadAllLines(logPath).Reverse().Take(100).Reverse().ToList();
        }
        else
        {
            lines.Add($"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] Deployment logging subsystem initialized.");
        }
        return Ok(ApiResponse<List<string>>.Ok(lines, "Deployment logs retrieved"));
    }

    private static void BackupWwwroot(string webRoot, string destinationZip)
    {
        try
        {
            if (!Directory.Exists(webRoot)) return;
            var files = Directory.GetFiles(webRoot, "*", SearchOption.AllDirectories)
                .Where(f => !f.Contains(Path.Combine("wwwroot", "uploads"))).ToList();
            if (files.Count == 0) return;

            var tempDir = Path.Combine(Path.GetTempPath(), $"sms_bck_{Guid.NewGuid():N}");
            Directory.CreateDirectory(tempDir);
            foreach (var file in files)
            {
                var relative = Path.GetRelativePath(webRoot, file);
                var dest = Path.Combine(tempDir, relative);
                var parent = Path.GetDirectoryName(dest);
                if (parent != null && !Directory.Exists(parent)) Directory.CreateDirectory(parent);
                System.IO.File.Copy(file, dest, true);
            }

            if (System.IO.File.Exists(destinationZip)) System.IO.File.Delete(destinationZip);
            ZipFile.CreateFromDirectory(tempDir, destinationZip);
            Directory.Delete(tempDir, true);
        }
        catch {}
    }

    private static void CleanWwwroot(string webRoot)
    {
        if (!Directory.Exists(webRoot)) return;
        var dirInfo = new DirectoryInfo(webRoot);
        foreach (var file in dirInfo.GetFiles())
        {
            try { file.Delete(); } catch {}
        }
        foreach (var subDir in dirInfo.GetDirectories())
        {
            // NEVER delete uploads folder (contains user avatars and documents)
            if (!subDir.Name.Equals("uploads", StringComparison.OrdinalIgnoreCase))
            {
                try { subDir.Delete(true); } catch {}
            }
        }
    }

    private static void CopyDirectory(string sourceDir, string destDir)
    {
        Directory.CreateDirectory(destDir);
        foreach (var file in Directory.GetFiles(sourceDir))
        {
            var destFile = Path.Combine(destDir, Path.GetFileName(file));
            System.IO.File.Copy(file, destFile, true);
        }
        foreach (var sub in Directory.GetDirectories(sourceDir))
        {
            var folderName = Path.GetFileName(sub);
            // Skip uploads directory to prevent overwriting
            if (folderName.Equals("uploads", StringComparison.OrdinalIgnoreCase)) continue;
            var destSub = Path.Combine(destDir, folderName);
            CopyDirectory(sub, destSub);
        }
    }
}
