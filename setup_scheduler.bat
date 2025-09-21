@echo off
echo Настройка автоматических скриншотов дашборда
echo.

REM Создаем задачу в планировщике Windows
schtasks /create /tn "DailyDashboardScreenshot" /tr "powershell.exe -ExecutionPolicy Bypass -File \"%~dp0daily_screenshot.ps1\"" /sc daily /st 18:00 /f

echo.
echo ✅ Задача создана! Скриншоты будут делаться каждый день в 18:00
echo.
echo Для изменения времени запустите:
echo schtasks /change /tn "DailyDashboardScreenshot" /st НОВОЕ_ВРЕМЯ
echo.
echo Для удаления задачи:
echo schtasks /delete /tn "DailyDashboardScreenshot" /f
echo.
pause
