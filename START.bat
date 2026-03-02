@echo off
title GhostTrack Live
color 0A

echo.
echo   ============================================
echo        G H O S T T R A C K   L I V E
echo   ============================================
echo.

:: Check for Node.js
where node >nul 2>&1
if errorlevel 1 (
  :: Try bundled node.exe as fallback
  if exist "%~dp0node.exe" (
    set NODE_CMD="%~dp0node.exe"
    goto :HAVE_NODE
  )
  echo   ERROR: Node.js not found.
  echo   Install from https://nodejs.org or place node.exe here.
  pause
  exit /b 1
)
set NODE_CMD=node

:HAVE_NODE

:: Build dist/ if it doesn't exist
if not exist "%~dp0dist\index.html" (
  echo   Building production bundle...
  echo.
  cd /d "%~dp0"
  call npx vite build
  if errorlevel 1 (
    echo.
    echo   ERROR: Build failed. Make sure dependencies are installed:
    echo     npm install
    echo.
    pause
    exit /b 1
  )
  echo.
)

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
%NODE_CMD% "%~dp0server.cjs" --port %PORT%

:: If server exits, show message
echo.
echo   Server has stopped.
echo   Press any key to close this window.
pause >nul
