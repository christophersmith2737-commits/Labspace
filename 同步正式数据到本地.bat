@echo off
cd /d "%~dp0"

echo This replaces the local database with current production data.
echo The current local database will be backed up first.
echo Internet access is required only during synchronization.
echo.
set /p "CONFIRM=Enter SYNC to continue: "
if /I not "%CONFIRM%"=="SYNC" (
  echo [CANCELLED] Local data was not changed.
  pause
  exit /b 0
)

call npm.cmd run build
if errorlevel 1 (
  echo [ERROR] Build failed. Local data was not changed.
  pause
  exit /b 1
)

node scripts\sync-production-to-local.mjs
if errorlevel 1 (
  echo [ERROR] Synchronization failed. The local backup is still available.
  pause
  exit /b 1
)

echo.
echo [DONE] Production data was copied to the local edition.
pause
