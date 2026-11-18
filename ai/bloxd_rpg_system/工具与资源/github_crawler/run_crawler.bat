@echo off
chcp 65001 >nul
title GitHub代码库爬取工具
echo ========================================
echo GitHub 代码库定期爬取工具
echo ========================================
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Python，请先安装Python 3.7+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [信息] Python已安装
echo.

REM 检查依赖库
echo [信息] 检查依赖库...
python -c "import requests" >nul 2>&1
if errorlevel 1 (
    echo [信息] 正在安装requests库...
    pip install requests -i https://pypi.tuna.tsinghua.edu.cn/simple
)

python -c "import schedule" >nul 2>&1
if errorlevel 1 (
    echo [信息] 正在安装schedule库...
    pip install schedule -i https://pypi.tuna.tsinghua.edu.cn/simple
)

echo [信息] 依赖检查完成
echo.

REM 菜单
:menu
echo ========================================
echo 请选择操作:
echo ========================================
echo 1. 立即执行爬取 (单次)
echo 2. 启动定时服务 (每24小时自动爬取)
echo 3. 创建示例配置文件
echo 4. 添加新仓库
echo 5. 查看日志
echo 6. 退出
echo.
set /p choice=请输入选项 (1-6): 

if "%choice%"=="1" goto run_once
if "%choice%"=="2" goto run_schedule
if "%choice%"=="3" goto init_config
if "%choice%"=="4" goto add_repo
if "%choice%"=="5" goto view_log
if "%choice%"=="6" goto exit

echo [错误] 无效选项，请重新输入
echo.
goto menu

:run_once
echo.
echo [信息] 开始执行单次爬取...
python github_crawler.py --run-once
echo.
echo [信息] 爬取完成！按任意键返回菜单...
pause >nul
goto menu

:run_schedule
echo.
echo [信息] 启动定时服务...
echo [提示] 按 Ctrl+C 停止服务
echo.
python github_crawler.py
echo.
echo [信息] 服务已停止，按任意键返回菜单...
pause >nul
goto menu

:init_config
echo.
echo [信息] 创建示例配置文件...
python github_crawler.py --init
echo.
echo [信息] 配置文件创建完成！按任意键返回菜单...
pause >nul
goto menu

:add_repo
echo.
echo [提示] 请输入仓库信息
echo 格式: 所有者 仓库名 分支名
echo 示例: microsoft vscode main
echo.
set /p owner=仓库所有者: 
set /p repo=仓库名: 
set /p branch=分支名 (默认main): 
if "!branch!"=="" set branch=main

echo.
echo [信息] 添加仓库 %owner%/%repo% (%branch%)...
python github_crawler.py --add-repo %owner% %repo% %branch%
echo.
echo [信息] 添加完成！按任意键返回菜单...
pause >nul
goto menu

:view_log
echo.
echo [信息] 显示最近50行日志...
echo ========================================
if exist crawler.log (
    powershell -Command "Get-Content crawler.log -Tail 50"
) else (
    echo [信息] 暂无日志文件
)
echo ========================================
echo.
echo [信息] 按任意键返回菜单...
pause >nul
goto menu

:exit
echo.
echo [信息] 感谢使用！再见！
timeout /t 2 >nul
exit /b 0
