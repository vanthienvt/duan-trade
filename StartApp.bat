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
:: Try opening in Chrome App Mode (No tabs, looks like real app)
start chrome --app=http://localhost:3000

echo.
echo ====================================================
echo    DANG CHAY THANH CONG!
echo    - Ban co the thu nho cua so nay xuong.
echo    - TUYET DOI KHONG TAT no de nhan tin nhan Telegram.
echo ====================================================
pause
