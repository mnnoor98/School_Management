@echo off
title Online Mobile Access Launcher
if exist "%~dp0publish\Run_Online_Access.ps1" (
    cd /d "%~dp0publish"
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0publish\Run_Online_Access.ps1"
) else (
    cd /d "%~dp0"
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Run_Online_Access.ps1"
)
