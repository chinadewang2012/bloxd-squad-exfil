@echo off
echo ===================================
echo BloxD API Downloader
echo ===================================
echo.

set SAVE_PATH=%CD%

echo Step 1: API_REFERENCE.md
curl -L -o "%SAVE_PATH%\API_REFERENCE.md" "https://raw.githubusercontent.com/Bloxdy/code-api/main/API_REFERENCE.md" --ssl-no-revoke -s
timeout /t 1 >nul

echo Step 2: CALLBACKS.md
curl -L -o "%SAVE_PATH%\CALLBACKS.md" "https://raw.githubusercontent.com/Bloxdy/code-api/main/CALLBACKS.md" --ssl-no-revoke -s
timeout /t 1 >nul

echo Step 3: ENTITY_SETTINGS.md
curl -L -o "%SAVE_PATH%\ENTITY_SETTINGS.md" "https://raw.githubusercontent.com/Bloxdy/code-api/main/ENTITY_SETTINGS.md" --ssl-no-revoke -s
timeout /t 1 >nul

echo Step 4: BLOCK_NAMES.txt
curl -L -o "%SAVE_PATH%\BLOCK_NAMES.txt" "https://raw.githubusercontent.com/Bloxdy/code-api/main/BLOCK_NAMES.txt" --ssl-no-revoke -s
timeout /t 1 >nul

echo Step 5: ITEM_NAMES.txt
curl -L -o "%SAVE_PATH%\ITEM_NAMES.txt" "https://raw.githubusercontent.com/Bloxdy/code-api/main/ITEM_NAMES.txt" --ssl-no-revoke -s

echo.
echo ===================================
echo Download complete!
echo Files saved to: %SAVE_PATH%
echo ===================================
pause
