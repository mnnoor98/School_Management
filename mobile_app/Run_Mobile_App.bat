@echo off
title Scholars Academy - Mobile App Launcher
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Run_Mobile_App.ps1"
