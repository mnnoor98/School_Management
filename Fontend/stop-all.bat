@echo off
title School Management System - Stop Services
color 0C

echo ================================================================
echo        SCHOOL MANAGEMENT SYSTEM - STOPPING SERVICES
echo ================================================================
echo.

echo [*] Closing School Management terminal windows...
taskkill /FI "WINDOWTITLE eq School Management - Backend API*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq School Management - Frontend UI*" /F >nul 2>&1

echo [*] Checking and freeing port 5000 (Backend API)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    echo     Killing process with PID: %%a on port 5000
    taskkill /F /PID %%a >nul 2>&1
)

echo [*] Checking and freeing port 4200 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4200 ^| findstr LISTENING') do (
    echo     Killing process with PID: %%a on port 4200
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo ================================================================
echo   [OK] All services have been stopped successfully!
echo ================================================================
echo.
pause
