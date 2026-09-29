@echo off
echo ================================================
echo   Pushing EVI project to GitHub
echo ================================================
echo.
cd /d "%~dp0"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin https://github.com/jaxsonduffin-coder/evi-app.git
git push -u origin main
echo.
echo ================================================
echo   Done! If you see an error above, take a
echo   screenshot and send it to Claude.
echo   If a browser window popped up asking you to
echo   log into GitHub, log in there first.
echo ================================================
pause
