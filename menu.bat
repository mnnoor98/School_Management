@echo off
title School Management System - Control Panel
color 0F

set "ROOT_DIR=%~dp0"
if not exist "%ROOT_DIR%backend" (
    set "ROOT_DIR=%~dp0..\"
)
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%Fontend"
if not exist "%FRONTEND_DIR%" (
    if exist "%ROOT_DIR%frontend" set "FRONTEND_DIR=%ROOT_DIR%frontend"
)

:menu
cls
echo ================================================================
echo         SCHOOL MANAGEMENT SYSTEM - CONTROL PANEL
echo ================================================================
echo.
echo   [1] Start Full Project (Backend API + Frontend UI + Browser)
echo   [2] Start Backend API Only (http://localhost:5000/swagger)
echo   [3] Start Frontend Only (http://localhost:4200)
echo   [4] Apply Database Migrations (EF Core Update)
echo   [5] Install/Update Frontend Dependencies (npm install)
echo   [6] Stop All Running Services
echo   [0] Exit
echo.
echo ================================================================
set /p choice="Select an option (0-6): "

if "%choice%"=="1" goto start_all
if "%choice%"=="2" goto start_backend
if "%choice%"=="3" goto start_frontend
if "%choice%"=="4" goto update_db
if "%choice%"=="5" goto install_npm
if "%choice%"=="6" goto stop_services
if "%choice%"=="0" exit /b 0

echo [ERROR] Invalid selection. Please choose 0 to 6.
timeout /t 2 >nul
goto menu

:start_all
call "%ROOT_DIR%run.bat"
goto menu

:start_backend
call "%BACKEND_DIR%\run-backend.bat"
goto menu

:start_frontend
call "%FRONTEND_DIR%\run-frontend.bat"
goto menu

:update_db
cls
echo ================================================================
echo           APPLYING DATABASE MIGRATIONS (EF CORE)
echo ================================================================
echo.
cd /d "%BACKEND_DIR%"
dotnet ef database update --project src\SchoolManagement.Infrastructure --startup-project src\SchoolManagement.Api
echo.
pause
goto menu

:install_npm
cls
echo ================================================================
echo           INSTALLING FRONTEND DEPENDENCIES
echo ================================================================
echo.
cd /d "%FRONTEND_DIR%"
call npm install
echo.
pause
goto menu

:stop_services
call "%ROOT_DIR%stop.bat"
goto menu
