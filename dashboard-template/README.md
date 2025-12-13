# Dashboard Template

Шаблон для создания дашборда с дизайном, аналогичным French Challenge Dashboard.

## Что включено

- ✅ Вертикальная центрированная верстка (`max-w-md mx-auto`)
- ✅ Оформление графиков Recharts (оси, сетка, шрифты)
- ✅ Шрифт Inter через Google Fonts
- ✅ Tailwind CSS конфигурация
- ✅ Примеры графиков (Line Chart, Bar Chart)
- ✅ Структура компонентов React

## Быстрый старт

### 1. Скопируйте файлы

Скопируйте все файлы из папки `dashboard-template` в корень вашего нового проекта.

### 2. Установите Recharts

Скачайте файл `recharts.js` и положите в корень проекта:

```bash
# Вариант 1: Скачать с CDN
curl -o recharts.js https://unpkg.com/recharts@2.10.3/umd/Recharts.js

# Вариант 2: Использовать CDN напрямую в index.html
# Замените <script src="recharts.js"></script> на:
# <script src="https://unpkg.com/recharts@2.10.3/umd/Recharts.js"></script>
```

### 3. Запустите локальный сервер

```bash
# Python
python -m http.server 3000

# Или Node.js (если установлен http-server)
npx http-server -p 3000
```

Откройте в браузере: http://localhost:3000

## Структура файлов

```
dashboard-template/
├── index.html      # HTML шаблон с подключением библиотек
├── styles.css      # Стили для графиков и оформления
├── app.js          # Пример React компонента с графиками
├── package.json    # Базовый package.json
└── README.md       # Эта инструкция
```

## Ключевые элементы дизайна

### Верстка

Основной контейнер использует классы Tailwind:
```html
<div class="max-w-md mx-auto bg-white min-h-screen border border-gray-300 px-1">
```

- `max-w-md` - максимальная ширина 448px
- `mx-auto` - центрирование по горизонтали
- `min-h-screen` - минимальная высота на весь экран
- `border border-gray-300` - серая рамка

### Графики

Все графики обернуты в `ResponsiveContainer`:

```javascript
React.createElement(ResponsiveContainer, { 
  width: "100%", 
  height: "100%" 
},
  React.createElement(LineChart, { 
    data: data, 
    margin: { left: 5, right: 10, top: 9, bottom: 0 } 
  },
    // XAxis, YAxis, Line и т.д.
  )
)
```

### Оси

Настройки осей для единообразного вида:

```javascript
React.createElement(XAxis, { 
  type: "number",
  dataKey: "day", 
  domain: [0, 10],
  tick: { fill: '#000000', fontSize: 12 },
  tickLine: { stroke: '#000000', strokeWidth: 1 }
})
```

### Шрифты

- Основной шрифт: **Inter** (подключен через Google Fonts)
- Размер шрифта на осях: **12px**
- Цвет текста: **#000000** (черный)

## Настройка под свой проект

### 1. Измените данные

В `app.js` замените `sampleData` на свои данные:

```javascript
const sampleData = [
  { day: 1, value: 10 },
  { day: 2, value: 15 },
  // ваши данные
];
```

### 2. Настройте графики

Добавьте или измените графики в компоненте `Dashboard`:

- `LineChart` - линейный график
- `BarChart` - столбчатый график
- `ComposedChart` - комбинированный график (линии + столбцы)

### 3. Измените цвета

В `app.js` измените цвета графиков:

```javascript
stroke: "#3b82f6"  // синий
fill: "#3b82f6"     // для столбцов
```

Или используйте цвета из Tailwind конфига:
- `data_categories.negative: '#e91e63'`
- `data_categories.neutral: '#03a9f4'`
- `data_categories.positive: '#4caf50'`
- `data_categories.suspended: '#673ab7'`

### 4. Настройте заголовки

Измените заголовки в `app.js`:

```javascript
React.createElement('h1', { 
  className: "text-3xl font-bold text-black" 
}, "Ваш заголовок")
```

## Дополнительные возможности

### Легенда

Для добавления легенды используйте компонент `Legend` из Recharts:

```javascript
React.createElement(Legend, {
  wrapperStyle: { paddingTop: '20px' },
  iconType: 'circle',
  iconSize: 8
})
```

### Tooltip

Для кастомных подсказок используйте `Tooltip`:

```javascript
React.createElement(Tooltip, {
  contentStyle: { 
    backgroundColor: '#fff', 
    border: '1px solid #ccc',
    borderRadius: '4px'
  }
})
```

### ReferenceLine

Для добавления вертикальных/горизонтальных линий:

```javascript
React.createElement(ReferenceLine, {
  x: 5,
  stroke: "#93c5fd",
  strokeWidth: 1,
  strokeOpacity: 0.5
})
```

## Полезные ссылки

- [Recharts документация](https://recharts.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React документация](https://react.dev/)
- [Google Fonts - Inter](https://fonts.google.com/specimen/Inter)

## Примечания

- Все стили для графиков находятся в `styles.css`
- Оси Y автоматически скрыты (только метки видны)
- Графики имеют отступ слева для правильного позиционирования
- Сетка графиков светло-серая (#f9fafb)

## Поддержка

Если возникли вопросы, проверьте:
1. Загружен ли `recharts.js` в корне проекта
2. Правильно ли подключены React и ReactDOM
3. Открыта ли консоль браузера для отладки



