# PowerShell скрипт для ежедневных скриншотов дашборда
# Запускать каждый день в одно время

# Настройки
$browserPath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$dashboardUrl = "http://localhost:3000"
$screenshotsFolder = "D:\Sync\projects\20250920_a2_b1_dash_v2\screenshots"
$waitTime = 5  # секунд на загрузку страницы

# Создаем папку для скриншотов если её нет
if (!(Test-Path $screenshotsFolder)) {
    New-Item -ItemType Directory -Path $screenshotsFolder -Force
}

# Получаем текущую дату для имени файла
$dateString = Get-Date -Format "yyyy-MM-dd"
$screenshotPath = "$screenshotsFolder\dashboard_$dateString.png"

# Проверяем, есть ли уже скриншот за сегодня
if (Test-Path $screenshotPath) {
    Write-Host "Скриншот за $dateString уже существует!"
    exit
}

# Запускаем локальный сервер в фоне (если не запущен)
$serverProcess = Get-Process -Name "python" -ErrorAction SilentlyContinue
if (-not $serverProcess) {
    Write-Host "Запускаем локальный сервер..."
    Start-Process -FilePath "python" -ArgumentList "-m", "http.server", "3000" -WindowStyle Hidden
    Start-Sleep -Seconds 3
}

# Открываем браузер и делаем скриншот
Write-Host "Открываем дашборд и делаем скриншот..."

try {
    # Запускаем Chrome в режиме скриншота
    $chromeArgs = @(
        "--headless",
        "--disable-gpu",
        "--window-size=1200,800",
        "--screenshot=`"$screenshotPath`"",
        $dashboardUrl
    )
    
    Start-Process -FilePath $browserPath -ArgumentList $chromeArgs -Wait
    
    if (Test-Path $screenshotPath) {
        Write-Host "✅ Скриншот сохранен: $screenshotPath"
    } else {
        Write-Host "❌ Ошибка создания скриншота"
    }
} catch {
    Write-Host "❌ Ошибка: $($_.Exception.Message)"
}

Write-Host "Готово!"
