@echo off
title GhostTrack Live
color 0A

echo.
echo   ============================================
echo        G H O S T T R A C K   L I V E
echo   ============================================
echo.
echo   Selecting an open port...
echo.

for /l %%p in (3000,1,3004) do (
  powershell -NoProfile -Command "try { $c = Test-NetConnection -ComputerName 127.0.0.1 -Port %%p -WarningAction SilentlyContinue; if (-not $c.TcpTestSucceeded) { exit 0 } else { exit 1 } } catch { exit 0 }"
  if not errorlevel 1 (
    set PORT=%%p
    goto :FOUNDPORT
  )
)
echo   ERROR: Ports 3000-3004 are busy.
echo   Close other servers and try again.
pause
exit /b 1

:FOUNDPORT
echo   Starting server on port %PORT%...
echo   Opening browser...
echo.

start "" "http://localhost:%PORT%"

:: Start the server (blocks — keeps window open)
"%~dp0node.exe" "%~dp0server.cjs" --port %PORT%

:: If server exits, show message
echo.
echo   Server has stopped.
echo   Press any key to close this window.
pause >nul
