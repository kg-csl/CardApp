@echo off
cls

echo Starting React Frontend...
start "React App" cmd /k "npm run dev"

echo Starting Node Backend Server...
start "Backend Server" cmd /k "npm run start-server"