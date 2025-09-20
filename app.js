// Проверяем доступность библиотек
if (typeof React === 'undefined') {
  console.error('React не загружен');
}
if (typeof Recharts === 'undefined') {
  console.error('Recharts не загружен');
}

const { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, ComposedChart } = Recharts;

const FrenchChallengeDashboard = () => {
  // Данные из Google Sheets (CSV формат)
  const testData = [
    { day: 1, completedLessons: "1", attemptedLessons: "", videoTime: 15, homeworkTime: 10, otherTime: 0, mood: 4 },
    { day: 2, completedLessons: "2", attemptedLessons: "3", videoTime: 20, homeworkTime: 12, otherTime: 0, mood: 4 },
    { day: 3, completedLessons: "3", attemptedLessons: "", videoTime: 25, homeworkTime: 28, otherTime: 30, mood: 5 },
    { day: 4, completedLessons: "", attemptedLessons: "5,6", videoTime: 40, homeworkTime: 0, otherTime: 0, mood: 2 },
    { day: 5, completedLessons: "4,5", attemptedLessons: "", videoTime: 15, homeworkTime: 45, otherTime: 0, mood: 4 },
    { day: 6, completedLessons: "", attemptedLessons: "", videoTime: 0, homeworkTime: 0, otherTime: 0, mood: 2 }, // пропущенный день
    { day: 7, completedLessons: "6", attemptedLessons: "", videoTime: 10, homeworkTime: 0, otherTime: 0, mood: 3 },
    { day: 8, completedLessons: "7", attemptedLessons: "", videoTime: 0, homeworkTime: 40, otherTime: 0, mood: 4 },
    { day: 9, completedLessons: "", attemptedLessons: "", videoTime: 0, homeworkTime: 0, otherTime: 0, mood: 2 },
    { day: 10, completedLessons: "8,9,10", attemptedLessons: "", videoTime: 10, homeworkTime: 17, otherTime: 0, mood: 5 }
  ];

  // Функция для парсинга строки уроков из Google Sheets
  const parseLessons = (lessonsString) => {
    if (!lessonsString || lessonsString.trim() === '') return [];
    return lessonsString.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
  };

  const currentDay = testData.length;
  
  // Рассчитываем общее количество завершенных уроков
  const allCompletedLessons = testData.flatMap(day => parseLessons(day.completedLessons));
  const completedLessons = allCompletedLessons.length;
  
  // Рассчитываем общее время (включая otherTime)
  const totalTime = testData.reduce((sum, day) => sum + day.videoTime + day.homeworkTime + day.otherTime, 0);
  const avgTime = Math.round(totalTime / testData.filter(d => (d.videoTime + d.homeworkTime + d.otherTime) > 0).length);
  
  // Прогноз уроков
  const currentLessonsPerDay = completedLessons / currentDay;
  const allData = [];
  
  // Заполняем данные только до текущего дня с накопленным количеством уроков
  let cumulativeLessons = 0;
  for (let day = 1; day <= currentDay; day++) {
    const existingDay = testData.find(d => d.day === day);
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
  
  // Данные для графика времени (все 90 дней)
  const timeData = [];
  for (let day = 1; day <= 90; day++) {
    const existingDay = testData.find(d => d.day === day);
    timeData.push({
      day: day,
      videoTime: existingDay ? existingDay.videoTime : 0,
      homeworkTime: existingDay ? existingDay.homeworkTime : 0,
      otherTime: existingDay ? existingDay.otherTime : 0
    });
  }
  
  // Данные для графика настроения с экспоненциальным сглаживанием
  const moodData = [];
  let lastMovingAvgValue = null;
  let smoothedValue = null;
  
  for (let day = 1; day <= 90; day++) {
    const existingDay = testData.find(d => d.day === day);
    let movingAvg = null;
    
    if (existingDay) {
      // Экспоненциальное сглаживание (более гладкая линия)
      const alpha = 0.3; // коэффициент сглаживания (0.1-0.5)
      if (smoothedValue === null) {
        smoothedValue = existingDay.mood;
      } else {
        smoothedValue = alpha * existingDay.mood + (1 - alpha) * smoothedValue;
      }
      movingAvg = smoothedValue;
      lastMovingAvgValue = movingAvg;
    }
    
    moodData.push({
      day: day,
      mood: existingDay ? existingDay.mood : null,
      movingAvg: movingAvg
    });
  }
  
  // Позиция для надписи рядом с последней точкой скользящей средней
  const lastDayWithData = currentDay; // день 10
  const chartWidth = 80; // примерно 80% ширины занимает сам график (с учетом увеличенного отступа)
  const chartHeight = 70; // примерно 70% высоты занимает сам график (без осей)
  const labelXPosition = `${15 + (lastDayWithData / 90) * 80}%`; // 15% отступ слева для оси Y, без дополнительного сдвига
  const labelYPosition = lastMovingAvgValue ? 
    `${(5 - lastMovingAvgValue) / 4 * chartHeight + 1}%` : '50%'; // точно на уровне точки скользящей средней + небольшой сдвиг
  
  // Цвет последней точки скользящей средней (градиент от синего к красному)
  const getMovingAvgColor = (value) => {
    if (value <= 1) return '#ef4444'; // красный для низких значений
    if (value >= 5) return '#3b82f6'; // синий для высоких значений
    if (value <= 3) return '#8b5cf6'; // фиолетовый для средних значений
    return '#3b82f6'; // синий для высоких значений
  };
  const labelColor = lastMovingAvgValue ? getMovingAvgColor(lastMovingAvgValue) : '#e91e63';

  // Подсчет страйка (дни с активностью)
  let currentStreak = 0;
  for (let i = testData.length - 1; i >= 0; i--) {
    const day = testData[i];
    const hasActivity = (day.videoTime + day.homeworkTime + day.otherTime) > 0 || 
                       parseLessons(day.completedLessons).length > 0 || 
                       parseLessons(day.attemptedLessons).length > 0;
    
    if (hasActivity) {
      currentStreak++;
    } else {
      break;
    }
  }

  return React.createElement('div', { className: "max-w-md mx-auto bg-white min-h-screen border border-gray-300 px-1" },
    // Заголовок
    React.createElement('div', { className: "bg-data-categories-neutral text-black px-4 pt-4 pb-0 relative mb-0" },
      React.createElement('h1', { className: "text-3xl font-bold text-black" }, "French A2→B1"),
      React.createElement('p', { className: "text-black text-base opacity-70" }, `90 days • 40 lessons • Day ${currentDay}`),
      React.createElement('div', { className: "absolute top-5 right-4 flex items-center gap-2" },
        React.createElement('div', { className: "w-2 h-2 bg-black rounded-full animate-pulse" }),
        React.createElement('span', { className: "text-sm text-black opacity-70" }, "updated today")
      )
    ),

    // Метрики
    React.createElement('div', { className: "grid grid-cols-4 gap-2 p-4" },
      React.createElement('div', { className: "bg-gray-50 p-2 rounded-lg relative" },
        React.createElement('div', { className: "text-xl font-bold text-gray-800" }, `${completedLessons}/40`),
        React.createElement('div', { className: "text-sm text-gray-600" }, "lessons"),
        React.createElement('div', { 
          className: "absolute top-2 right-2 w-1 bg-gray-200 rounded-full overflow-hidden",
          style: { height: 'calc(100% - 16px)' }
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
        React.createElement('div', { className: "text-xl font-bold text-gray-800" }, `${avgTime}m`),
        React.createElement('div', { className: "text-sm text-gray-600" }, "avg/day")
      ),
      React.createElement('div', { className: "bg-gray-50 p-2 rounded-lg" },
        React.createElement('div', { className: "text-xl font-bold text-gray-800" }, `${Math.round(totalTime/60)}h`),
        React.createElement('div', { className: "text-sm text-gray-600" }, "total")
      ),
      React.createElement('div', { className: "bg-gray-50 p-2 rounded-lg" },
        React.createElement('div', { className: "text-xl font-bold text-gray-800 flex items-center gap-1" },
          currentStreak > 0 && React.createElement('span', { style: { fontSize: '16px' } }, "⚡"),
          React.createElement('span', null, currentStreak > 0 ? currentStreak : "")
        ),
        React.createElement('div', { className: "text-sm text-gray-600" }, "streak")
      )
    ),

    // График уроков
    React.createElement('div', { className: "px-4 mb-0" },
      React.createElement('h3', { className: "text-base font-medium text-gray-700" }, "Lessons Progress"),
      React.createElement('div', { className: "text-sm text-gray-500 mb-1" }, "cumulative lessons completed"),
      React.createElement('div', { className: "h-40 relative", style: { marginTop: '10px' } },
        React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
          React.createElement(ComposedChart, { data: allData, margin: { left: 5, right: 5, top: 5, bottom: 0 } },
            React.createElement(XAxis, { 
              type: "number",
              dataKey: "day", 
              domain: [0, 90],
              ticks: [1, 10, 30, 60, 90],
              tickLine: { stroke: '#000000', strokeWidth: 1 },
              tick: { fontSize: 0, opacity: 0 }
            }),
            React.createElement(YAxis, { 
              domain: [0, Math.ceil(Math.max(...allData.map(d => d.lessons)) / 5) * 5],
              ticks: (() => {
                const max = Math.ceil(Math.max(...allData.map(d => d.lessons)) / 5) * 5;
                const ticks = [];
                for (let i = 0; i <= max; i += 5) {
                  ticks.push(i);
                }
                return ticks;
              })(),
              axisLine: false,
              fontSize: 12
            }),
            React.createElement(Line, { 
              type: "step", 
              dataKey: "lessons", 
              stroke: "#3b82f6", 
              strokeWidth: 3,
              dot: false,
              connectNulls: false
            }),
            React.createElement(Bar, { 
              dataKey: "dailyLessons", 
              fill: "#1d4ed8", 
              fillOpacity: 0.8,
              stroke: "#1d4ed8",
              strokeWidth: 1
            })
          )
        ),
        React.createElement('div', { 
          className: "absolute text-sm font-bold pointer-events-auto", 
          style: { 
            left: `${15 + (currentDay / 90) * 80}%`, 
            top: `${(Math.ceil(Math.max(...allData.map(d => d.lessons)) / 5) * 5 - completedLessons) / (Math.ceil(Math.max(...allData.map(d => d.lessons)) / 5) * 5) * 70 + 1}%`, 
            color: '#3b82f6',
            whiteSpace: 'nowrap',
            zIndex: 10,
            transform: 'translateY(-50%)'
          }
        }, "cumulative lessons")
      )
    ),

    // График времени по дням
    React.createElement('div', { className: "px-4 mb-0" },
      React.createElement('h3', { className: "text-base font-medium text-gray-700" }, "Daily Time"),
      React.createElement('div', { className: "text-sm text-gray-500 mb-1 flex items-center gap-3" },
        React.createElement('div', { className: "flex items-center gap-1" },
          React.createElement('div', { 
            style: { 
              width: '8px', 
              height: '8px', 
              backgroundColor: '#03a9f4',
              borderRadius: '50%'
            } 
          }),
          React.createElement('span', null, "Video")
        ),
        React.createElement('div', { className: "flex items-center gap-1" },
          React.createElement('div', { 
            style: { 
              width: '8px', 
              height: '8px', 
              backgroundColor: '#673ab7',
              borderRadius: '50%'
            } 
          }),
          React.createElement('span', null, "Homework")
        ),
        React.createElement('div', { className: "flex items-center gap-1" },
          React.createElement('div', { 
            style: { 
              width: '8px', 
              height: '8px', 
              backgroundColor: '#9ca3af',
              borderRadius: '50%'
            } 
          }),
          React.createElement('span', null, "Other")
        )
      ),
      React.createElement('div', { className: "h-40", style: { marginTop: '10px' } },
        React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
          React.createElement(BarChart, { data: timeData, barCategoryGap: 0, margin: { left: 5, right: 5, top: 5, bottom: 0 } },
            React.createElement(XAxis, { 
              type: "number",
              dataKey: "day", 
              domain: [0, 90],
              ticks: [1, 10, 30, 60, 90],
              tickLine: { stroke: '#000000', strokeWidth: 1 },
              tick: { fontSize: 0, opacity: 0 }
            }),
            React.createElement(YAxis, { 
              domain: [0, 80],
              axisLine: false,
              fontSize: 12
            }),
            React.createElement(Bar, { dataKey: "videoTime", stackId: "time", fill: "#03a9f4" }),
            React.createElement(Bar, { dataKey: "homeworkTime", stackId: "time", fill: "#673ab7" }),
            React.createElement(Bar, { dataKey: "otherTime", stackId: "time", fill: "#9ca3af" })
          )
        )
      )
    ),

    // График настроения
    React.createElement('div', { className: "px-4 mb-0" },
      React.createElement('h3', { className: "text-base font-medium text-gray-700" }, "Emotional State"),
      React.createElement('div', { className: "text-sm text-gray-500 mb-1" }, "1 – Total disaster, 5 – Absolutely brilliant."),
      React.createElement('div', { className: "h-28 relative", style: { marginTop: '10px' } },
        React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
          React.createElement(LineChart, { data: moodData, margin: { left: 5, right: 5, top: 5, bottom: 5 } },
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
              ticks: [1, 10, 30, 60, 90],
              tick: { fontSize: 12 }
            }),
            React.createElement(YAxis, { 
              domain: [1, 5],
              ticks: [1, 5],
              axisLine: false,
              fontSize: 12
            }),
            React.createElement(Line, { 
              type: "monotone", 
              dataKey: "mood", 
              stroke: "transparent",
              strokeWidth: 0,
              dot: { fill: "#6b7280", fillOpacity: 0.5, r: 2 },
              connectNulls: false
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
        React.createElement('div', { 
          className: "absolute text-sm font-bold pointer-events-auto", 
          style: { 
            left: labelXPosition, 
            top: labelYPosition, 
            color: labelColor,
            whiteSpace: 'nowrap',
            zIndex: 10,
            transform: 'translateY(-50%)'
          }
        }, "moving average")
      )
    ),

    // Подвал
    React.createElement('div', { className: "px-4 py-3 text-left border-t border-gray-200" },
        React.createElement('div', { className: "text-xs text-gray-500" },
        React.createElement('div', null, "Vibecoded via Claude and Cursor"),
        React.createElement('div', null, "Started at 22 Sept, 2025. Aleksandr Bogachev"),
        React.createElement('div', { className: "flex items-center gap-1" },
          React.createElement('span', { className: "text-gray-500" }, "𝕏"),
          React.createElement('a', { 
            href: "https://x.com/bogachev_al", 
            target: "_blank", 
            rel: "noopener noreferrer",
            className: "text-gray-500 hover:text-gray-700 underline"
          }, "bogachev_al")
        )
      )
    )
  );
};

// Рендеринг компонента с проверкой
document.addEventListener('DOMContentLoaded', function() {
  if (typeof React !== 'undefined' && typeof Recharts !== 'undefined') {
    ReactDOM.render(React.createElement(FrenchChallengeDashboard), document.getElementById('root'));
    
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
        text.style.fontSize = '12px';
        text.style.fill = '#000000';
      });
    }, 100);
  } else {
    document.getElementById('root').innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Ошибка загрузки библиотек. Проверьте подключение к интернету.</div>';
  }
});
