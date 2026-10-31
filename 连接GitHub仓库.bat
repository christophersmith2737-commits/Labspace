@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo 请先在 GitHub 创建一个“空的私有仓库”，不要勾选 README、License 或 .gitignore。
echo 然后复制仓库的 HTTPS 地址，例如：
echo https://github.com/你的用户名/LabSpace.git
echo.
set /p REPO_URL=请输入 GitHub 仓库地址：

if "%REPO_URL%"=="" (
  echo [取消] 没有输入仓库地址。
  pause
  exit /b 1
)

echo %REPO_URL% | findstr /R /I "^https://github.com/.*\.git$" >nul
if errorlevel 1 (
  echo [错误] 请输入以 https://github.com/ 开头、以 .git 结尾的仓库地址。
  pause
  exit /b 1
)

git remote get-url origin >nul 2>&1
if errorlevel 1 (
  git remote add origin "%REPO_URL%"
) else (
  echo 当前 origin：
  git remote get-url origin
  set /p REPLACE_ORIGIN=是否替换为新地址？输入 Y 确认：
  if /I not "%REPLACE_ORIGIN%"=="Y" (
    echo [取消] 未修改 GitHub 地址。
    pause
    exit /b 0
  )
  git remote set-url origin "%REPO_URL%"
)

git branch -M main
echo.
echo GitHub 仓库已经连接：
git remote -v
echo.
echo 现在可以运行“提交并推送到GitHub.bat”。
pause
