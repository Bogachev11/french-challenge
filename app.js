// Check library availability
if (typeof React === 'undefined') {
  console.error('React not loaded');
}
if (typeof Recharts === 'undefined') {
  console.error('Recharts not loaded');
}

const { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, ComposedChart, Dot, ReferenceLine, Label } = Recharts;

// Функция для получения цвета по значению настроения (градиент от красного к синему)
const getMoodColor = (value) => {
  if (value <= 1) return '#ef4444'; // красный для 1
  if (value <= 2) return '#ef4444'; // красный для 2
  if (value <= 3) return '#8b5cf6'; // фиолетовый для 3
  if (value <= 4) return '#3b82f6'; // синий для 4
  return '#1d4ed8'; // темно-синий для 5
};

// Кастомный компонент для точек настроения
const MoodDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload || payload.mood === null) return null;
  
  const color = getMoodColor(payload.mood);
  
  return React.createElement('circle', {
    key: `mood-${payload.day}`,
    cx: cx,
    cy: cy,
    r: 3,
    fill: color,
    fillOpacity: 0.3
  });
};

// Кастомный компонент для кружочков уроков
const LessonDots = (props) => {
  const { cx, cy, payload } = props;
  if (!payload || payload.dailyLessons === 0) return null;
  
  const lessonCount = payload.dailyLessons;
  const dots = [];
  
  for (let i = 0; i < lessonCount; i++) {
    dots.push(
      React.createElement('circle', {
        key: `lesson-${i}`,
        cx: cx,
        cy: cy - (i * 8), // Смещение вверх для каждого урока
        r: 3,
        fill: '#9ca3af',
        fillOpacity: 0.8
      })
    );
  }
  
  return React.createElement('g', null, ...dots);
};

// Кастомный компонент для надписи "forecast" под последней точкой
const ForecastDot = (props) => {
  const { cx, cy, payload, displayCurrentDay, completedLessons } = props;
  
  // Показываем надпись только для последней точки cumulative progress
  if (payload && payload.day === displayCurrentDay) {
    return React.createElement('text', {
      x: cx - 2,
      y: cy + 15, // под точкой на 15px ниже
      textAnchor: 'start',
      fill: '#93c5fd',
      fontSize: '12px',
      style: { pointerEvents: 'none' }
    }, 'forecast');
  }
  
  return null;
};

// Кастомный компонент для выделения текущего дня на оси X
const CustomXAxisTick = (props) => {
  const { x, y, payload, currentDay, hideLabels, forecastEndDay } = props;
  const isCurrentDay = payload.value === currentDay;
  const isForecastEndDay = payload.value === forecastEndDay;
  
  // Показываем лейбл только для текущего дня и дня прогноза
  if (hideLabels && !isCurrentDay && !isForecastEndDay) {
    return React.createElement('g', { transform: `translate(${x},${y})` });
  }
  
  // Скрываем подписи для 1, 10, 30, 60, 90 если текущий день рядом (но не для дня прогноза)
  const specialDays = [1, 10, 30, 60, 90];
  const shouldHideSpecialDay = specialDays.includes(payload.value) && 
    Math.abs(payload.value - currentDay) <= 2 && !isForecastEndDay;
  
  if (shouldHideSpecialDay) {
    return React.createElement('g', { transform: `translate(${x},${y})` });
  }
  
  return React.createElement('g', { transform: `translate(${x},${y})` },
    React.createElement('text', {
      x: 0,
      y: 0,
      dy: 10,
      textAnchor: "middle",
      fill: isCurrentDay ? '#000000' : (isForecastEndDay ? '#93c5fd' : '#666666'),
      fontWeight: isCurrentDay ? 'bold' : 'normal',
      fontSize: 12
    }, payload.value)
  );
};

// Function for formatting update time
const getUpdateTimeText = (updateTime) => {
  const now = new Date();
  const diffMs = now - updateTime;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  console.log('getUpdateTimeText called with:', updateTime, 'Diff minutes:', Math.floor(diffMs / (1000 * 60)));

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24 && diffDays === 0) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays >= 2) {
    return '2+ days ago';
  }
  
  return 'today';
};

// Time is now managed only through update-log.json file

// GitHub API calls removed - time updates handled by GitHub Actions only

// Data hash calculation removed - handled by GitHub Actions

