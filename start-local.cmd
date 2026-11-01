@echo off
setlocal
cd /d "%~dp0"

set "LABSPACE_URL=http://127.0.0.1:5173/"

rem If LabSpace is already running, just open it instead of starting a second server.
powershell -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 '%LABSPACE_URL%'; if ($r.StatusCode -eq 200 -and $r.Content -match 'LabSpace') { exit 0 } } catch {}; exit 1" >nul 2>nul
if not errorlevel 1 (
  echo LabSpace is already running.
  echo Opening %LABSPACE_URL%
  start "" "%LABSPACE_URL%"
  exit /b 0
)

where node.exe >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found.
  echo Install Node.js 22 or newer, then try again.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found.
  echo Reinstall Node.js and enable the option that adds it to PATH.
  pause
  exit /b 1
)

if not exist "node_modules\vinext\package.json" (
  echo [ERROR] Local dependencies are missing.
  echo Run npm install while connected to the Internet, then try again.
  pause
  exit /b 1
)

echo Starting the LabSpace local edition...
echo URL: %LABSPACE_URL%
echo Keep this window open. Press Ctrl+C to stop the local server.
echo.

if /I not "%LABSPACE_NO_BROWSER%"=="1" (
  start "" /b powershell -NoProfile -WindowStyle Hidden -Command "$u='%LABSPACE_URL%'; for($i=0;$i -lt 60;$i++){ try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 $u; if($r.StatusCode -eq 200){ Start-Process $u; exit 0 } } catch {}; Start-Sleep -Seconds 1 }; Start-Process $u"
)

call npm.cmd run dev

echo.
echo LabSpace local server has stopped.
pause

