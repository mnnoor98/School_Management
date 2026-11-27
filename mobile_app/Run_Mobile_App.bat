@echo off
title Scholars International Academy - Mobile App
cd /d "%~dp0"
echo ===============================================================================
echo        SCHOLARS INTERNATIONAL ACADEMY - MOBILE APP LAUNCHER
echo ===============================================================================
echo.
echo Select Target Device to Run:
echo   [1] Chrome Web Preview (Quickest mobile UI test on desktop)
echo   [2] Android Device / Emulator
echo   [3] Windows Desktop App
echo.
set /p choice="Enter choice [1, 2, or 3] (default 1): "

if "%choice%"=="2" (
    echo Launching on Android Device / Emulator...
    flutter run -d android
) else if "%choice%"=="3" (
    echo Launching on Windows Desktop...
    flutter run -d windows
) else (
    echo Launching on Chrome Web Preview (Mobile Viewport)...
    flutter run -d chrome --web-port=8080
)

pause
