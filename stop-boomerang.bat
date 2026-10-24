@echo off
setlocal
title Stop Boomerang

echo ========================================================
echo              STOPPING BOOMERANG SERVERS
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"$ports = @(5173, 5000, 5174); ^
foreach($port in $ports){ ^
  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue; ^
  if($conns){ ^
    foreach($c in $conns){ ^
      try{ Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue; Write-Host '[STOPPED]' Port $port (PID $c.OwningProcess) } catch{} ^
    } ^
  } ^
}; ^
Write-Host ''; ^
Write-Host 'All Boomerang servers stopped'; ^
Write-Host 'Ports 5173, 5000 are now free'"

echo.
timeout /t 3 >nul
