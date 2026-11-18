@echo off
rem =====================================================
rem  Zero Dam 400x200 builder + auto shutdown
rem  Shuts down 60s after the build finishes.
rem  Works no matter what time it is (even past 00:00).
rem  Cancel countdown with:  shutdown /a
rem =====================================================
cd /d "%~dp0"
echo ============================================
echo   Zero Dam 400x200 blueprint builder
echo ============================================
python build_dam.py
if errorlevel 1 goto fail
echo.
echo Build OK. PC will shut down in 60 seconds...
echo (cancel with: shutdown /a)
shutdown /s /t 60 /c "ZeroDam blueprints done - auto shutdown"
timeout /t 70 >nul
exit /b 0
:fail
echo BUILD FAILED - shutdown cancelled. Press any key to exit.
pause >nul
