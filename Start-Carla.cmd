@echo off
cd /d "%~dp0"
if not exist "node_modules\next" (
  echo Install dependencies first with npm install.
  pause
  exit /b 1
)
echo Carla Diamonds will be available at http://127.0.0.1:3000
call npm.cmd run dev
