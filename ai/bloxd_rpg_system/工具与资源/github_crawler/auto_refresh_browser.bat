@echo off
chcp 65001 >nul
echo ========================================
echo BloxD API 自动刷新工具
echo ========================================
echo.
echo 正在打开所有API文档下载页面...
echo.
echo 请按以下步骤操作：
echo 1. 每个文件会在浏览器中打开
echo 2. 按 Ctrl+S 保存
echo 3. 保存到: F:\ai\bloxd_rpg_system\新建文件夹\
echo.
echo 按回车键开始...
pause >nul

echo.
echo [1/9] API_REFERENCE.md (核心API文档)...
start "" "https://raw.githubusercontent.com/Bloxdy/code-api/main/API_REFERENCE.md"
timeout /t 3 /nobreak >nul

echo [2/9] CALLBACKS.md (回调函数)...
start "" "https://raw.githubusercontent.com/Bloxdy/code-api/main/CALLBACKS.md"
timeout /t 3 /nobreak >nul

echo [3/9] CLIENT_OPTIONS.md (客户端选项)...
start "" "https://raw.githubusercontent.com/Bloxdy/code-api/main/CLIENT_OPTIONS.md"
timeout /t 3 /nobreak >nul

echo [4/9] ENTITY_SETTINGS.md (实体设置)...
start "" "https://raw.githubusercontent.com/Bloxdy/code-api/main/ENTITY_SETTINGS.md"
timeout /t 3 /nobreak >nul

echo [5/9] SKINS_AND_POSES.md (皮肤和姿势)...
start "" "https://raw.githubusercontent.com/Bloxdy/code-api/main/SKINS_AND_POSES.md"
timeout /t 3 /nobreak >nul

echo [6/9] SOUNDS_AND_MUSIC.md (声音和音乐)...
start "" "https://raw.githubusercontent.com/Bloxdy/code-api/main/SOUNDS_AND_MUSIC.md"
timeout /t 3 /nobreak >nul

echo [7/9] BLOCK_NAMES.txt (方块名称)...
start "" "https://raw.githubusercontent.com/Bloxdy/code-api/main/BLOCK_NAMES.txt"
timeout /t 3 /nobreak >nul

echo [8/9] ITEM_NAMES.txt (物品名称)...
start "" "https://raw.githubusercontent.com/Bloxdy/code-api/main/ITEM_NAMES.txt"
timeout /t 3 /nobreak >nul

echo [9/9] README.md (说明文档)...
start "" "https://raw.githubusercontent.com/Bloxdy/code-api/main/README.md"

echo.
echo ========================================
echo 所有页面已打开！
echo ========================================
echo.
echo 请逐个按 Ctrl+S 保存文件到：
echo F:\ai\bloxd_rpg_system\新建文件夹\
echo.
echo 保存文件名：
echo  1. API_REFERENCE.md
echo  2. CALLBACKS.md
echo  3. CLIENT_OPTIONS.md
echo  4. ENTITY_SETTINGS.md
echo  5. SKINS_AND_POSES.md
echo  6. SOUNDS_AND_MUSIC.md
echo  7. BLOCK_NAMES.txt
echo  8. ITEM_NAMES.txt
echo  9. README.md
echo.
pause
