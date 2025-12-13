import os
import subprocess
from pathlib import Path
from datetime import datetime

def create_video_from_screenshots():
    screenshots_dir = Path("screenshots")
    output_file = "dashboard_timelapse.mp4"
    
    if not screenshots_dir.exists():
        print(f"Папка {screenshots_dir} не найдена")
        return
    
    # Получаем все PNG файлы
    image_files = sorted(screenshots_dir.glob("dashboard_*.png"))
    
    if not image_files:
        print("Не найдено изображений в папке screenshots")
        return
    
    print(f"Найдено {len(image_files)} изображений")
    print(f"От {image_files[0].name} до {image_files[-1].name}")
    
    # Создаем временный файл со списком изображений для ffmpeg
    list_file = "image_list.txt"
    with open(list_file, "w", encoding="utf-8") as f:
        for img in image_files:
            f.write(f"file '{img.absolute()}'\n")
            f.write("duration 0.1667\n")  # 0.5 / 3 для ускорения в 3 раза
        # Последний кадр показываем дольше
        f.write(f"file '{image_files[-1].absolute()}'\n")
    
    try:
        # Используем concat demuxer для более точного контроля
        cmd = [
            "ffmpeg",
            "-f", "concat",
            "-safe", "0",
            "-i", list_file,
            "-vf", "fps=6",  # 2 * 3 для ускорения в 3 раза
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-y",  # Перезаписать если существует
            output_file
        ]
        
        print(f"Создаю видео {output_file}...")
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"Видео успешно создано: {output_file}")
        
    except subprocess.CalledProcessError as e:
        print(f"Ошибка при создании видео:")
        print(e.stderr)
        return
    except FileNotFoundError:
        print("ffmpeg не найден. Убедитесь, что ffmpeg установлен и доступен в PATH")
        return
    finally:
        # Удаляем временный файл
        if os.path.exists(list_file):
            os.remove(list_file)

if __name__ == "__main__":
    create_video_from_screenshots()

