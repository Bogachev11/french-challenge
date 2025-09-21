#!/usr/bin/env python3
"""
Ежедневный скриншот дашборда для создания таймлапса
"""

import os
import time
import subprocess
from datetime import datetime
from pathlib import Path

def main():
    # Настройки
    dashboard_url = "http://localhost:3000"
    screenshots_folder = Path("screenshots")
    browser_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    
    # Создаем папку для скриншотов
    screenshots_folder.mkdir(exist_ok=True)
    
    # Имя файла с текущей датой
    date_string = datetime.now().strftime("%Y-%m-%d")
    screenshot_path = screenshots_folder / f"dashboard_{date_string}.png"
    
    # Проверяем, есть ли уже скриншот за сегодня
    if screenshot_path.exists():
        print(f"Скриншот за {date_string} уже существует!")
        return
    
    print(f"Делаем скриншот за {date_string}...")
    
    try:
        # Команда для Chrome headless скриншота
        cmd = [
            browser_path,
            "--headless",
            "--disable-gpu",
            "--window-size=1200,800",
            f"--screenshot={screenshot_path}",
            dashboard_url
        ]
        
        # Запускаем команду
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if screenshot_path.exists():
            print(f"✅ Скриншот сохранен: {screenshot_path}")
        else:
            print("❌ Ошибка создания скриншота")
            print(f"Ошибка: {result.stderr}")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    main()
