@echo off
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
title ADB-QR - Android Wireless Connect
mode con: cols=88 lines=38
python "%~dp0adb-qr.py" %*
if errorlevel 1 (
  echo.
  echo ADB-QR bir hatayla kapandi.
  pause
)
