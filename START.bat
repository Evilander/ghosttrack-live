@echo off
title GhostTrack Live
color 0A

echo.
echo   ============================================
echo        G H O S T T R A C K   L I V E
echo   ============================================
echo.
echo   Starting server...
echo   Opening browser in 2 seconds...
echo.

:: Open browser after a short delay (start is non-blocking)
start "" "http://localhost:3000"

:: Start the server (blocks — keeps window open)
"%~dp0node.exe" "%~dp0server.cjs"

:: If server exits, show message
echo.
echo   Server has stopped.
echo   Press any key to close this window.
pause >nul
