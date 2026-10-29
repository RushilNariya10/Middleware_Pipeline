@echo off
echo ========================================================
echo   Starting Practical 7: Auth ^& Middleware Pipeline (24IT055)
echo ========================================================
echo.

echo 1. Starting Backend API on Port 3000...
start "Task Manager API (Port 3000)" cmd /k "cd /d %~dp0task-api && node server.js"

timeout /t 3 /nobreak >nul

echo 2. Starting Frontend Dev Server on Port 5173...
start "React Portfolio & Tasks (Port 5173)" cmd /k "cd /d %~dp0portfolio && npm run dev"

timeout /t 3 /nobreak >nul

echo 3. Opening Browser at http://localhost:5173/tasks...
start http://localhost:5173/tasks

echo.
echo Both servers are running!
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
pause
