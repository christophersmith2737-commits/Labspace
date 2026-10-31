@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist "node_modules\" (
  echo [错误] 本地依赖不存在，首次安装需要联网运行 npm install。
  pause
  exit /b 1
)

echo 正在启动 LabSpace 本地版...
echo 地址：http://127.0.0.1:5173/
echo 保持此窗口开启；按 Ctrl+C 可停止本地服务。
echo.

start "" /b powershell -NoProfile -WindowStyle Hidden -Command "$u='http://127.0.0.1:5173/'; for($i=0;$i -lt 30;$i++){ try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 $u; if($r.StatusCode -eq 200){ Start-Process $u; exit 0 } } catch {}; Start-Sleep -Seconds 1 }; Start-Process $u"
call npm run dev

echo.
echo LabSpace 本地服务已停止。
pause
