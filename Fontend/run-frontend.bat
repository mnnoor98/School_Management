@echo off
title School Management - Frontend UI
color 0A

echo ======================================================
echo    School Management System - Angular Frontend
echo ======================================================
echo.

cd /d "%~dp0"

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js / npm is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [*] node_modules not found. Installing dependencies first...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

echo [*] Starting Angular development server...
echo [*] URL: http://localhost:4200
echo.

npm start

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Frontend failed to start or exited with an error.
    pause
)
