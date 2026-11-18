@echo off
echo ===================================
echo BloxD API Crawler
echo ===================================
echo.
echo Downloading remaining files...
echo.

cd /d "%~dp0"

set API_DIR=..\bloxd代码\API文档
if not exist "%API_DIR%" mkdir "%API_DIR%"

echo [1/3] BLOCK_NAMES.txt
curl -L -o "%API_DIR%\BLOCK_NAMES.txt" "https://raw.githubusercontent.com/Bloxdy/code-api/main/BLOCK_NAMES.txt" --ssl-no-revoke -s
timeout /t 1 >nul

echo [2/3] ITEM_NAMES.txt
curl -L -o "%API_DIR%\ITEM_NAMES.txt" "https://raw.githubusercontent.com/Bloxdy/code-api/main/ITEM_NAMES.txt" --ssl-no-revoke -s
timeout /t 1 >nul

echo [3/3] SOUNDS_AND_MUSIC.md
curl -L -o "%API_DIR%\SOUNDS_AND_MUSIC.md" "https://raw.githubusercontent.com/Bloxdy/code-api/main/SOUNDS_AND_MUSIC.md" --ssl-no-revoke -s

echo.
echo ===================================
echo Download complete!
echo Files saved to: %API_DIR%
echo ===================================
pause
