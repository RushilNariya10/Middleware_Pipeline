@echo off
echo ====================================================================
echo   AWDF Full-Stack Project - Rushil Nariya (24IT055)
echo   Task Manager API + React Portfolio ^& Tasks + AI Integration
echo ====================================================================
echo.

set "BACKEND_DIR=%~dp0task-api"
if not exist "%BACKEND_DIR%" set "BACKEND_DIR=%~dp0Task_Manager_API"

set "FRONTEND_DIR=%~dp0portfolio-24IT055"
if not exist "%FRONTEND_DIR%" set "FRONTEND_DIR=%~dp0portfolio"

echo [1/3] Starting Local MongoDB on Port 27017...
start "Local MongoDB Server (Port 27017)" cmd /k "cd /d "%BACKEND_DIR%" && node start-db.js"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Backend API on Port 3000...
start "Task Manager API (Port 3000)" cmd /k "cd /d "%BACKEND_DIR%" && node server.js"

timeout /t 1 /nobreak >nul

echo [3/3] Starting Frontend Dev Server on Port 5173...
start "React Portfolio & Tasks (Port 5173)" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

timeout /t 1 /nobreak >nul

echo Opening Browser at http://localhost:5173/tasks...
start http://localhost:5173/tasks

echo.
echo ====================================================================
echo   All services are up and running!
echo   - Local MongoDB:   mongodb://127.0.0.1:27017/taskdb
echo   - Backend API:     http://localhost:3000
echo   - Frontend:        http://localhost:5173
echo   - Tasks Page:      http://localhost:5173/tasks
echo   - Cache Telemetry: http://localhost:3000/api/debug/cache-stats
echo ====================================================================
echo.
pause
