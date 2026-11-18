@echo off
title School Management System - Starting...
color 0E

echo ================================================================
echo        SCHOOL MANAGEMENT SYSTEM - FULL STACK LAUNCHER
echo ================================================================
echo.

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"

if not exist "%BACKEND_DIR%" (
    rem If run from inside backend folder, ROOT_DIR is parent
    set "BACKEND_DIR=%ROOT_DIR%"
    set "ROOT_DIR=%~dp0..\"
)

if exist "%ROOT_DIR%Fontend" (
    set "FRONTEND_DIR=%ROOT_DIR%Fontend"
) else if exist "%ROOT_DIR%frontend" (
    set "FRONTEND_DIR=%ROOT_DIR%frontend"
) else (
    echo [ERROR] Frontend folder not found at %ROOT_DIR%Fontend
    pause
    exit /b 1
)

echo [*] Checking system prerequisites...

where dotnet >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] .NET SDK is missing or not configured in system PATH.
    echo Please install .NET SDK from https://dotnet.microsoft.com/download
    pause
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js / npm is missing or not configured in system PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Prerequisites verified (.NET and Node.js found).
echo.

if not exist "%FRONTEND_DIR%\node_modules" (
    echo [*] Frontend node_modules not detected. Installing dependencies...
    cd /d "%FRONTEND_DIR%"
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

echo ----------------------------------------------------------------
echo [*] [1/2] Launching Backend API (ASP.NET Core)...
echo ----------------------------------------------------------------
start "School Management - Backend API" cmd /k "title School Management - Backend API && color 0B && cd /d "%BACKEND_DIR%" && dotnet run --project src\SchoolManagement.Api\SchoolManagement.Api.csproj --launch-profile http"

echo [*] [2/2] Launching Frontend (Angular)...
echo ----------------------------------------------------------------
start "School Management - Frontend UI" cmd /k "title School Management - Frontend UI && color 0A && cd /d "%FRONTEND_DIR%" && npm start"

echo.
echo ================================================================
echo   Services are starting up in separate terminal windows!
echo ================================================================
echo   - Backend API:    http://localhost:5000/api/v1
echo   - Swagger Docs:   http://localhost:5000/swagger
echo   - Frontend App:   http://localhost:4200
echo.
echo   Seed Login Credentials:
echo   --------------------------------------------------------------
echo   * Super Admin:    admin      / admin123
echo   * Teacher:        teacher    / teacher123
echo   * Student:        student    / student123
echo   * Accountant:     accountant / accountant123
echo   * Guardian:       guardian   / guardian123
echo ================================================================
echo.
echo Waiting 6 seconds before opening browser...
ping 127.0.0.1 -n 6 >nul

start http://localhost:5000/swagger
start http://localhost:4200

echo.
echo [DONE] Browser launched! You can minimize or close this launcher window.
echo To stop services later, run 'stop.bat'.
echo.
pause
