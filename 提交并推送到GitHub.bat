@echo off
cd /d "%~dp0"

git remote get-url origin >nul 2>&1
if errorlevel 1 (
  echo [ERROR] No GitHub repository is connected.
  echo Run the GitHub connection batch file first.
  pause
  exit /b 1
)

echo Step 1: Building and checking the website...
call npm.cmd run build
if errorlevel 1 (
  echo.
  echo [STOPPED] Build failed. Nothing was committed or pushed.
  pause
  exit /b 1
)

echo.
echo Step 2: Reviewing changed files...
git status --short
echo.
set /p "COMMIT_MSG=Enter a short change description or press Enter for the default: "
if "%COMMIT_MSG%"=="" set "COMMIT_MSG=Update LabSpace"

git add -A
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "%COMMIT_MSG%"
  if errorlevel 1 (
    echo [ERROR] Git commit failed.
    pause
    exit /b 1
  )
) else (
  echo There are no new files to commit. Existing commits will be pushed.
)

echo.
echo Step 3: Pushing to GitHub...
git push -u origin main
if errorlevel 1 (
  echo.
  echo [ERROR] Push failed. The first push may require GitHub browser sign-in.
  pause
  exit /b 1
)

echo.
echo [DONE] Local changes were pushed to GitHub.
pause
