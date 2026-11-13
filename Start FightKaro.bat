@echo off
title FightKaro - SANSAD SHOWDOWN
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nahi mila - https://nodejs.org se install karo, phir ye file dobara chalao.
  pause
  exit /b 1
)
start "" /min node "%~dp0serve.mjs"
timeout /t 2 >nul
start "" "http://localhost:8150/"
exit /b 0
