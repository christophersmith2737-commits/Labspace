@echo off
chcp 65001 >nul
cd /d "%~dp0"

git remote get-url origin >nul 2>&1
if errorlevel 1 (
  echo [错误] 尚未连接 GitHub。请先运行“连接GitHub仓库.bat”。
  pause
  exit /b 1
)

echo 第一步：检查网站能否正常构建...
call npm run build
if errorlevel 1 (
  echo.
  echo [停止] 构建失败，没有提交或推送任何内容。
  pause
  exit /b 1
)

echo.
echo 第二步：查看本次更改...
git status --short
echo.
set /p COMMIT_MSG=请输入本次修改说明（直接回车使用默认说明）：
if "%COMMIT_MSG%"=="" set "COMMIT_MSG=Update LabSpace"

git add -A
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "%COMMIT_MSG%"
  if errorlevel 1 (
    echo [错误] Git 提交失败。
    pause
    exit /b 1
  )
) else (
  echo 没有新的文件需要提交，将直接同步已有提交。
)

echo.
echo 第三步：推送到 GitHub...
git push -u origin main
if errorlevel 1 (
  echo.
  echo [错误] 推送失败。首次推送时可能需要在浏览器中登录 GitHub。
  pause
  exit /b 1
)

echo.
echo [完成] 本地修改已经推送到 GitHub。
pause
