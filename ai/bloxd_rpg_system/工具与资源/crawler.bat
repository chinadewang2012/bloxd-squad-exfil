@echo off
echo BloxD API Crawler
echo ==================
echo.

cd /d "%~dp0"

echo Downloading API files...
echo.

powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/Bloxdy/code-api/main/API_REFERENCE.md' -OutFile 'API_REFERENCE.md' -UseBasicParsing" 2>nul
if exist API_REFERENCE.md (
    echo [OK] API_REFERENCE.md
) else (
    echo [FAIL] API_REFERENCE.md
)

powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/Bloxdy/code-api/main/CALLBACKS.md' -OutFile 'CALLBACKS.md' -UseBasicParsing" 2>nul
if exist CALLBACKS.md (
    echo [OK] CALLBACKS.md
) else (
    echo [FAIL] CALLBACKS.md
)

powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/Bloxdy/code-api/main/ENTITY_SETTINGS.md' -OutFile 'ENTITY_SETTINGS.md' -UseBasicParsing" 2>nul
if exist ENTITY_SETTINGS.md (
    echo [OK] ENTITY_SETTINGS.md
) else (
    echo [FAIL] ENTITY_SETTINGS.md
)

powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/Bloxdy/code-api/main/BLOCK_NAMES.txt' -OutFile 'BLOCK_NAMES.txt' -UseBasicParsing" 2>nul
if exist BLOCK_NAMES.txt (
    echo [OK] BLOCK_NAMES.txt
) else (
    echo [FAIL] BLOCK_NAMES.txt
)

powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/Bloxdy/code-api/main/ITEM_NAMES.txt' -OutFile 'ITEM_NAMES.txt' -UseBasicParsing" 2>nul
if exist ITEM_NAMES.txt (
    echo [OK] ITEM_NAMES.txt
) else (
    echo [FAIL] ITEM_NAMES.txt
)

echo.
echo ==================
echo Download complete!
pause
