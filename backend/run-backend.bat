@echo off
title School Management - Backend API
color 0B

echo ======================================================
echo    School Management System - Backend API Server
echo ======================================================
echo.

cd /d "%~dp0"

where dotnet >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] .NET SDK is not installed or not in PATH.
    echo Please install .NET SDK from https://dotnet.microsoft.com/download
    pause
    exit /b 1
)

echo [*] Target Project: src\SchoolManagement.Api
echo [*] Environment: Development
echo [*] URL: http://localhost:5000
echo [*] Swagger: http://localhost:5000/swagger
echo.
echo [*] Starting API server...
echo.

dotnet run --project src\SchoolManagement.Api\SchoolManagement.Api.csproj --launch-profile http

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Failed to run backend API. Check the error log above.
    pause
)
