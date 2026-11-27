$ErrorActionPreference = "Continue"
$Host.UI.RawUI.WindowTitle = "Scholars Academy - Mobile App Preview"

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "        SCHOLARS INTERNATIONAL ACADEMY - MOBILE APP LAUNCHER" -ForegroundColor Yellow
Write-Host "                   (Flutter Cross-Platform Mobile Engine)" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (!$scriptDir) { $scriptDir = (Get-Location).Path }
Set-Location $scriptDir

# Check if build\web exists, if not build it once
$webDir = Join-Path $scriptDir "build\web"
if (!(Test-Path (Join-Path $webDir "index.html"))) {
    Write-Host "[*] Compiling Flutter mobile web bundle for the first time..." -ForegroundColor Yellow
    flutter build web --no-tree-shake-icons
}

# Free port 8085 if occupied
$existingPort = Get-NetTCPConnection -LocalPort 8085 -ErrorAction SilentlyContinue
if ($existingPort) {
    Get-Process -Id $existingPort.OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

# Start local web server on port 8085
Write-Host "[*] Starting Mobile App Web Server on Port 8085..." -ForegroundColor Cyan
$serverProcess = Start-Process -FilePath "python" -ArgumentList "-m", "http.server", "8085", "--directory", "`"$webDir`"" -PassThru -WindowStyle Hidden

# Verify server ready
Start-Sleep -Seconds 1
$ready = $false
for ($i = 0; $i -lt 10; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:8085" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($r.StatusCode -eq 200) {
            $ready = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
}

if ($ready) {
    Write-Host "[OK] Mobile App Server is Live: http://localhost:8085" -ForegroundColor Green
    Write-Host "[*] Opening Mobile App in Smartphone Frame (412 x 915)..." -ForegroundColor Yellow
    
    $chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
    if (Test-Path $chromePath) {
        Start-Process $chromePath -ArgumentList "--app=http://localhost:8085", "--window-size=412,915", "--window-position=500,50"
    } else {
        Start-Process "http://localhost:8085"
    }
} else {
    Write-Host "[!] Could not start local server. Launching flutter run..." -ForegroundColor Yellow
    flutter run -d chrome --web-port=8085
}

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "           MOBILE APP IS CURRENTLY RUNNING ON YOUR SCREEN!" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "Keep this window open while using the mobile app." -ForegroundColor White
Write-Host "To STOP the mobile app server, press ENTER in this window." -ForegroundColor Yellow
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press ENTER to stop the Mobile App server..." | Out-Null

Write-Host "[*] Shutting down Mobile App server..." -ForegroundColor Yellow
if ($serverProcess -and !$serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
}
Write-Host "[OK] Mobile App server stopped." -ForegroundColor Green
Start-Sleep -Seconds 1
