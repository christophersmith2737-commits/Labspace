@echo off
cd /d "%~dp0"

if not exist "node_modules\vinext\package.json" (
  echo [ERROR] Local dependencies are missing.
  echo Run npm install while connected to the Internet, then try again.
  pause
  exit /b 1
)

echo Starting the LabSpace local edition...
echo URL: http://127.0.0.1:5173/
echo Keep this window open. Press Ctrl+C to stop the local server.
echo.

if /I not "%LABSPACE_NO_BROWSER%"=="1" (
  start "" /b powershell -NoProfile -WindowStyle Hidden -Command "$u='http://127.0.0.1:5173/'; for($i=0;$i -lt 30;$i++){ try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 $u; if($r.StatusCode -eq 200){ Start-Process $u; exit 0 } } catch {}; Start-Sleep -Seconds 1 }; Start-Process $u"
)

call npm.cmd run dev

echo.
echo LabSpace local server has stopped.
pause
