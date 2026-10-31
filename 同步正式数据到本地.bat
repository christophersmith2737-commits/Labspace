@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo 此操作会用正式网站的当前数据替换本地数据库。
echo 原本的本地数据会先自动备份到 backups 文件夹。
echo 此同步步骤需要联网；同步完成后仍可离线使用。
echo.
set /p CONFIRM=请输入 SYNC 继续：
if /I not "%CONFIRM%"=="SYNC" (
  echo [取消] 没有修改本地数据。
  pause
  exit /b 0
)

call npm run build
if errorlevel 1 (
  echo [错误] 构建失败，没有修改本地数据。
  pause
  exit /b 1
)

node scripts\sync-production-to-local.mjs
if errorlevel 1 (
  echo [错误] 正式数据同步失败，原本地数据备份仍然保留。
  pause
  exit /b 1
)

echo.
echo [完成] 正式网站当前数据已经复制到本地离线版。
pause
