const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function takeScreenshot() {
  console.log('🚀 Запускаем браузер...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Устанавливаем размер окна
  await page.setViewport({
    width: 1200,
    height: 800,
    deviceScaleFactor: 2 // Для четкости
  });
  
  console.log('📊 Загружаем дашборд...');
  
  // Пробуем загрузить страницу с несколькими попытками
  let loaded = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Попытка ${attempt}/3...`);
      await page.goto('https://bogachev11.github.io/french-challenge', {
        waitUntil: 'domcontentloaded', // Менее строгое ожидание
        timeout: 30000
      });
      
      // Ждем загрузки графиков и данных
      try {
        await page.waitForSelector('.recharts-cartesian-axis', { timeout: 15000 });
        console.log('✅ Графики найдены');
        
        // Дополнительно ждем загрузки данных в графиках
        await page.waitForFunction(() => {
          const charts = document.querySelectorAll('.recharts-cartesian-axis-tick-value');
          return charts.length > 0;
        }, { timeout: 10000 });
        console.log('✅ Данные в графиках загружены');
        
        // Ждем еще немного для полной отрисовки и анимации
        await page.waitForTimeout(5000);
        console.log('✅ Графики полностью готовы');
      } catch (e) {
        console.log('⚠️ Графики не найдены, но продолжаем...');
      }
      
      loaded = true;
      break;
    } catch (error) {
      console.log(`❌ Попытка ${attempt} не удалась:`, error.message);
      if (attempt < 3) {
        console.log('⏳ Ждем 5 секунд перед следующей попыткой...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  if (!loaded) {
    throw new Error('Не удалось загрузить страницу после 3 попыток');
  }
  
  // Создаем папку для скриншотов
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  // Генерируем имя файла с датой
  const today = new Date().toISOString().split('T')[0];
  const screenshotPath = path.join(screenshotsDir, `dashboard_${today}.png`);
  
  console.log(`📸 Делаем скриншот: ${screenshotPath}`);
  
  // Находим основной контейнер дашборда
  const dashboardElement = await page.$('div.max-w-md.mx-auto.bg-white.min-h-screen.border.border-gray-300.px-1');
  
  if (dashboardElement) {
    console.log('📸 Делаем скриншот основного контейнера...');
    await dashboardElement.screenshot({
      path: screenshotPath,
      type: 'png'
    });
  } else {
    console.log('⚠️ Основной контейнер не найден, делаем скриншот всей страницы...');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      type: 'png'
    });
  }
  
  await browser.close();
  
  console.log('✅ Скриншот готов!');
  
  return screenshotPath;
}

// Запускаем если файл вызван напрямую
if (require.main === module) {
  takeScreenshot().catch(console.error);
}

module.exports = takeScreenshot;