const FrenchChallengeDashboard = () => {
  // State for Google Sheets data
  const [sheetData, setSheetData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [lastUpdateTime, setLastUpdateTime] = React.useState(new Date(Date.now() - 24 * 60 * 60 * 1000)); // Default to yesterday
  const [hoveredCategory, setHoveredCategory] = React.useState(null); // For Daily Time hover highlighting
  // previousDataHash removed - no longer needed
  
  // Load last update time from update-log.json
  React.useEffect(() => {
    const loadUpdateTime = async () => {
      try {
        console.log('🔄 Loading update-log.json...');
        const response = await fetch('./update-log.json');
        
        if (response.ok) {
          const data = await response.json();
          console.log('📄 Raw file data:', data);
          
          if (data.lastUpdateTime) {
            setLastUpdateTime(new Date(data.lastUpdateTime));
            console.log('✅ Loaded last update time:', new Date(data.lastUpdateTime));
          }
        } else {
          console.log('❌ Failed to load update-log.json:', response.status);
        }
      } catch (error) {
        console.log('❌ Error loading update-log.json:', error);
        setLastUpdateTime(new Date(Date.now() - 24 * 60 * 60 * 1000));
      }
    };
    
    loadUpdateTime();
  }, []);
  
  // Google Sheets API settings
  const SHEET_ID = '1h-5h_20vKLjIq9t0YlFf5BvPDMOaKURfbzZuNSyTyZ4';
  const API_KEY = 'AIzaSyBOewv068qAmujAaU5du_-VqAfqzzjkgGM';
  const RANGE = '90_days_list!A2:O'; // Extend to column O to include new categories
  
  // Load data from Google Sheets
  React.useEffect(() => {
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}&t=${Date.now()}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache',
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`API fetch failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API data:', data);
        
        const formattedData = data.values
          .filter(row => row.length >= 2 && row[1])
          .map((row, index) => ({
              day: parseInt(row[1]) || (index + 1),
              completedLessons: row[2] || '',
              attemptedLessons: row[3] || '',
              theoryTime: parseInt(row[4]) || 0,
              homeworkTime: parseInt(row[5]) || 0,
              prolingvoTime: parseInt(row[6]) || 0,
              otherTime: parseInt(row[7]) || 0,
              mood: parseFloat(row[8]) || null,
              // Новые категории (появляются с 15 дня). Колонки: K–O → индексы 10–14
              readingTime: parseInt(String(row[10] ?? '').trim()) || 0, // K: Read
              writingTime: parseInt(String(row[11] ?? '').trim()) || 0, // L: Write
              speakingTime: parseInt(String(row[12] ?? '').trim()) || 0, // M: Speak
              listeningTime: parseInt(String(row[13] ?? '').trim()) || 0, // N: Listen
              grammarTime: parseInt(String(row[14] ?? '').trim()) || 0  // O: Grammar
            }));

        // Debug: показать первые дни с новыми категориями
        const debug15 = formattedData.find(d => d.day === 15);
        if (debug15) {
          console.log('DT debug day15:', {
            reading: debug15.readingTime,
            writing: debug15.writingTime,
            speaking: debug15.speakingTime,
            listening: debug15.listeningTime,
            grammar: debug15.grammarTime
          });
        }
        
        setSheetData(formattedData);
        setError(null);
        
        console.log('Formatted data:', formattedData);
        console.log('✅ Data loaded successfully - time managed by GitHub Actions');
        
      } catch (apiError) {
        console.error('API failed:', apiError);
        setError(`Loading error: ${apiError.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Используем данные из Google Sheets
  const testData = sheetData;
  
  // Используем данные или пустой массив если еще загружается
  const displayData = testData.length > 0 ? testData : [];
  const displayCurrentDay = testData.length > 0 ? testData[testData.length - 1].day : 1;
  
  // Обновляем выделение текущего дня при изменении
  React.useEffect(() => {
    if (displayData.length === 0) return; // Не выполняем если нет данных
    
    setTimeout(() => {
      // Находим все тексты осей
      const allAxisTexts = document.querySelectorAll('.recharts-cartesian-axis-tick-value');
      
      // Сбрасываем все стили
      allAxisTexts.forEach(text => {
        text.style.fontWeight = 'normal';
      });
      
      // Выделяем текущий день только на оси X
      allAxisTexts.forEach(text => {
        // Проверяем, что это ось X по родительскому элементу
        const parent = text.closest('.recharts-cartesian-axis');
        if (parent && parent.classList.contains('recharts-cartesian-axis-x')) {
          if (text.textContent === displayCurrentDay.toString()) {
            text.style.fontWeight = 'bold !important';
            text.style.setProperty('font-weight', 'bold', 'important');
          }
        }
      });
    }, 100);
  }, [displayCurrentDay, displayData.length]);
  
  // Исправляем позиционирование верхних лейблов осей Y
  React.useEffect(() => {
    if (displayData.length === 0) return; // Не выполняем если нет данных
    
    setTimeout(() => {
      // Находим все лейблы осей Y
      const yAxisLabels = document.querySelectorAll('.recharts-cartesian-axis-y .recharts-cartesian-axis-tick-value');
      
      yAxisLabels.forEach((label, index) => {
        // Если это последний (верхний) лейбл
        if (index === yAxisLabels.length - 1) {
          // Сбрасываем все трансформации
          label.style.transform = 'translateY(-2px)';
          label.style.textAnchor = 'middle';
          label.style.dominantBaseline = 'middle';
        }
      });
    }, 100);
  }, [displayCurrentDay, displayData.length]);
  
  // Фильтруем данные до текущего дня для эмулятора - ОТКЛЮЧЕНО
  // const filteredTestData = testData.filter(day => day.day <= currentDayState);
  
  // Используем все данные (последний день)
  const filteredTestData = displayData;

  // Функция для парсинга строки уроков из Google Sheets
  const parseLessons = (lessonsString) => {
    if (!lessonsString || lessonsString.trim() === '') return [];
    // В таблице "0" означает отсутствие уроков. Игнорируем все значения \<= 0.
    return lessonsString
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id) && id > 0);
  };


  // Обработчик клавиш для эмулятора - ОТКЛЮЧЕН
  // React.useEffect(() => {
  //   const handleKeyPress = (event) => {
  //     if (event.key === 'ArrowLeft' && currentDayState > 1) {
  //       setCurrentDayState(currentDayState - 1);
  //     } else if (event.key === 'ArrowRight' && currentDayState < 10) {
  //       setCurrentDayState(currentDayState + 1);
  //     }
  //   };
  //   
  //   window.addEventListener('keydown', handleKeyPress);
  //   return () => window.removeEventListener('keydown', handleKeyPress);
  // }, [currentDayState]);

  // Рассчитываем общее количество завершенных уроков
  const allCompletedLessons = filteredTestData.flatMap(day => parseLessons(day.completedLessons));
  const completedLessons = allCompletedLessons.length;
  
  // Рассчитываем общее время с учетом новой схемы после 15 дня
  const getDayTotal = (day) => {
    if (day.day >= 15) {
      return (day.readingTime + day.writingTime + day.speakingTime + day.listeningTime + day.grammarTime);
    }
    return (day.theoryTime + day.homeworkTime + day.prolingvoTime + day.otherTime);
  };
  const totalTime = filteredTestData.reduce((sum, day) => sum + getDayTotal(day), 0);
  const avgTime = Math.round(totalTime / displayCurrentDay);
  
  // Прогноз уроков
  const currentLessonsPerDay = completedLessons / displayCurrentDay;
  const allData = [];
  
  // Заполняем данные для всех дней с накопленным количеством уроков
  let cumulativeLessons = 0;
  for (let day = 1; day <= displayCurrentDay; day++) {
    const existingDay = filteredTestData.find(d => d.day === day);
    if (existingDay) {
      const dayCompletedLessons = parseLessons(existingDay.completedLessons).length;
      cumulativeLessons += dayCompletedLessons;
      allData.push({ 
        day: day, 
        lessons: cumulativeLessons, 
        dailyLessons: dayCompletedLessons // количество уроков за день
      });
    } else {
      allData.push({ 
        day: day, 
        lessons: cumulativeLessons, 
        dailyLessons: 0 // нет уроков за день
      });
    }
  }

  // Расчет прогнозной линии до 40 уроков
  const forecastData = [];
  if (currentLessonsPerDay > 0) {
    // Рассчитываем прогноз от текущего дня до достижения 40 уроков
    const remainingLessons = Math.max(0, 40 - completedLessons);
    const daysToComplete = Math.ceil(remainingLessons / currentLessonsPerDay);
    const forecastEndDay = Math.min(90, displayCurrentDay + daysToComplete);
    
    // Создаем прогнозные данные
    for (let day = displayCurrentDay; day <= forecastEndDay; day++) {
      const forecastLessons = Math.min(40, completedLessons + (day - displayCurrentDay) * currentLessonsPerDay);
      forecastData.push({
        day: day,
        forecast: forecastLessons
      });
    }
  }
  
  // Данные для графика времени (все дни до текущего)
  const timeData = [];
  const useNewCategories = displayCurrentDay >= 15;
  for (let day = 1; day <= displayCurrentDay; day++) {
    const existingDay = filteredTestData.find(d => d.day === day);
    if (useNewCategories) {
      timeData.push({
        day: day,
        // Для дней до 15 показываем серым суммарное старых категорий
        legacyTime: existingDay ? (existingDay.day < 15 ? (existingDay.theoryTime + existingDay.homeworkTime + existingDay.prolingvoTime + existingDay.otherTime) : 0) : 0,
        readingTime: existingDay ? (existingDay.day >= 15 ? existingDay.readingTime : 0) : 0,
        writingTime: existingDay ? (existingDay.day >= 15 ? existingDay.writingTime : 0) : 0,
        speakingTime: existingDay ? (existingDay.day >= 15 ? existingDay.speakingTime : 0) : 0,
        listeningTime: existingDay ? (existingDay.day >= 15 ? existingDay.listeningTime : 0) : 0,
        grammarTime: existingDay ? (existingDay.day >= 15 ? existingDay.grammarTime : 0) : 0
      });
    } else {
    timeData.push({
      day: day,
      theoryTime: existingDay ? existingDay.theoryTime : 0,
      homeworkTime: existingDay ? existingDay.homeworkTime : 0,
      prolingvoTime: existingDay ? existingDay.prolingvoTime : 0,
      otherTime: existingDay ? existingDay.otherTime : 0
    });
    }
  }
  
  // Debug: timeData for day 15
  const td15 = timeData.find(d => d.day === 15);
  if (td15) console.log('timeData[15]:', td15);

  // Добавляем скользящее среднее по общему времени (2 дня назад, текущий, 2 дня вперед)
  const timeChartData = timeData.map((d, index) => {
    let sum = 0;
    let count = 0;

    for (let i = index - 2; i <= index + 2; i++) {
      if (i >= 0 && i < timeData.length) {
        const src = timeData[i];
        const totalMinutes =
          (src.legacyTime || 0) +
          (src.readingTime || src.theoryTime || 0) +
          (src.writingTime || src.homeworkTime || 0) +
          (src.speakingTime || src.prolingvoTime || 0) +
          (src.listeningTime || 0) +
          (src.grammarTime || src.otherTime || 0);
        sum += totalMinutes;
        count++;
      }
    }

    const movingAvgTime = count > 0 ? sum / count : null;

    return {
      ...d,
      movingAvgTime
    };
  });
  
  // Данные для графика настроения с экспоненциальным сглаживанием
  const moodData = [];
  let smoothedValue = null;
  
  for (let day = 1; day <= displayCurrentDay; day++) {
    const existingDay = filteredTestData.find(d => d.day === day);
    let movingAvg = null;
    
    // Скользящее среднее: -2 дня и +2 дня (окно 5 дней)
    const windowDays = [];
    for (let i = day - 2; i <= day + 2; i++) {
      const dayData = filteredTestData.find(d => d.day === i);
      if (dayData && dayData.mood !== null) {
        windowDays.push(dayData.mood);
      }
    }
    
    if (windowDays.length > 0) {
      movingAvg = windowDays.reduce((sum, mood) => sum + mood, 0) / windowDays.length;
    }
    
    moodData.push({
      day: day,
      mood: existingDay ? existingDay.mood : null,
      movingAvg: movingAvg
    });
  }
  
  // Принудительное обновление данных при изменении дня - ОТКЛЮЧЕНО
  // const [forceRender, setForceRender] = React.useState(0);
  // const chartKey = `charts-${currentDay}-${forceRender}`;
  // 
  // React.useEffect(() => {
  //   setForceRender(prev => prev + 1);
  // }, [currentDay]);
  
  const chartKey = `charts-${displayCurrentDay}`;
  


  // Подсчет страйка (дни с активностью)
  let currentStreak = 0;
  let lastActiveDay = 0;
  
  for (let i = filteredTestData.length - 1; i >= 0; i--) {
    const day = filteredTestData[i];
    const dayActivityTime = day.day >= 15
      ? (day.readingTime + day.writingTime + day.speakingTime + day.listeningTime + day.grammarTime)
      : (day.theoryTime + day.homeworkTime + day.prolingvoTime + day.otherTime);
    const hasActivity = dayActivityTime > 0 || 
                       parseLessons(day.completedLessons).length > 0 || 
                       parseLessons(day.attemptedLessons).length > 0;
    
    if (hasActivity) {
      if (currentStreak === 0) {
        lastActiveDay = day.day; // Запоминаем последний день с активностью
      }
      currentStreak++;
    } else {
      break;
    }
  }
  
  // Определяем, показывать ли смайл пропуска
  let streakIcon = "none";
  const daysSinceLastActivity = displayCurrentDay - lastActiveDay;
  
  if (currentStreak > 0) {
    // Есть активность → показываем молнию
    streakIcon = "lightning";
  } else if (daysSinceLastActivity > 1) {
    // Нет активности более одного дня → показываем пропуск
    streakIcon = "shrug";
  }
  // Если daysSinceLastActivity === 1 (вчера была активность), ничего не показываем

  if (loading) {
    return React.createElement('div', { className: "max-w-md mx-auto bg-white min-h-screen border border-gray-300 px-1 flex items-center justify-center" },
      React.createElement('div', { className: "text-center" },
        React.createElement('div', { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" }),
        React.createElement('p', { className: "text-gray-600" }, "Loading...")
      )
    );
  }

  return React.createElement('div', { className: "max-w-md mx-auto bg-white min-h-screen border border-gray-300 px-1" },
    // Заголовок
    React.createElement('div', { className: "bg-data-categories-neutral text-black px-4 pt-4 pb-0 relative mb-0" },
      React.createElement('h1', { className: "text-3xl font-bold text-black" }, "French A2→B1"),
        React.createElement('p', { className: "text-black text-base opacity-70" }, 
          "90 days • 40 lessons • ", 
          React.createElement('span', { style: { fontWeight: 'bold' } }, `Day ${displayCurrentDay}`)
        ),
        React.createElement('div', { className: "absolute top-5 right-4 flex items-center gap-1" },
          React.createElement('div', { className: "w-2 h-2 bg-blue-500 rounded-full animate-pulse" }),
        React.createElement('span', { className: "text-sm text-black opacity-70" }, `upd ${getUpdateTimeText(lastUpdateTime)}`)
      )
    ),

    // Метрики
    React.createElement('div', { className: "grid grid-cols-4 gap-2 p-4" },
      React.createElement('div', { className: "bg-gray-50 p-2 rounded-lg relative" },
        React.createElement('div', { className: "text-xl font-bold text-gray-800" }, `${completedLessons}/40`),
        React.createElement('div', { className: "text-sm text-gray-600" }, "lessons"),
        React.createElement('div', { 
          className: "absolute top-2 right-2 bg-gray-200 overflow-hidden",
          style: { height: 'calc(100% - 16px)', width: '6px', borderRadius: '2px' }
        },
          React.createElement('div', { 
            style: { 
              height: `${(completedLessons / 40) * 100}%`,
              width: '100%',
              backgroundColor: '#3b82f6',
              transition: 'height 0.3s ease',
              position: 'absolute',
              bottom: 0
            } 
          })
        )
      ),
      React.createElement('div', { className: "bg-gray-50 p-2 rounded-lg" },
        React.createElement('div', { className: "text-xl font-bold text-gray-800" }, 
          (() => {
            if (avgTime < 60) return `${avgTime}m`;
            const h = Math.floor(avgTime / 60);
            const m = avgTime % 60;
            return m === 0 ? `${h}h` : `${h}h\u202F${m}m`;
          })()
        ),
        React.createElement('div', { className: "text-sm text-gray-600" }, "avg/day")
      ),
      React.createElement('div', { className: "bg-gray-50 p-2 rounded-lg" },
        React.createElement('div', { className: "text-xl font-bold text-gray-800" }, `${Math.round(totalTime/60)}h`),
        React.createElement('div', { className: "text-sm text-gray-600" }, "total time")
      ),
      React.createElement('div', { className: "bg-gray-50 p-2 rounded-lg" },
        React.createElement('div', { className: "text-xl font-bold text-gray-800 flex items-center gap-1" },
          streakIcon === "lightning" && React.createElement('span', { style: { fontSize: '16px' } }, "⚡"),
          streakIcon === "shrug" && React.createElement('span', { style: { fontSize: '16px' } }, "🤷‍♂️"),
          React.createElement('span', null, currentStreak > 0 ? currentStreak : "")
        ),
        React.createElement('div', { className: "text-sm text-gray-600" }, "streak")
      )
    ),

    // График уроков
    React.createElement('div', { className: "px-4 mb-4" },
      React.createElement('h3', { className: "text-base font-medium text-gray-700" }, "How lessons grow daily and over time"),
      React.createElement('div', { className: "h-36 relative", style: { marginTop: '10px', height: 'calc(9rem * 0.85 / 1.5 + 10px)' } },
        React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
          React.createElement(ComposedChart, { data: allData, margin: { left: 5, right: 10, top: 9, bottom: 0 }, key: chartKey },
            React.createElement(XAxis, { 
              type: "number",
              dataKey: "day", 
              domain: [0, 90],
              allowDuplicatedCategory: true, // Разрешить дубликаты
              interval: 0, // Показывать все тики
              ticks: (() => {
                const baseTicks = [1, 10, 30, 60, 90];
                let ticks = [...baseTicks];
                
                // Добавляем текущий день если его нет в базовых тиках
                if (!baseTicks.includes(displayCurrentDay)) {
                  ticks.push(displayCurrentDay);
                }
                
                // Добавляем день прогноза если он есть и его нет в тиках
                const forecastEndDay = forecastData.length > 0 ? forecastData[forecastData.length - 1]?.day : null;
                if (forecastEndDay && !ticks.includes(forecastEndDay)) {
                  ticks.push(forecastEndDay);
                }
                
                ticks.sort((a, b) => a - b);
                return ticks;
              })(),
              tickLine: { stroke: '#000000', strokeWidth: 1 },
              tick: (props) => React.createElement(CustomXAxisTick, { ...props, currentDay: displayCurrentDay, hideLabels: true, forecastEndDay: forecastData.length > 0 ? forecastData[forecastData.length - 1]?.day : null })
            }),
            React.createElement(YAxis, { 
              domain: [0, 40],
              ticks: [0, 10, 20, 30, 40],
              axisLine: false,
              fontSize: 12
            }),
            React.createElement(Line, { 
              type: "step", 
              dataKey: "lessons", 
              stroke: "#3b82f6", 
              strokeWidth: 3,
              dot: (props) => React.createElement(ForecastDot, { ...props, displayCurrentDay: displayCurrentDay, completedLessons: completedLessons }),
              connectNulls: false,
              isAnimationActive: false,
              data: allData.filter(d => d.day <= displayCurrentDay)
            }),
            forecastData.length > 0 && React.createElement(Line, { 
              type: "step", 
              dataKey: "forecast", 
              stroke: "#3b82f6", 
              strokeWidth: 3,
              strokeOpacity: 0.5,
              dot: false,
              connectNulls: false,
              isAnimationActive: false,
              data: forecastData
            }),
            forecastData.length > 0 && React.createElement(ReferenceLine, {
              x: forecastData[forecastData.length - 1]?.day,
              stroke: "#93c5fd",
              strokeWidth: 1,
              strokeOpacity: 0.5,
              strokeDasharray: "none"
            })
          )
        )
      ),
      // Второй график - прямая линия с кружочками для пройденных уроков
      React.createElement('div', { className: "h-20 relative", style: { marginTop: '-15px', height: '3rem' } },
        React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
          React.createElement(BarChart, { data: allData, barCategoryGap: 0, margin: { left: 5, right: 10, top: 8, bottom: 0 }, key: chartKey },
            React.createElement(XAxis, { 
              type: "number",
              dataKey: "day", 
              domain: [0, 90],
              allowDuplicatedCategory: true,
              interval: 0,
              ticks: (() => {
                const baseTicks = [1, 10, 30, 60, 90];
                let ticks = [...baseTicks];
                
                if (!baseTicks.includes(displayCurrentDay)) {
                  ticks.push(displayCurrentDay);
                  ticks.sort((a, b) => a - b);
                }
                
                return ticks;
              })(),
              tickFormatter: (value) => {
                const baseTicks = [1, 10, 30, 60, 90];
                if (baseTicks.includes(value) && Math.abs(value - displayCurrentDay) < 2 && value !== displayCurrentDay) {
                  return '';
                }
                return value;
              },
              tickLine: { stroke: '#000000', strokeWidth: 1 },
              tick: (props) => React.createElement(CustomXAxisTick, { ...props, currentDay: displayCurrentDay })
            }),
            React.createElement(YAxis, { 
              domain: [0, Math.ceil(Math.max(...allData.map(d => d.dailyLessons)))],
              ticks: (() => {
                const max = Math.ceil(Math.max(...allData.map(d => d.dailyLessons)));
                const ticks = [];
                for (let i = 0; i <= max; i += 1) {
                  ticks.push(i);
                }
                return ticks;
              })(),
              axisLine: false,
              fontSize: 12
            }),
            React.createElement(Bar, { 
              dataKey: "dailyLessons", 
              fill: "#3b82f6", 
              fillOpacity: 0.8,
              stroke: "transparent",
              strokeWidth: 0
            })
          )
        ),
        React.createElement('div', { 
          className: "absolute text-xs text-gray-500", 
          style: { 
            left: `${13 + (1 / 90) * 80}%`, 
            top: '93%',
            transform: 'translateY(-7px)',
            whiteSpace: 'nowrap'
          }
        }, "days from start →")
      )
    ),

    // График времени по дням
    React.createElement('div', { className: "px-4 mb-0" },
      React.createElement('h3', { className: "text-base font-medium text-gray-700" }, "What I practise each day"),
      React.createElement('div', { className: "text-sm text-gray-500 mb-1 flex items-center gap-3" },
        ...(displayCurrentDay >= 15 ? [
          React.createElement('div', { 
            key: 'grammar', 
            className: "flex items-center gap-1 cursor-pointer transition-opacity",
            style: { opacity: hoveredCategory === null || hoveredCategory === 'grammarTime' ? 1 : 0.3 },
            onMouseEnter: () => setHoveredCategory('grammarTime'),
            onMouseLeave: () => setHoveredCategory(null),
            onTouchStart: () => setHoveredCategory(hoveredCategory === 'grammarTime' ? null : 'grammarTime')
          },
            React.createElement('div', { style: { width: '8px', height: '8px', backgroundColor: '#F72585', borderRadius: '50%' } }),
            React.createElement('span', null, "Grammar")
          ),
          React.createElement('div', { 
            key: 'write', 
            className: "flex items-center gap-1 cursor-pointer transition-opacity",
            style: { opacity: hoveredCategory === null || hoveredCategory === 'writingTime' ? 1 : 0.3 },
            onMouseEnter: () => setHoveredCategory('writingTime'),
            onMouseLeave: () => setHoveredCategory(null),
            onTouchStart: () => setHoveredCategory(hoveredCategory === 'writingTime' ? null : 'writingTime')
          },
            React.createElement('div', { style: { width: '8px', height: '8px', backgroundColor: '#4CC9F0', borderRadius: '50%' } }),
            React.createElement('span', null, "Write")
          ),
          React.createElement('div', { 
            key: 'listen', 
            className: "flex items-center gap-1 cursor-pointer transition-opacity",
            style: { opacity: hoveredCategory === null || hoveredCategory === 'listeningTime' ? 1 : 0.3 },
            onMouseEnter: () => setHoveredCategory('listeningTime'),
            onMouseLeave: () => setHoveredCategory(null),
            onTouchStart: () => setHoveredCategory(hoveredCategory === 'listeningTime' ? null : 'listeningTime')
          },
            React.createElement('div', { style: { width: '8px', height: '8px', backgroundColor: '#5189E9', borderRadius: '50%' } }),
            React.createElement('span', null, "Listen")
          ),
          React.createElement('div', { 
            key: 'speak', 
            className: "flex items-center gap-1 cursor-pointer transition-opacity",
            style: { opacity: hoveredCategory === null || hoveredCategory === 'speakingTime' ? 1 : 0.3 },
            onMouseEnter: () => setHoveredCategory('speakingTime'),
            onMouseLeave: () => setHoveredCategory(null),
            onTouchStart: () => setHoveredCategory(hoveredCategory === 'speakingTime' ? null : 'speakingTime')
          },
            React.createElement('div', { style: { width: '8px', height: '8px', backgroundColor: '#4A2CF5', borderRadius: '50%' } }),
            React.createElement('span', null, "Speak")
          ),
          React.createElement('div', { 
            key: 'read', 
            className: "flex items-center gap-1 cursor-pointer transition-opacity",
            style: { opacity: hoveredCategory === null || hoveredCategory === 'readingTime' ? 1 : 0.3 },
            onMouseEnter: () => setHoveredCategory('readingTime'),
            onMouseLeave: () => setHoveredCategory(null),
            onTouchStart: () => setHoveredCategory(hoveredCategory === 'readingTime' ? null : 'readingTime')
          },
            React.createElement('div', { style: { width: '8px', height: '8px', backgroundColor: '#9378FF', borderRadius: '50%' } }),
            React.createElement('span', null, "Read")
          )
        ] : [
          React.createElement('div', { 
            key: 'theory', 
            className: "flex items-center gap-1 cursor-pointer transition-opacity",
            style: { opacity: hoveredCategory === null || hoveredCategory === 'theoryTime' ? 1 : 0.3 },
            onMouseEnter: () => setHoveredCategory('theoryTime'),
            onMouseLeave: () => setHoveredCategory(null),
            onTouchStart: () => setHoveredCategory(hoveredCategory === 'theoryTime' ? null : 'theoryTime')
          },
            React.createElement('div', { style: { width: '10px', height: '10px', backgroundColor: '#03a9f4', borderRadius: '50%' } }),
          React.createElement('span', null, "Theory")
        ),
          React.createElement('div', { 
            key: 'home', 
            className: "flex items-center gap-1 cursor-pointer transition-opacity",
            style: { opacity: hoveredCategory === null || hoveredCategory === 'homeworkTime' ? 1 : 0.3 },
            onMouseEnter: () => setHoveredCategory('homeworkTime'),
            onMouseLeave: () => setHoveredCategory(null),
            onTouchStart: () => setHoveredCategory(hoveredCategory === 'homeworkTime' ? null : 'homeworkTime')
          },
            React.createElement('div', { style: { width: '10px', height: '10px', backgroundColor: '#673ab7', borderRadius: '50%' } }),
          React.createElement('span', null, "Homework")
        ),
          React.createElement('div', { 
            key: 'pro', 
            className: "flex items-center gap-1 cursor-pointer transition-opacity",
            style: { opacity: hoveredCategory === null || hoveredCategory === 'prolingvoTime' ? 1 : 0.3 },
            onMouseEnter: () => setHoveredCategory('prolingvoTime'),
            onMouseLeave: () => setHoveredCategory(null),
            onTouchStart: () => setHoveredCategory(hoveredCategory === 'prolingvoTime' ? null : 'prolingvoTime')
          },
            React.createElement('div', { style: { width: '10px', height: '10px', backgroundColor: '#e91e63', borderRadius: '50%' } }),
          React.createElement('span', null, "Basic grammar")
        ),
          React.createElement('div', { 
            key: 'other', 
            className: "flex items-center gap-1 cursor-pointer transition-opacity",
            style: { opacity: hoveredCategory === null || hoveredCategory === 'otherTime' ? 1 : 0.3 },
            onMouseEnter: () => setHoveredCategory('otherTime'),
            onMouseLeave: () => setHoveredCategory(null),
            onTouchStart: () => setHoveredCategory(hoveredCategory === 'otherTime' ? null : 'otherTime')
          },
            React.createElement('div', { style: { width: '10px', height: '10px', backgroundColor: '#9ca3af', borderRadius: '50%' } }),
          React.createElement('span', null, "Other")
        )
        ])
      ),
      React.createElement('div', { className: "h-36", style: { marginTop: '10px', height: 'calc(9rem * 0.85)' } },
        React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
          React.createElement(ComposedChart, { data: timeChartData, barCategoryGap: 0, margin: { left: 5, right: 10, top: 9, bottom: 0 }, key: chartKey },
            React.createElement(XAxis, { 
              type: "number",
              dataKey: "day", 
              domain: [0, 90],
              allowDuplicatedCategory: true, // Разрешить дубликаты
              interval: 0, // Показывать все тики
              ticks: (() => {
                const baseTicks = [1, 10, 30, 60, 90];
                let ticks = [...baseTicks];
                
                // Добавляем текущий день если его нет в базовых тиках
                if (!baseTicks.includes(displayCurrentDay)) {
                  ticks.push(displayCurrentDay);
                  ticks.sort((a, b) => a - b);
                }
                
                return ticks;
              })(),
              tickFormatter: (value) => {
                // Скрываем цифры базовых меток, которые слишком близко к текущему дню
                const baseTicks = [1, 10, 30, 60, 90];
                if (baseTicks.includes(value) && Math.abs(value - displayCurrentDay) < 2 && value !== displayCurrentDay) {
                  return ''; // Скрываем цифру только если это НЕ текущий день
                }
                return value; // Показываем цифру
              },
              tickLine: { stroke: '#000000', strokeWidth: 1 },
              tick: (props) => React.createElement(CustomXAxisTick, { ...props, currentDay: displayCurrentDay })
            }),
            React.createElement(YAxis, { 
              domain: [0, Math.ceil(Math.max(...timeChartData.map(d => (d.legacyTime || 0) + (d.readingTime || d.theoryTime || 0) + (d.writingTime || d.homeworkTime || 0) + (d.speakingTime || d.prolingvoTime || 0) + (d.listeningTime || 0) + (d.grammarTime || d.otherTime || 0))) / 30) * 30],
              ticks: (() => {
                const max = Math.ceil(Math.max(...timeChartData.map(d => (d.legacyTime || 0) + (d.readingTime || d.theoryTime || 0) + (d.writingTime || d.homeworkTime || 0) + (d.speakingTime || d.prolingvoTime || 0) + (d.listeningTime || 0) + (d.grammarTime || d.otherTime || 0))) / 30) * 30;
                const ticks = [];
                for (let i = 0; i <= max; i += 30) {
                  ticks.push(i);
                }
                return ticks;
              })(),
              tickFormatter: (value) => {
                if (value === 0) return '0m';
                if (value < 60) return `${value}m`;
                const hours = Math.floor(value / 60);
                const minutes = value % 60;
                if (minutes === 0) return `${hours}h`;
                return `${hours}h\u202F${minutes}m`;
              },
              axisLine: false,
              fontSize: 12
            }),
            ...(displayCurrentDay >= 15 ? [
              // Order: Grammar - Write - Listen - Speak - Read with provided palette
              React.createElement(Bar, { 
                key: 'grammar', 
                dataKey: "grammarTime", 
                stackId: "time", 
                fill: "#F72585",
                fillOpacity: hoveredCategory === null || hoveredCategory === 'grammarTime' ? 1 : 0.3
              }),
              React.createElement(Bar, { 
                key: 'writing', 
                dataKey: "writingTime", 
                stackId: "time", 
                fill: "#4CC9F0",
                fillOpacity: hoveredCategory === null || hoveredCategory === 'writingTime' ? 1 : 0.3
              }),
              React.createElement(Bar, { 
                key: 'listening', 
                dataKey: "listeningTime", 
                stackId: "time", 
                fill: "#5189E9",
                fillOpacity: hoveredCategory === null || hoveredCategory === 'listeningTime' ? 1 : 0.3
              }),
              React.createElement(Bar, { 
                key: 'speaking', 
                dataKey: "speakingTime", 
                stackId: "time", 
                fill: "#4A2CF5",
                fillOpacity: hoveredCategory === null || hoveredCategory === 'speakingTime' ? 1 : 0.3
              }),
              React.createElement(Bar, { 
                key: 'reading', 
                dataKey: "readingTime", 
                stackId: "time", 
                fill: "#9378FF",
                fillOpacity: hoveredCategory === null || hoveredCategory === 'readingTime' ? 1 : 0.3
              }),
              React.createElement(Bar, { 
                key: 'legacy', 
                dataKey: "legacyTime", 
                stackId: "time", 
                fill: "#D5DAE3",
                fillOpacity: hoveredCategory === null ? 1 : 0.3
              })
            ] : [
              React.createElement(Bar, { 
                key: 'theory', 
                dataKey: "theoryTime", 
                stackId: "time", 
                fill: "#03a9f4",
                fillOpacity: hoveredCategory === null || hoveredCategory === 'theoryTime' ? 1 : 0.3
              }),
              React.createElement(Bar, { 
                key: 'homework', 
                dataKey: "homeworkTime", 
                stackId: "time", 
                fill: "#673ab7",
                fillOpacity: hoveredCategory === null || hoveredCategory === 'homeworkTime' ? 1 : 0.3
              }),
              React.createElement(Bar, { 
                key: 'prolingvo', 
                dataKey: "prolingvoTime", 
                stackId: "time", 
                fill: "#e91e63",
                fillOpacity: hoveredCategory === null || hoveredCategory === 'prolingvoTime' ? 1 : 0.3
              }),
              React.createElement(Bar, { 
                key: 'other', 
                dataKey: "otherTime", 
                stackId: "time", 
                fill: "#B0B5BF",
                fillOpacity: hoveredCategory === null || hoveredCategory === 'otherTime' ? 1 : 0.3
              })
            ]),
            // Скользящее среднее по суммарному времени (темно-серая линия с белой обводкой)
            React.createElement(Line, {
              key: 'timeMovingAvgOutline',
              type: "monotone",
              dataKey: "movingAvgTime",
              stroke: "#ffffff",
              strokeWidth: 5,
              strokeOpacity: hoveredCategory === null ? 0.5 : 0.2,
              dot: false,
              connectNulls: false,
              isAnimationActive: false
            }),
            React.createElement(Line, {
              key: 'timeMovingAvg',
              type: "monotone",
              dataKey: "movingAvgTime",
              stroke: "#002F7F",
              strokeWidth: 3,
              strokeOpacity: hoveredCategory === null ? 0.9 : 0.2,
              dot: false,
              connectNulls: false,
              isAnimationActive: false
            })
          )
        )
      )
    ),

    // График настроения
    React.createElement('div', { className: "px-4 mb-0" },
      React.createElement('h3', { className: "text-base font-medium text-gray-700" }, "How I feel about my french"),
      React.createElement('div', { className: "text-sm text-gray-500 mb-1" }, "1 – total disaster, 5 – absolutely brilliant"),
      React.createElement('div', { className: "h-28 relative", style: { marginTop: '10px', height: 'calc(7rem - 20px)' } },
        React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
          React.createElement(LineChart, { data: moodData, margin: { left: 5, right: 10, top: 9, bottom: 5 }, key: chartKey },
            React.createElement('defs', null,
              React.createElement('linearGradient', { id: "moodGradient", x1: "0", y1: "0", x2: "0", y2: "1" },
                React.createElement('stop', { offset: "0%", stopColor: "#3b82f6" }),
                React.createElement('stop', { offset: "50%", stopColor: "#8b5cf6" }),
                React.createElement('stop', { offset: "100%", stopColor: "#ef4444" })
              )
            ),
            React.createElement(XAxis, { 
              type: "number",
              dataKey: "day", 
              domain: [0, 90],
              allowDuplicatedCategory: true, // Разрешить дубликаты
              interval: 0, // Показывать все тики
              ticks: (() => {
                const baseTicks = [1, 10, 30, 60, 90];
                let ticks = [...baseTicks];
                
                // Добавляем текущий день если его нет в базовых тиках
                if (!baseTicks.includes(displayCurrentDay)) {
                  ticks.push(displayCurrentDay);
                  ticks.sort((a, b) => a - b);
                }
                
                return ticks;
              })(),
              tickFormatter: (value) => {
                // Скрываем цифры базовых меток, которые слишком близко к текущему дню
                const baseTicks = [1, 10, 30, 60, 90];
                if (baseTicks.includes(value) && Math.abs(value - displayCurrentDay) < 2 && value !== displayCurrentDay) {
                  return ''; // Скрываем цифру только если это НЕ текущий день
                }
                return value; // Показываем цифру
              },
              tickLine: { stroke: '#000000', strokeWidth: 1 },
              tick: (props) => React.createElement(CustomXAxisTick, { ...props, currentDay: displayCurrentDay })
            }),
            React.createElement(YAxis, { 
              domain: [1, 5],
              ticks: [1, 2, 3, 4, 5],
              axisLine: false,
              fontSize: 12
            }),
            React.createElement(Line, { 
              type: "monotone", 
              dataKey: "mood", 
              stroke: "transparent",
              strokeWidth: 0,
              dot: MoodDot,
              connectNulls: false,
              zIndex: 10,
              isAnimationActive: false
            }),
            React.createElement(Line, { 
              type: "monotone", 
              dataKey: "movingAvg", 
              stroke: "url(#moodGradient)", 
              strokeWidth: 4,
              dot: false,
              connectNulls: false
            })
          )
        ),
      )
    ),

    // Подвал
    React.createElement('div', { className: "px-4 py-3 text-left border-t border-gray-200" },
      React.createElement('div', { className: "text-xs text-gray-500" },
        React.createElement('span', null, "Vibecoded via Claude and Cursor • Started at 22 Sept, 2025 • Aleksandr Bogachev • "),
        React.createElement('span', { className: "text-gray-500" }, "𝕏"),
        React.createElement('span', null, " "),
        React.createElement('a', { 
          href: "https://x.com/bogachev_al", 
          target: "_blank", 
          rel: "noopener noreferrer",
          className: "text-gray-500 hover:text-gray-700 underline"
        }, "bogachev_al")
      )
    )
  );
};

