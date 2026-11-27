@echo off
title Scholars Academy - Mobile App Launcher
if exist "%~dp0mobile_app\Run_Mobile_App.ps1" (
    cd /d "%~dp0mobile_app"
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0mobile_app\Run_Mobile_App.ps1"
) else (
    echo Error: Cannot find mobile_app folder!
    pause
)
