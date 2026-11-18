@echo off
setlocal enabledelayedexpansion
title School Management System - Database Restore Utility
color 0C

echo ================================================================
echo         SCHOOL MANAGEMENT SYSTEM - POSTGRESQL RESTORE
echo ================================================================
echo.
echo [WARNING] Restoring a database will overwrite current database records!
echo Please ensure you have taken a current backup before continuing.
echo.

:: 1. Setup Directories
set "SCRIPT_DIR=%~dp0"
set "BACKEND_DIR=%SCRIPT_DIR%..\"
set "BACKUP_DIR=%BACKEND_DIR%backups"

if not exist "%BACKUP_DIR%" (
    echo [ERROR] Backup directory not found at: %BACKUP_DIR%
    pause
    exit /b 1
)

:: 2. Database Connection Configuration
if "%DB_HOST%"=="" set "DB_HOST=localhost"
if "%DB_PORT%"=="" set "DB_PORT=5432"
if "%DB_NAME%"=="" set "DB_NAME=school_management"
if "%DB_USER%"=="" set "DB_USER=postgres"
if "%DB_PASSWORD%"=="" set "DB_PASSWORD=123456"

set "PGPASSWORD=%DB_PASSWORD%"

:: 3. Detect psql executable
set "PSQL="
where psql >nul 2>nul
if %errorlevel% equ 0 (
    set "PSQL=psql"
) else (
    if exist "C:\Program Files\PostgreSQL\18\bin\psql.exe" (
        set "PSQL=C:\Program Files\PostgreSQL\18\bin\psql.exe"
    ) else if exist "C:\Program Files\PostgreSQL\17\bin\psql.exe" (
        set "PSQL=C:\Program Files\PostgreSQL\17\bin\psql.exe"
    ) else if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
        set "PSQL=C:\Program Files\PostgreSQL\16\bin\psql.exe"
    ) else if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
        set "PSQL=C:\Program Files\PostgreSQL\15\bin\psql.exe"
    )
)

if "%PSQL%"=="" (
    echo [ERROR] PostgreSQL psql.exe could not be found!
    echo Please make sure PostgreSQL is installed or add its bin directory to PATH.
    pause
    exit /b 1
)

:: 4. If a file was passed as argument 1, use it
if not "%~1"=="" (
    if exist "%~1" (
        set "SELECTED_FILE=%~1"
        goto confirm_restore
    )
    if exist "%BACKUP_DIR%\%~1" (
        set "SELECTED_FILE=%BACKUP_DIR%\%~1"
        goto confirm_restore
    )
)

:: 5. List available backups
echo ----------------------------------------------------------------
echo Available Backup Archives:
echo ----------------------------------------------------------------

set /a count=0
for /f "tokens=*" %%F in ('dir /b /o-d "%BACKUP_DIR%\*.sql" 2^>nul') do (
    set /a count+=1
    set "FILE_!count!=%%F"
    for %%S in ("%BACKUP_DIR%\%%F") do set "FSIZE=%%~zS"
    set /a "FSIZE_KB=!FSIZE! / 1024"
    echo   [!count!] %%F  [!FSIZE_KB! KB]
)

if %count% equ 0 (
    echo [NOTICE] No .sql backup files found in: %BACKUP_DIR%
    echo Please run backup-database.bat first to generate a backup.
    pause
    exit /b 1
)

echo.
set /p selection="Select backup number to restore (1-%count%, or 0 to Cancel): "

if "%selection%"=="0" (
    echo Operation cancelled by user.
    exit /b 0
)

if "%selection%"=="" (
    echo Invalid selection.
    exit /b 1
)

set "SELECTED_FILENAME=!FILE_%selection%!"
if "%SELECTED_FILENAME%"=="" (
    echo [ERROR] Invalid selection number.
    pause
    exit /b 1
)

set "SELECTED_FILE=%BACKUP_DIR%\%SELECTED_FILENAME%"

:confirm_restore
cls
echo ================================================================
echo                   CONFIRM DATABASE RESTORATION
echo ================================================================
echo.
echo Selected Archive : %SELECTED_FILE%
echo Target Database  : %DB_NAME% [Host: %DB_HOST%:%DB_PORT%, User: %DB_USER%]
echo.
echo ALL CURRENT DATA IN DATABASE "%DB_NAME%" WILL BE REPLACED!
echo.
set /p confirm="Type RESTORE (in uppercase) to continue, or anything else to abort: "

if not "%confirm%"=="RESTORE" (
    echo.
    echo [ABORTED] Restoration cancelled. No changes were made.
    pause
    exit /b 0
)

echo.
echo [INFO] Pre-cleaning existing application schemas...
"%PSQL%" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "DROP SCHEMA IF EXISTS academic, attendance, auth, employee, exam, finance, school, student, system CASCADE;" > "%BACKUP_DIR%\last_restore.log" 2>&1

echo [INFO] Restoring database from: %SELECTED_FILE%...
echo Please wait, this may take a few seconds...
echo.

"%PSQL%" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "%SELECTED_FILE%" >> "%BACKUP_DIR%\last_restore.log" 2>&1

if %errorlevel% equ 0 (
    echo.
    echo ================================================================
    echo [SUCCESS] Database restoration completed successfully!
    echo Target Database: %DB_NAME%
    echo Restored from  : %SELECTED_FILE%
    echo ================================================================
    echo [%DATE% %TIME%] SUCCESS: Restored from %SELECTED_FILE% >> "%BACKUP_DIR%\backup_history.log"
) else (
    echo.
    echo ================================================================
    echo [WARNING] Restoration completed with some notices or exit code %errorlevel%.
    echo Please check the detailed log: %BACKUP_DIR%\last_restore.log
    echo ================================================================
    echo [%DATE% %TIME%] RESTORE NOTICE: Exit code %errorlevel% for %SELECTED_FILE% >> "%BACKUP_DIR%\backup_history.log"
)

echo.
pause
exit /b 0
