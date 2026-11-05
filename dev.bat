@echo off
title Azeem Mart - Dev Mode (Rebuild + Run)

echo ========================================
echo   Azeem Mart - Dev Mode
echo ========================================

:: 1. Start PostgreSQL
echo [1/4] Starting PostgreSQL...
"C:\Users\Srinivasan\Downloads\sri projects\sri mart\postgresql\pgsql\bin\pg_ctl.exe" -D C:\pgsql_data -l C:\pgsql.log start
timeout /t 2 >nul

:: 2. Set MSYS2 compiler in PATH
echo [2/4] Setting up compiler...
set PATH=C:\Users\Srinivasan\MSYS2\ucrt64\bin;%PATH%

:: 3. Build the project
echo [3/4] Building...
cd /d "C:\Users\Srinivasan\Downloads\sri projects\sri mart"
cmake --build build

:: 4. Run server
echo [4/4] Starting Azeem Mart server...
echo.
echo ========================================
echo   Open http://localhost:8080 in browser
echo ========================================
echo.
cd build
sri_mart.exe
