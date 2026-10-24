@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title Boomerang - Full Stack Server

echo ========================================================
echo           BOOMERANG - CAMPUS LOST & FOUND
echo ========================================================
echo.
echo [INFO] Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found. Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js found
node --version

echo.
echo [INFO] Checking dependencies...
if not exist "node_modules" (
    echo [INFO] Installing dependencies... This may take a few minutes
    call npm install --no-audit --no-fund
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Installation failed
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
)

echo.
echo [INFO] Initializing database...
node initdb.mjs >nul 2>&1
node makeadmin.mjs >nul 2>&1
node server/seed.js >nul 2>&1
echo [OK] Database ready

echo.
echo ========================================================
echo                 STARTING SERVERS
echo ========================================================
echo.
echo [FRONTEND] http://localhost:5173
echo [BACKEND]  http://localhost:5000
echo [API]      http://localhost:5000/api
echo.
echo Press Ctrl+C in this window to stop all servers
echo ========================================================
echo.

start "" "http://localhost:5173"
call npx concurrently --kill-others "npm run server:dev" "npm run client:dev"

echo.
echo [INFO] Servers stopped
pause
