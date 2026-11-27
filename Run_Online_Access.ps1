$ErrorActionPreference = "Continue"
$Host.UI.RawUI.WindowTitle = "Scholars International Academy - Online Mobile Access (4G/5G Launcher)"

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "     SCHOLARS INTERNATIONAL ACADEMY - ONLINE MOBILE ACCESS LAUNCHER" -ForegroundColor Yellow
Write-Host "              (Cloudflare Secure Tunnel for 4G / 5G Mobile Users)" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (!$scriptDir) { $scriptDir = (Get-Location).Path }
Set-Location $scriptDir

# Clean up any lingering cloudflared processes from previous sessions
Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 1. Start PostgreSQL service if stopped
Write-Host "[*] Checking PostgreSQL Database Service..." -ForegroundColor Gray
$pgServices = @("postgresql-x64-18", "postgresql-x64-17", "postgresql-x64-16", "postgresql-x64-15", "postgresql-x64-14")
foreach ($svcName in $pgServices) {
    $svc = Get-Service -Name $svcName -ErrorAction SilentlyContinue
    if ($svc) {
        if ($svc.Status -ne 'Running') {
            Write-Host "[i] Starting Windows Service $svcName..." -ForegroundColor Yellow
            Start-Service -Name $svcName -ErrorAction SilentlyContinue
        }
        break
    }
}

# 2. Check cloudflared.exe
$cfExe = Join-Path $scriptDir "cloudflared.exe"
if (!(Test-Path $cfExe)) {
    $fallbackPaths = @(
        "G:\dotnetproject\School_management\tools\cloudflared.exe",
        "G:\dotnetproject\School_management\publish\cloudflared.exe",
        "E:\All_project_publish\school_managment\cloudflared.exe",
        "E:\All_project_publish\cloudflared.exe"
    )
    foreach ($p in $fallbackPaths) {
        if (Test-Path $p) {
            Copy-Item $p $cfExe -Force
            break
        }
    }
    if (!(Test-Path $cfExe)) {
        Write-Host "[*] cloudflared.exe not found. Downloading from official Cloudflare repository..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cfExe -UseBasicParsing
    }
}

# 3. Check / Start ERP Server
$isListening = $false
try {
    $client = New-Object System.Net.Sockets.TcpClient
    $iar = $client.BeginConnect("127.0.0.1", 5000, $null, $null)
    $success = $iar.AsyncWaitHandle.WaitOne(800)
    if ($success -and $client.Connected) {
        $client.EndConnect($iar)
        $isListening = $true
    }
    $client.Close()
} catch {}

$erpProcess = $null
if (!$isListening) {
    Write-Host "[*] Initializing School ERP Local Server on Port 5000..." -ForegroundColor Cyan
    $erpExe = Join-Path $scriptDir "SchoolManagement.Api.exe"
    if (Test-Path $erpExe) {
        $erpProcess = Start-Process -FilePath $erpExe -ArgumentList "--urls=http://0.0.0.0:5000" -WorkingDirectory $scriptDir -PassThru -WindowStyle Hidden
    } else {
        $erpProcess = Start-Process -FilePath "dotnet" -ArgumentList "SchoolManagement.Api.dll", "--urls=http://0.0.0.0:5000" -WorkingDirectory $scriptDir -PassThru -WindowStyle Hidden
    }
} else {
    Write-Host "[*] Local ERP Server is already active on Port 5000." -ForegroundColor Green
}

# Wait for local health check via IPv4 (127.0.0.1)
Write-Host "[*] Verifying server health..." -ForegroundColor Gray
$serverReady = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:5000/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($r.StatusCode -eq 200) {
            $serverReady = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
}

if ($serverReady) {
    Write-Host "[OK] School ERP server is healthy and responding." -ForegroundColor Green
} else {
    Write-Host "[!] Server health check pending, continuing tunnel connection..." -ForegroundColor Yellow
}

# 4. Start Cloudflare Tunnel
Write-Host "[*] Creating Secure Cloudflare Tunnel for 4G/5G mobile access..." -ForegroundColor Cyan
$logFile = Join-Path $env:TEMP "cloudflared_erp_live.log"
if (Test-Path $logFile) { Remove-Item $logFile -Force -ErrorAction SilentlyContinue }

$cfProcess = Start-Process -FilePath $cfExe -ArgumentList "tunnel", "--url", "http://127.0.0.1:5000", "--logfile", $logFile -PassThru -WindowStyle Hidden

