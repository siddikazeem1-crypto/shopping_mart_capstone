@echo off
title Azeem Mart - Starting...

echo ========================================
echo   Azeem Mart - Starting All Services
echo ========================================

:: 1. Start PostgreSQL
echo [1/3] Starting PostgreSQL...
"C:\Users\Srinivasan\Downloads\sri projects\sri mart\postgresql\pgsql\bin\pg_ctl.exe" -D C:\pgsql_data -l C:\pgsql.log start
timeout /t 2 >nul

:: 2. Set MSYS2 compiler in PATH
echo [2/3] Setting up compiler...
set PATH=C:\Users\Srinivasan\MSYS2\ucrt64\bin;%PATH%

:: 3. Run server
echo [3/3] Starting Azeem Mart server...
echo.
echo ========================================
echo   Open http://localhost:8080 in browser
echo ========================================
echo.
cd /d "C:\Users\Srinivasan\Downloads\sri projects\sri mart\build"
sri_mart.exe
