@echo off
setlocal enabledelayedexpansion
title School Management System - Database Backup Utility
color 0B

echo ================================================================
echo         SCHOOL MANAGEMENT SYSTEM - POSTGRESQL BACKUP
echo ================================================================
echo.

:: 1. Setup Directories
set "SCRIPT_DIR=%~dp0"
set "BACKEND_DIR=%SCRIPT_DIR%..\"
set "BACKUP_DIR=%BACKEND_DIR%backups"
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
)

:: 2. Database Connection Configuration (from appsettings.json)
if "%DB_HOST%"=="" set "DB_HOST=localhost"
if "%DB_PORT%"=="" set "DB_PORT=5432"
if "%DB_NAME%"=="" set "DB_NAME=school_management"
if "%DB_USER%"=="" set "DB_USER=postgres"
if "%DB_PASSWORD%"=="" set "DB_PASSWORD=123456"

set "PGPASSWORD=%DB_PASSWORD%"

:: 3. Detect pg_dump executable
set "PG_DUMP="
where pg_dump >nul 2>nul
if %errorlevel% equ 0 (
    set "PG_DUMP=pg_dump"
) else (
    if exist "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" (
        set "PG_DUMP=C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"
    ) else if exist "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" (
        set "PG_DUMP=C:\Program Files\PostgreSQL\17\bin\pg_dump.exe"
    ) else if exist "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" (
        set "PG_DUMP=C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"
    ) else if exist "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" (
        set "PG_DUMP=C:\Program Files\PostgreSQL\15\bin\pg_dump.exe"
    )
)

if "%PG_DUMP%"=="" (
    echo [ERROR] PostgreSQL pg_dump.exe could not be found!
    echo Please make sure PostgreSQL is installed or add its bin directory to PATH.
    echo.
    if "%1"=="/auto" exit /b 1
    pause
    exit /b 1
)

:: 4. Generate Timestamped Filename
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set "DATETIME=%%I"
set "TIMESTAMP=%DATETIME:~0,4%-%DATETIME:~4,2%-%DATETIME:~6,2%_%DATETIME:~8,2%-%DATETIME:~10,2%-%DATETIME:~12,2%"
set "BACKUP_FILE=%BACKUP_DIR%\school_management_backup_%TIMESTAMP%.sql"
set "LOG_FILE=%BACKUP_DIR%\backup_history.log"

echo Target Database : %DB_NAME% [Host: %DB_HOST%:%DB_PORT%, User: %DB_USER%]
echo Using Tool       : %PG_DUMP%
echo Destination File: %BACKUP_FILE%
echo.
echo [INFO] Starting database backup export...

:: 5. Execute pg_dump
"%PG_DUMP%" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% --clean --if-exists -F p -f "%BACKUP_FILE%"

if %errorlevel% neq 0 goto on_error

for %%A in ("%BACKUP_FILE%") do set "FILE_SIZE=%%~zA"
set /a "SIZE_KB=!FILE_SIZE! / 1024"
echo.
echo ================================================================
echo [SUCCESS] Backup completed successfully!
echo File Name: school_management_backup_%TIMESTAMP%.sql
echo File Size: !SIZE_KB! KB
echo Location : %BACKUP_FILE%
echo ================================================================
echo [%DATE% %TIME%] SUCCESS: Created %BACKUP_FILE% [!SIZE_KB! KB] >> "%LOG_FILE%"

:: 6. Retention: Clean up files older than 30 days
forfiles /p "%BACKUP_DIR%" /m *.sql /d -30 /c "cmd /c del @path" 2>nul

echo.
if "%1"=="/auto" exit /b 0

pause
exit /b 0

:on_error
echo.
echo ================================================================
echo [ERROR] pg_dump failed with exit code %errorlevel%!
echo ================================================================
echo [%DATE% %TIME%] FAILED: Exit code %errorlevel% >> "%LOG_FILE%"
if "%1"=="/auto" exit /b 1
pause
exit /b 1
