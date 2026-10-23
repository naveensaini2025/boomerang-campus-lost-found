@echo off
setlocal
title Stop Boomerang

powershell -NoProfile -ExecutionPolicy Bypass -Command "$c = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue; if ($c) { $c | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; Write-Host 'Boomerang stopped. Port 5173 is now free.' } else { Write-Host 'Boomerang is not running on port 5173.' }"

ping -n 3 127.0.0.1 >nul
