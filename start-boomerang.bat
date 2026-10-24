@echo off
setlocal
cd /d "%~dp0"
title Boomerang - Campus Lost & Found

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo Node.js is not installed. Install it from https://nodejs.org and try again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo npm install failed. Check the error above.
    pause
    exit /b 1
  )
)

echo.
echo Starting Boomerang (Frontend + Backend)...
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo.
echo Close this window to stop both servers.
echo.

start "" "http://localhost:5173"
call npm run dev

echo.
echo Boomerang stopped.
pause
