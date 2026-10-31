@echo off
cd /d "%~dp0"

if not exist ".wrangler\state\" (
  echo [INFO] No local database exists yet.
  echo Start LabSpace once before creating a backup.
  pause
  exit /b 0
)

powershell -NoProfile -Command "$stamp=Get-Date -Format 'yyyyMMdd-HHmmss'; $dst=Join-Path 'backups' ('local-data-'+$stamp); New-Item -ItemType Directory -Force -Path $dst | Out-Null; Copy-Item -LiteralPath '.wrangler\state' -Destination $dst -Recurse -Force; Write-Host ('Backup created at: '+(Resolve-Path $dst))"

pause
