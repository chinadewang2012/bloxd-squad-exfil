@echo off
echo =======================================
echo BloxD API Downloader
echo =======================================
echo.
echo Opening all download links in browser...
echo.
echo Save each file with Ctrl+S to this folder:
echo %CD%
echo.
pause

start https://ghproxy.com/https://raw.githubusercontent.com/Bloxdy/code-api/main/API_REFERENCE.md
start https://ghproxy.com/https://raw.githubusercontent.com/Bloxdy/code-api/main/CALLBACKS.md
start https://ghproxy.com/https://raw.githubusercontent.com/Bloxdy/code-api/main/ENTITY_SETTINGS.md
start https://ghproxy.com/https://raw.githubusercontent.com/Bloxdy/code-api/main/BLOCK_NAMES.txt
start https://ghproxy.com/https://raw.githubusercontent.com/Bloxdy/code-api/main/ITEM_NAMES.txt

echo.
echo =======================================
echo 5 browser tabs opened!
echo =======================================
echo.
echo Press Ctrl+S in each tab to save.
echo.
pause