Write-Host "[*] Generating secure HTTPS link (takes about 5-8 seconds)..." -ForegroundColor Gray
$publicUrl = ""
for ($i = 0; $i -lt 25; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $logFile) {
        $content = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
        if ($content -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') {
            $publicUrl = $matches[0]
            break
        }
    }
}

# 5. Output Result and Open Notepad
Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "               ONLINE MOBILE ACCESS IS NOW LIVE AND READY!" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""

if ($publicUrl) {
    Write-Host " [PUBLIC HTTPS LINK]:" -ForegroundColor White
    Write-Host ""
    Write-Host "   *************************************************************************" -ForegroundColor Yellow
    Write-Host "   $publicUrl" -ForegroundColor Yellow -BackgroundColor Black
    Write-Host "   *************************************************************************" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   (This link works on ANY mobile device with 4G/5G data anywhere in the world!)" -ForegroundColor Gray
    Write-Host ""
    Write-Host " [LOGIN CREDENTIALS]:" -ForegroundColor White
    Write-Host "   Username: admin" -ForegroundColor Cyan
    Write-Host "   Password: admin123" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "===============================================================================" -ForegroundColor Green

    $txtFile = Join-Path $scriptDir "ONLINE_MOBILE_LINK.txt"
    $fileContent = @"
===============================================================================
     SCHOLARS INTERNATIONAL ACADEMY - ONLINE MOBILE ACCESS LINK
===============================================================================

Online Public HTTPS Link:
$publicUrl

Send this link to your mobile phone (via WhatsApp, SMS, or Messenger).
Open it on your phone using Chrome, Safari, or any browser with 4G/5G data.

Login Credentials:
  Username: admin
  Password: admin123

===============================================================================
Note: Keep the 'Online Mobile Access' command window open while using the mobile site.
When finished, close that window or run Stop_Online_Access.bat.
===============================================================================
"@
    Set-Content -Path $txtFile -Value $fileContent -Encoding UTF8
    
    # Also copy to parent directory if applicable (e.g. E:\All_project_publish)
    $parentDir = Split-Path $scriptDir -Parent
    if ($parentDir -and (Test-Path $parentDir)) {
        Copy-Item $txtFile (Join-Path $parentDir "ONLINE_MOBILE_LINK.txt") -Force -ErrorAction SilentlyContinue
    }
    
    # Also copy to user Desktop for instant convenience
    $desktopDir = [Environment]::GetFolderPath("Desktop")
    if ($desktopDir -and (Test-Path $desktopDir)) {
        Copy-Item $txtFile (Join-Path $desktopDir "ONLINE_MOBILE_LINK.txt") -Force -ErrorAction SilentlyContinue
    }

    Write-Host "[OK] Saved link to: $txtFile" -ForegroundColor Green
    Write-Host "[OK] Opening link in Notepad and Web Browser..." -ForegroundColor Green

    Start-Process notepad.exe -ArgumentList "`"$txtFile`"" -ErrorAction SilentlyContinue
    Start-Process $publicUrl -ErrorAction SilentlyContinue
} else {
    Write-Host "[!] Tunnel took longer to report URL. Checking log..." -ForegroundColor Red
    Write-Host "Local address is ready: http://127.0.0.1:5000" -ForegroundColor Yellow
    Start-Process "http://127.0.0.1:5000" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "Server and Cloudflare Tunnel are running in the background." -ForegroundColor White
Write-Host "You may minimize this window." -ForegroundColor White
Write-Host "To STOP the server and tunnel, press ENTER in this window." -ForegroundColor Yellow
Write-Host "===============================================================================" -ForegroundColor Cyan

Read-Host "Press ENTER to stop the ERP server and tunnel..." | Out-Null

Write-Host "[*] Shutting down ERP server and tunnel..." -ForegroundColor Yellow
if ($cfProcess -and !$cfProcess.HasExited) { Stop-Process -Id $cfProcess.Id -Force -ErrorAction SilentlyContinue }
if ($erpProcess -and !$erpProcess.HasExited) { Stop-Process -Id $erpProcess.Id -Force -ErrorAction SilentlyContinue }
Stop-Process -Name "cloudflared" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "SchoolManagement.Api" -Force -ErrorAction SilentlyContinue
Write-Host "[OK] ERP Server and Cloudflare Tunnel stopped successfully." -ForegroundColor Green
Start-Sleep -Seconds 2