// Рендеринг компонента с проверкой
document.addEventListener('DOMContentLoaded', function() {
  if (typeof React !== 'undefined' && typeof Recharts !== 'undefined') {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(FrenchChallengeDashboard));
    
    // Принудительно скрыть линии оси Y и обновить размер шрифта после рендеринга
    setTimeout(() => {
      // Скрыть все линии оси Y
      const yAxisLines = document.querySelectorAll('.recharts-cartesian-axis-y line');
      yAxisLines.forEach(line => {
        line.style.display = 'none';
        line.style.visibility = 'hidden';
        line.style.opacity = '0';
      });
      
      // Принудительно обновить размер шрифта всех текстов осей
      const axisTexts = document.querySelectorAll('.recharts-cartesian-axis-tick-value');
      axisTexts.forEach(text => {
        text.style.fontSize = '12px !important';
        text.style.setProperty('font-size', '12px', 'important');
        text.style.fill = '#000000';
        text.style.fontWeight = 'normal';
        text.style.setProperty('font-weight', 'normal', 'important');
      });
      
      // Дополнительная проверка для осей Y
      const yAxisTexts = document.querySelectorAll('.recharts-cartesian-axis-y .recharts-cartesian-axis-tick-value');
      yAxisTexts.forEach(text => {
        text.style.fontSize = '12px !important';
        text.style.setProperty('font-size', '12px', 'important');
        text.style.fontWeight = 'normal';
        text.style.setProperty('font-weight', 'normal', 'important');
      });

    }, 100);
    
    // Дополнительная проверка через больший интервал
    setTimeout(() => {
      const allAxisTexts = document.querySelectorAll('.recharts-cartesian-axis-tick-value');
      allAxisTexts.forEach(text => {
        text.style.fontSize = '12px !important';
        text.style.setProperty('font-size', '12px', 'important');
        text.style.fontWeight = 'normal';
        text.style.setProperty('font-weight', 'normal', 'important');
      });
    }, 500);
  } else {
    document.getElementById('root').innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Library loading error. Check internet connection.</div>';
  }
});
