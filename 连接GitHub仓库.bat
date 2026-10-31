@echo off
cd /d "%~dp0"

echo First create an empty private repository on GitHub.
echo Do not initialize it with a README, License, or .gitignore.
echo Example URL: https://github.com/USERNAME/LabSpace.git
echo.
set /p "REPO_URL=Enter the GitHub HTTPS repository URL: "

if "%REPO_URL%"=="" (
  echo [CANCELLED] No repository URL was entered.
  pause
  exit /b 1
)

echo %REPO_URL% | findstr /R /I "^https://github.com/.*\.git$" >nul
if errorlevel 1 (
  echo [ERROR] The URL must start with https://github.com/ and end with .git
  pause
  exit /b 1
)

git remote get-url origin >nul 2>&1
if errorlevel 1 (
  git remote add origin "%REPO_URL%"
) else (
  echo Current origin:
  git remote get-url origin
  set /p "REPLACE_ORIGIN=Replace it with the new URL? Enter Y to confirm: "
  if /I not "%REPLACE_ORIGIN%"=="Y" (
    echo [CANCELLED] The GitHub URL was not changed.
    pause
    exit /b 0
  )
  git remote set-url origin "%REPO_URL%"
)

git branch -M main
echo.
echo GitHub repository connected:
git remote -v
echo.
echo Next, run the GitHub push batch file.
pause
