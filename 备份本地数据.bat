@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist ".wrangler\state\" (
  echo [提示] 还没有本地数据库。请先运行“启动LabSpace本地版.bat”并使用一次网站。
  pause
  exit /b 0
)

powershell -NoProfile -Command "$stamp=Get-Date -Format 'yyyyMMdd-HHmmss'; $dst=Join-Path 'backups' ('local-data-'+$stamp); New-Item -ItemType Directory -Force -Path $dst | Out-Null; Copy-Item -LiteralPath '.wrangler\state' -Destination $dst -Recurse -Force; Write-Host ('本地数据已备份到：'+(Resolve-Path $dst))"

pause
