@echo off
title Crypto AI Analysis Pro - Server
color 0A
echo ====================================================
echo    KHOI DONG HE THONG CRYPTO AI ANALYSIS PRO
echo ====================================================
echo.
echo 1. Dang khoi dong Server (vui long khong tat cua so nay)...
cd /d "%~dp0"

:: Start the server in a new minimized window
start /min "CryptoServer" npm run dev

echo 2. Doi Server san sang (5 giay)...
timeout /t 5 >nul

echo 3. Mo Giao dien App...
:: Open standard Chrome window with flags to prevent background sleeping
start chrome --new-window --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows http://localhost:3000

echo.
echo ====================================================
echo    DANG CHAY THANH CONG!
echo    - Ban co the thu nho cua so nay xuong.
echo    - TUYET DOI KHONG TAT no de nhan tin nhan Telegram.
echo ====================================================
pause
