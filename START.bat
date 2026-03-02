@echo off
title GhostTrack Live
color 0A
cd /d "%~dp0"

echo.
echo   ============================================
echo        G H O S T T R A C K   L I V E
echo   ============================================
echo.

:: Check dist/ exists
if not exist "%~dp0dist\index.html" (
  echo   ERROR: dist/ folder not found.
  echo.
  echo   If you cloned from GitHub, run these first:
  echo     npm install
  echo     npx vite build
  echo.
  echo   Or download the ready-to-run release zip from:
  echo     github.com/Evilander/ghosttrack-live/releases
  echo.
  pause
  exit /b 1
)

:: Find Node.js — check bundled first, then system
if exist "%~dp0node.exe" (
  set "NODE_CMD=%~dp0node.exe"
  goto :HAVE_NODE
)
where node >nul 2>&1
if errorlevel 1 (
  echo   ERROR: Node.js not found.
  echo.
  echo   Option 1: Install Node.js from https://nodejs.org
  echo   Option 2: Place node.exe in this folder
  echo.
  pause
  exit /b 1
)
set "NODE_CMD=node"

:HAVE_NODE

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

%NODE_CMD% "%~dp0server.cjs" --port %PORT%

echo.
echo   Server has stopped.
echo   Press any key to close this window.
pause >nul
