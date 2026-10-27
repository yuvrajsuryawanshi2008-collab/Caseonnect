@echo off
title CaseConnect Institutional Monitoring Platform (Supabase PostgreSQL)
echo =========================================================================
echo   Starting CaseConnect Centralized Regulatory Monitoring Platform...
echo   Database: Supabase PostgreSQL
echo =========================================================================
cd /d "%~dp0backend"
if not exist node_modules (
  echo Installing backend dependencies...
  call npm.cmd install
)
echo Launching Server on http://localhost:5000 ...
start "" "http://localhost:5000"
node server.js
pause
