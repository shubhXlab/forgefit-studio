@echo off
cd /d "%~dp0"
echo ==============================================
echo        ForgeFit Studio - MySQL Edition
echo ==============================================
echo.
echo Application URL:  http://localhost:3100
echo Admin Portal:     http://localhost:3100/admin
echo phpMyAdmin:       http://localhost/phpmyadmin/index.php?route=/database/structure^&db=forgefit
echo.
node src/index.js
pause
