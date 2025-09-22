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
  
  // Загружаем страницу
  await page.goto('https://bogachev11.github.io/french-challenge', {
    waitUntil: 'networkidle0',
    timeout: 60000
  });
  
  // Ждем загрузки графиков
  await page.waitForSelector('.recharts-cartesian-axis', { timeout: 30000 });
  
  // Создаем папку для скриншотов
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  // Генерируем имя файла с датой
  const today = new Date().toISOString().split('T')[0];
  const screenshotPath = path.join(screenshotsDir, `dashboard_${today}.png`);
  
  console.log(`📸 Делаем скриншот: ${screenshotPath}`);
  
  // Делаем скриншот
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
    type: 'png'
  });
  
  await browser.close();
  
  console.log('✅ Скриншот готов!');
  
  return screenshotPath;
}

// Запускаем если файл вызван напрямую
if (require.main === module) {
  takeScreenshot().catch(console.error);
}

module.exports = takeScreenshot;
