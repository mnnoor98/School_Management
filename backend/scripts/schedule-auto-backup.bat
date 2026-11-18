@echo off
setlocal enabledelayedexpansion
title School Management System - Daily Automated Backup Scheduler
color 0A

echo ================================================================
echo       SCHOOL MANAGEMENT SYSTEM - DAILY BACKUP SCHEDULER
echo ================================================================
echo.

set "TASK_NAME=SchoolManagement_Daily_DbBackup"
set "SCRIPT_PATH=%~dp0backup-database.bat"

if "%1"=="/remove" goto remove_task
if "%1"=="/status" goto check_status
if "%1"=="/run" goto run_now

:menu
echo Choose an option:
echo.
echo   [1] Schedule Daily Backup at 02:00 AM (Default)
echo   [2] Schedule Daily Backup at Custom Time (HH:mm)
echo   [3] View Current Backup Schedule Status
echo   [4] Run Backup Task Immediately Test
echo   [5] Remove / Unregister Daily Backup Task
echo   [0] Exit
echo.
set /p opt="Select an option (0-5): "

if "%opt%"=="1" (
    set "BACKUP_TIME=02:00"
    goto register_task
)
if "%opt%"=="2" (
    set /p BACKUP_TIME="Enter backup time in 24-hour format (e.g. 03:30 or 23:00): "
    goto register_task
)
if "%opt%"=="3" goto check_status
if "%opt%"=="4" goto run_now
if "%opt%"=="5" goto remove_task
if "%opt%"=="0" exit /b 0

echo Invalid selection.
pause
goto menu

:register_task
echo.
echo [INFO] Registering Windows Scheduled Task "%TASK_NAME%"...
echo Trigger Time: Every day at %BACKUP_TIME%
echo Action Script: "%SCRIPT_PATH%" /auto
echo.

schtasks /create /tn "%TASK_NAME%" /tr "\"%SCRIPT_PATH%\" /auto" /sc daily /st %BACKUP_TIME% /f

if %errorlevel% equ 0 (
    echo.
    echo ================================================================
    echo [SUCCESS] Daily backup schedule successfully registered!
    echo Task Name   : %TASK_NAME%
    echo Frequency   : Daily at %BACKUP_TIME%
    echo Target Script: %SCRIPT_PATH% /auto
    echo ================================================================
) else (
    echo.
    echo [ERROR] Failed to register task. Please ensure you run this script as Administrator.
)
echo.
pause
exit /b 0

:check_status
echo.
echo [INFO] Checking Windows Scheduled Task "%TASK_NAME%"...
echo.
schtasks /query /tn "%TASK_NAME%" /fo LIST /v 2>nul
if %errorlevel% neq 0 (
    echo [NOTICE] Task "%TASK_NAME%" is not currently registered.
)
echo.
pause
exit /b 0

:run_now
echo.
echo [INFO] Running Scheduled Task "%TASK_NAME%" now...
schtasks /run /tn "%TASK_NAME%" 2>nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Task triggered in background. Check backups folder for output.
) else (
    echo [NOTICE] Task not registered or cannot be run directly. Running script manually...
    call "%SCRIPT_PATH%" /auto
)
echo.
pause
exit /b 0

:remove_task
echo.
echo [INFO] Removing Windows Scheduled Task "%TASK_NAME%"...
schtasks /delete /tn "%TASK_NAME%" /f 2>nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Task "%TASK_NAME%" has been removed.
) else (
    echo [NOTICE] Task was not found or already removed.
)
echo.
pause
exit /b 0
