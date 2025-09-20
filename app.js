// Проверяем доступность библиотек
if (typeof React === 'undefined') {
  console.error('React не загружен');
}
if (typeof Recharts === 'undefined') {
  console.error('Recharts не загружен');
}

const { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } = Recharts;

const FrenchChallengeDashboard = () => {
  // Тестовые данные - 10 дней из 90
  const testData = [
    { day: 1, lessons: 1, videoTime: 15, homeworkTime: 10, otherTime: 0, mood: 4 },
    { day: 2, lessons: 2, videoTime: 10, homeworkTime: 12, otherTime: 0, mood: 4 },
    { day: 3, lessons: 2, videoTime: 15, homeworkTime: 13, otherTime: 30, mood: 3 },
    { day: 4, lessons: 3, videoTime: 15, homeworkTime: 16, otherTime: 0, mood: 5 },
    { day: 5, lessons: 4, videoTime: 10, homeworkTime: 13, otherTime: 0, mood: 4 },
    { day: 6, lessons: 4, videoTime: 0, homeworkTime: 0, otherTime: 30, mood: 2 }, // пропущенный день
    { day: 7, lessons: 5, videoTime: 10, homeworkTime: 0, otherTime: 0, mood: 3 },
    { day: 8, lessons: 5, videoTime: 0, homeworkTime: 40, otherTime: 0, mood: 4 },
    { day: 9, lessons: 6, videoTime: 12, homeworkTime: 7, otherTime: 0, mood: 4 },
    { day: 10, lessons: 7, videoTime: 10, homeworkTime: 17, otherTime: 0,mood: 5 }
  ];

  const currentDay = testData.length;
  const completedLessons = testData[testData.length - 1]?.lessons || 0;
  const totalTime = testData.reduce((sum, day) => sum + day.videoTime + day.homeworkTime, 0);
  const avgTime = Math.round(totalTime / testData.filter(d => (d.videoTime + d.homeworkTime) > 0).length);
  
  // Прогноз уроков
  const currentLessonsPerDay = completedLessons / currentDay;
  const allData = [];
  
  // Заполняем данные для всех 90 дней
  for (let day = 1; day <= 90; day++) {
    const existingDay = testData.find(d => d.day === day);
    if (existingDay) {
      allData.push({ day: day, lessons: existingDay.lessons, forecast: null });
    } else if (day <= currentDay) {
      allData.push({ day: day, lessons: null, forecast: null });
    } else {
      // Рассчитываем прогноз
      const forecastValue = Math.round(currentLessonsPerDay * day);
      
      // Если прогноз достиг 40, останавливаем линию
      if (forecastValue >= 40) {
        allData.push({
          day: day,
          lessons: null,
          forecast: 40
        });
        break; // Прекращаем добавление данных после достижения 40
      } else {
        allData.push({
          day: day,
          lessons: null,
          forecast: forecastValue
        });
      }
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
  
  // Данные для графика настроения с скользящей средней
  const moodData = [];
  let lastMovingAvgValue = null;
  
  for (let day = 1; day <= 90; day++) {
    const existingDay = testData.find(d => d.day === day);
    let movingAvg = null;
    
    if (existingDay) {
      // Рассчитываем скользящую среднюю по 3 точкам
      const prevDay = testData.find(d => d.day === day - 1);
      const nextDay = testData.find(d => d.day === day + 1);
      const values = [existingDay.mood];
      if (prevDay) values.push(prevDay.mood);
      if (nextDay) values.push(nextDay.mood);
      movingAvg = values.reduce((sum, val) => sum + val, 0) / values.length;
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
  const chartWidth = 85; // примерно 85% ширины занимает сам график (без осей)
  const chartHeight = 70; // примерно 70% высоты занимает сам график (без осей)
  const labelXPosition = `${15 + (lastDayWithData / 90) * chartWidth}%`; // 15% отступ слева для оси Y
  const labelYPosition = lastMovingAvgValue ? 
    `${15 + (5 - lastMovingAvgValue) / 4 * chartHeight}%` : '50%'; // 15% отступ сверху для заголовков

  // Подсчет страйка
  let currentStreak = 0;
  for (let i = testData.length - 1; i >= 0; i--) {
    if ((testData[i].videoTime + testData[i].homeworkTime) > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  return React.createElement('div', { className: "max-w-md mx-auto bg-white min-h-screen border border-gray-300 px-1" },
    // Заголовок
    React.createElement('div', { className: "bg-data-categories-neutral text-black px-4 pt-4 pb-0 relative mb-0" },
      React.createElement('h1', { className: "text-3xl font-bold text-black" }, "French A2→B1"),
      React.createElement('p', { className: "text-black text-base opacity-70" }, "90 days • 40 lessons"),
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
              backgroundColor: '#4caf50',
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
    React.createElement('div', { className: "px-4 mb-1" },
      React.createElement('h3', { className: "text-base font-medium text-gray-700" }, "Cumulative Lessons Completed"),
      React.createElement('div', { className: "text-sm text-gray-500 mb-1 flex items-center gap-2" },
        React.createElement('div', { 
          style: { 
            width: '20px', 
            height: '2px', 
            background: 'repeating-linear-gradient(to right, #4caf50 0px, #4caf50 3px, transparent 3px, transparent 6px)',
            opacity: 0.5
          } 
        }),
        React.createElement('span', null, " — automated forecast")
      ),
      React.createElement('div', { className: "h-40" },
        React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
          React.createElement(LineChart, { data: allData },
            React.createElement(XAxis, { 
              type: "number",
              dataKey: "day", 
              domain: [0, 90],
              ticks: [1, 10, 30, 60, 90],
              tick: { fontSize: 0 }
            }),
            React.createElement(YAxis, { 
              domain: [0, 40],
              fontSize: 12
            }),
            React.createElement(Line, { 
              type: "step", 
              dataKey: "lessons", 
              stroke: "#4caf50", 
              strokeWidth: 2,
              dot: false,
              connectNulls: false
            }),
            React.createElement(Line, { 
              type: "monotone", 
              dataKey: "forecast", 
              stroke: "#4caf50", 
              strokeWidth: 2,
              strokeDasharray: "3 3",
              strokeOpacity: 0.5,
              dot: false,
              connectNulls: false
            })
          )
        )
      )
    ),

    // График времени по дням
    React.createElement('div', { className: "px-4 mb-1" },
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
      React.createElement('div', { className: "h-40" },
        React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
          React.createElement(BarChart, { data: timeData },
            React.createElement(XAxis, { 
              type: "number",
              dataKey: "day", 
              domain: [0, 90],
              ticks: [1, 10, 30, 60, 90],
              tick: { fontSize: 0 }
            }),
            React.createElement(YAxis, { 
              domain: [0, 80],
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
    React.createElement('div', { className: "px-4 mb-1" },
      React.createElement('h3', { className: "text-base font-medium text-gray-700" }, "Emotional State"),
      React.createElement('div', { className: "text-sm text-gray-500 mb-1" }, "1 – Total disaster, 5 – Absolutely brilliant."),
      React.createElement('div', { className: "h-20 relative" },
        React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
          React.createElement(LineChart, { data: moodData },
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
              fontSize: 12
            }),
            React.createElement(Line, { 
              type: "monotone", 
              dataKey: "mood", 
              stroke: "transparent",
              strokeWidth: 0,
              dot: { fill: "#e91e63", fillOpacity: 0.5, r: 3 },
              connectNulls: false
            }),
            React.createElement(Line, { 
              type: "monotone", 
              dataKey: "movingAvg", 
              stroke: "#e91e63", 
              strokeWidth: 4,
              dot: false,
              connectNulls: false
            })
          )
        ),
        React.createElement('div', { 
          className: "absolute text-sm pointer-events-none", 
          style: { 
            left: labelXPosition, 
            top: labelYPosition, 
            color: '#e91e63',
            transform: 'translateY(-50%)'
          }
        }, "moving average")
      )
    ),

    // Подвал
    React.createElement('div', { className: "px-4 py-3 text-left border-t border-gray-200" },
        React.createElement('div', { className: "text-sm text-gray-500" },
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
      
      // Дополнительно скрыть через CSS классы
      const style = document.createElement('style');
      style.textContent = `
        .recharts-cartesian-axis-y line {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }
        .recharts-cartesian-axis-tick-value {
          font-size: 12px !important;
          fill: #000000 !important;
        }
      `;
      document.head.appendChild(style);
    }, 100);
  } else {
    document.getElementById('root').innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Ошибка загрузки библиотек. Проверьте подключение к интернету.</div>';
  }
});
