@echo off
chcp 65001 >nul
echo =======================================
echo BloxD API Download Tool
echo =======================================
echo.
echo This tool will open browser tabs for all API documents
echo.
echo Press any key to start...
pause >nul

cls
echo =======================================
echo Opening download links...
echo =======================================
echo.

rem Open each link in browser
start "" "https://raw.githubusercontent.com/Bloxdy/code-api/main/API_REFERENCE.md"
timeout /t 2 /nobreak >nul

start "" "https://raw.githubusercontent.com/Bloxdy/code-api/main/CALLBACKS.md"
timeout /t 2 /nobreak >nul

start "" "https://raw.githubusercontent.com/Bloxdy/code-api/main/CLIENT_OPTIONS.md"
timeout /t 2 /nobreak >nul

start "" "https://raw.githubusercontent.com/Bloxdy/code-api/main/ENTITY_SETTINGS.md"
timeout /t 2 /nobreak >nul

start "" "https://raw.githubusercontent.com/Bloxdy/code-api/main/SKINS_AND_POSES.md"
timeout /t 2 /nobreak >nul

start "" "https://raw.githubusercontent.com/Bloxdy/code-api/main/SOUNDS_AND_MUSIC.md"
timeout /t 2 /nobreak >nul

start "" "https://raw.githubusercontent.com/Bloxdy/code-api/main/BLOCK_NAMES.txt"
timeout /t 2 /nobreak >nul

start "" "https://raw.githubusercontent.com/Bloxdy/code-api/main/ITEM_NAMES.txt"
timeout /t 2 /nobreak >nul

start "" "https://raw.githubusercontent.com/Bloxdy/code-api/main/README.md"
timeout /t 2 /nobreak >nul

start "" "https://raw.githubusercontent.com/Bloxdy/code-api/main/QTE_DOCS.md"
timeout /t 2 /nobreak >nul

start "" "https://raw.githubusercontent.com/Bloxdy/code-api/main/ICONS.md"

echo.
echo =======================================
echo All links opened!
echo =======================================
echo.
echo Steps:
echo 1. Browser opened multiple tabs
echo 2. Switch to each tab
echo 3. Press Ctrl+S to save
echo 4. Make sure filename is correct
echo 5. Save location: %CD%
echo.
echo Files to download:
echo   - API_REFERENCE.md
echo   - CALLBACKS.md
echo   - CLIENT_OPTIONS.md
echo   - ENTITY_SETTINGS.md
echo   - SKINS_AND_POSES.md
echo   - SOUNDS_AND_MUSIC.md
echo   - BLOCK_NAMES.txt
echo   - ITEM_NAMES.txt
echo   - README.md
echo   - QTE_DOCS.md
echo   - ICONS.md
echo.
echo =======================================
pause
