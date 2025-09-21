// Проверяем доступность библиотек
if (typeof React === 'undefined') {
  console.error('React не загружен');
}
if (typeof Recharts === 'undefined') {
  console.error('Recharts не загружен');
}

const { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, ComposedChart } = Recharts;

const FrenchChallengeDashboard = () => {
  // Состояние для данных из Google Sheets
  const [sheetData, setSheetData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  // Google Sheets API настройки
  const SHEET_ID = '1h-5h_20vKLjIq9t0YlFf5BvPDMOaKURfbzZuNSyTyZ4';
  const API_KEY = 'AIzaSyBOewv068qAmujAaU5du_-VqAfqzzjkgGM';
  const RANGE = '90_days_list!A2:H'; // Данные начиная с 2 строки (без заголовков) с листа "90_days_list"
  
  // Загружаем данные из Google Sheets (альтернативный метод через CSV)
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Пробуем сначала через CSV (публичный доступ) - лист "90_days_list"
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0&range=90_days_list`;
        console.log('Trying CSV method:', csvUrl);
        
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
          throw new Error(`CSV fetch failed: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log('CSV data:', csvText);
        
        // Парсим CSV
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        console.log('Headers:', headers);
        
        const formattedData = lines.slice(1) // Пропускаем заголовки
          .filter(line => line.trim()) // Убираем пустые строки
          .map((line, index) => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            console.log(`Row ${index + 1}:`, values);
            
            return {
              day: parseInt(values[1]) || (index + 1), // Day (колонка B)
              completedLessons: values[2] || '', // Completed_Lessons (колонка C)
              attemptedLessons: values[3] || '', // Attempted_Lessons (колонка D)
              videoTime: parseInt(values[4]) || 0, // Video_Time (колонка E)
              homeworkTime: parseInt(values[5]) || 0, // Homework_Time (колонка F)
              otherTime: parseInt(values[6]) || 0, // Other_Time (колонка G)
              mood: parseInt(values[7]) || null // Mood (колонка H)
            };
          })
          .filter(row => row.day); // Фильтруем строки без дня
        
        console.log('Formatted data:', formattedData);
        setSheetData(formattedData);
        setError(null);
        
      } catch (csvError) {
        console.log('CSV method failed, trying API method:', csvError);
        
        // Fallback к API методу
        try {
          const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`,
            {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
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
              videoTime: parseInt(row[4]) || 0,
              homeworkTime: parseInt(row[5]) || 0,
              otherTime: parseInt(row[6]) || 0,
              mood: parseInt(row[7]) || null
            }));
          
          setSheetData(formattedData);
          setError(null);
          
        } catch (apiError) {
          console.error('Both methods failed:', apiError);
          setError(`Ошибка загрузки: ${apiError.message}`);
          // Fallback к тестовым данным
          setSheetData([
            { day: 1, completedLessons: "1", attemptedLessons: "", videoTime: 15, homeworkTime: 10, otherTime: 0, mood: 4 },
            { day: 2, completedLessons: "2", attemptedLessons: "3", videoTime: 20, homeworkTime: 12, otherTime: 0, mood: 4 },
            { day: 3, completedLessons: "3", attemptedLessons: "", videoTime: 25, homeworkTime: 28, otherTime: 30, mood: 5 },
            { day: 4, completedLessons: "", attemptedLessons: "5,6", videoTime: 40, homeworkTime: 0, otherTime: 0, mood: 2 },
            { day: 5, completedLessons: "4,5", attemptedLessons: "", videoTime: 15, homeworkTime: 45, otherTime: 0, mood: 4 },
            { day: 6, completedLessons: "", attemptedLessons: "", videoTime: 0, homeworkTime: 0, otherTime: 0, mood: 2 },
            { day: 7, completedLessons: "6", attemptedLessons: "", videoTime: 10, homeworkTime: 0, otherTime: 0, mood: 3 },
            { day: 8, completedLessons: "7", attemptedLessons: "", videoTime: 0, homeworkTime: 40, otherTime: 0, mood: 4 },
            { day: 9, completedLessons: "", attemptedLessons: "", videoTime: 0, homeworkTime: 0, otherTime: 0, mood: 2 },
            { day: 10, completedLessons: "8,9,10", attemptedLessons: "", videoTime: 10, homeworkTime: 17, otherTime: 0, mood: 5 }
          ]);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Используем данные из Google Sheets
  const testData = sheetData;
  
  // Текущий день - последний день из данных (определяем после получения данных)
  const currentDay = testData.length > 0 ? testData[testData.length - 1].day : 1;
  
  // Обновляем выделение текущего дня при изменении
  React.useEffect(() => {
    if (testData.length === 0) return; // Не выполняем если нет данных
    
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
          if (text.textContent === currentDay.toString()) {
            text.style.fontWeight = 'bold !important';
            text.style.setProperty('font-weight', 'bold', 'important');
          }
        }
      });
    }, 100);
  }, [currentDay, testData.length]);
  
  // Исправляем позиционирование верхних лейблов осей Y
  React.useEffect(() => {
    if (testData.length === 0) return; // Не выполняем если нет данных
    
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
  }, [currentDay, testData.length]);
  
  // Показываем индикатор загрузки
  if (loading) {
    return React.createElement('div', { className: "max-w-md mx-auto bg-white min-h-screen flex items-center justify-center" },
      React.createElement('div', { className: "text-center" },
        React.createElement('div', { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" }),
        React.createElement('p', { className: "text-gray-600" }, "Загрузка данных из Google Sheets...")
      )
    );
  }
  
  // Показываем ошибку если есть
  if (error) {
    return React.createElement('div', { className: "max-w-md mx-auto bg-white min-h-screen flex items-center justify-center" },
      React.createElement('div', { className: "text-center p-4" },
        React.createElement('div', { className: "text-red-500 text-6xl mb-4" }, "⚠️"),
        React.createElement('h2', { className: "text-xl font-bold text-gray-800 mb-2" }, "Ошибка загрузки"),
        React.createElement('p', { className: "text-gray-600 mb-4" }, error),
        React.createElement('p', { className: "text-sm text-gray-500" }, "Используются тестовые данные")
      )
    );
  }
  
  // Если нет данных
  if (testData.length === 0) {
    return React.createElement('div', { className: "max-w-md mx-auto bg-white min-h-screen flex items-center justify-center" },
      React.createElement('div', { className: "text-center p-4" },
        React.createElement('div', { className: "text-gray-400 text-6xl mb-4" }, "📊"),
        React.createElement('h2', { className: "text-xl font-bold text-gray-800 mb-2" }, "Нет данных"),
        React.createElement('p', { className: "text-gray-600" }, "Данные не найдены в Google Sheets")
      )
    );
  }
  
  // Фильтруем данные до текущего дня для эмулятора - ОТКЛЮЧЕНО
  // const filteredTestData = testData.filter(day => day.day <= currentDayState);
  
  // Используем все данные (последний день)
  const filteredTestData = testData;

  // Функция для парсинга строки уроков из Google Sheets
  const parseLessons = (lessonsString) => {
    if (!lessonsString || lessonsString.trim() === '') return [];
    return lessonsString.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
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
  
  // Рассчитываем общее время (включая otherTime)
  const totalTime = filteredTestData.reduce((sum, day) => sum + day.videoTime + day.homeworkTime + day.otherTime, 0);
  const avgTime = Math.round(totalTime / filteredTestData.filter(d => (d.videoTime + d.homeworkTime + d.otherTime) > 0).length);
  
  // Прогноз уроков
  const currentLessonsPerDay = completedLessons / currentDay;
  const allData = [];
  
  // Заполняем данные для всех 90 дней с накопленным количеством уроков
  let cumulativeLessons = 0;
  for (let day = 1; day <= 90; day++) {
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
  
  // Данные для графика времени (все 90 дней)
  const timeData = [];
  for (let day = 1; day <= 90; day++) {
    const existingDay = filteredTestData.find(d => d.day === day);
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
    const existingDay = filteredTestData.find(d => d.day === day);
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
  
  // Принудительное обновление данных при изменении дня - ОТКЛЮЧЕНО
  // const [forceRender, setForceRender] = React.useState(0);
  // const chartKey = `charts-${currentDay}-${forceRender}`;
  // 
  // React.useEffect(() => {
  //   setForceRender(prev => prev + 1);
  // }, [currentDay]);
  
  const chartKey = `charts-${currentDay}`;
  
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
  for (let i = filteredTestData.length - 1; i >= 0; i--) {
    const day = filteredTestData[i];
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
          React.createElement('div', { className: "w-2 h-2 bg-blue-500 rounded-full animate-pulse" }),
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
    React.createElement('div', { className: "px-4 mb-4" },
      React.createElement('h3', { className: "text-base font-medium text-gray-700" }, "Lessons Progress"),
      // React.createElement('div', { className: "text-sm text-gray-500 mb-1" }, "cumulative lessons completed"),
      React.createElement('div', { className: "h-36 relative", style: { marginTop: '10px' } },
        React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
          React.createElement(ComposedChart, { data: allData, margin: { left: 5, right: 10, top: 5, bottom: 0 }, key: chartKey },
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
                if (!baseTicks.includes(currentDay)) {
                  ticks.push(currentDay);
                  ticks.sort((a, b) => a - b);
                }
                
                return ticks;
              })(),
              tickFormatter: (value) => {
                // Скрываем цифры базовых меток, которые слишком близко к текущему дню
                const baseTicks = [1, 10, 30, 60, 90];
                if (baseTicks.includes(value) && Math.abs(value - currentDay) < 2 && value !== currentDay) {
                  return ''; // Скрываем цифру только если это НЕ текущий день
                }
                return value; // Показываем цифру
              },
              tickLine: { stroke: '#000000', strokeWidth: 1 },
              tick: { 
                fontSize: 12
              }
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
            React.createElement(Bar, { 
              dataKey: "dailyLessons", 
              fill: "#1d4ed8", 
              fillOpacity: 0.8,
              stroke: "#1d4ed8",
              strokeWidth: 1
            }),
            React.createElement(Line, { 
              type: "step", 
              dataKey: "lessons", 
              stroke: currentDay >= 4 ? "#3b82f6" : "transparent", 
              strokeWidth: 3,
              dot: false,
              connectNulls: false,
              data: currentDay >= 4 ? allData.filter(d => d.day <= currentDay) : []
            })
          )
        ),
        currentDay >= 4 ? React.createElement('div', { 
          className: "absolute text-sm font-bold pointer-events-auto", 
          style: { 
            left: `${15 + (currentDay / 90) * 80}%`, 
            top: `${(Math.ceil(Math.max(...allData.map(d => d.lessons)) / 5) * 5 - completedLessons) / (Math.ceil(Math.max(...allData.map(d => d.lessons)) / 5) * 5) * 70 + 1}%`, 
            color: '#3b82f6',
            whiteSpace: 'nowrap',
            zIndex: 10,
            transform: 'translateY(-50%)'
          }
        }, "cumulative lessons") : null,
        React.createElement('div', { 
          className: "absolute text-xs text-gray-500", 
          style: { 
            left: `${25 + (1 / 90) * 80}%`, 
            top: '93%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap'
          }
        }, "days from start →")
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
      React.createElement('div', { className: "h-36", style: { marginTop: '10px' } },
        React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
          React.createElement(BarChart, { data: timeData, barCategoryGap: 0, margin: { left: 5, right: 10, top: 5, bottom: 0 }, key: chartKey },
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
                if (!baseTicks.includes(currentDay)) {
                  ticks.push(currentDay);
                  ticks.sort((a, b) => a - b);
                }
                
                return ticks;
              })(),
              tickFormatter: (value) => {
                // Скрываем цифры базовых меток, которые слишком близко к текущему дню
                const baseTicks = [1, 10, 30, 60, 90];
                if (baseTicks.includes(value) && Math.abs(value - currentDay) < 2 && value !== currentDay) {
                  return ''; // Скрываем цифру только если это НЕ текущий день
                }
                return value; // Показываем цифру
              },
              tickLine: { stroke: '#000000', strokeWidth: 1 },
              tick: { 
                fontSize: 12
              }
            }),
            React.createElement(YAxis, { 
              domain: [0, 80],
              ticks: [0, 30, 60, 80], // Задаем конкретные тики
              tickFormatter: (value) => {
                if (value === 0) return '0m';
                if (value < 60) return `${value}m`;
                const hours = Math.floor(value / 60);
                const minutes = value % 60;
                if (minutes === 0) return `${hours}h`;
                return `${hours}h${minutes}m`;
              },
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
          React.createElement(LineChart, { data: moodData, margin: { left: 5, right: 10, top: 5, bottom: 5 }, key: chartKey },
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
                if (!baseTicks.includes(currentDay)) {
                  ticks.push(currentDay);
                  ticks.sort((a, b) => a - b);
                }
                
                return ticks;
              })(),
              tickFormatter: (value) => {
                // Скрываем цифры базовых меток, которые слишком близко к текущему дню
                const baseTicks = [1, 10, 30, 60, 90];
                if (baseTicks.includes(value) && Math.abs(value - currentDay) < 2 && value !== currentDay) {
                  return ''; // Скрываем цифру только если это НЕ текущий день
                }
                return value; // Показываем цифру
              },
              tickLine: { stroke: '#000000', strokeWidth: 1 },
              tick: { 
                fontSize: 12
              }
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
              dot: { 
                fill: currentDay >= 4 ? "#6b7280" : (() => {
                  const moodValue = filteredTestData.find(d => d.day === currentDay)?.mood || 4;
                  if (moodValue <= 1) return '#ef4444';
                  if (moodValue >= 5) return '#3b82f6';
                  if (moodValue <= 3) return '#8b5cf6';
                  return '#3b82f6';
                })(),
                fillOpacity: currentDay >= 4 ? 0.5 : 1, 
                r: currentDay >= 4 ? 3 : 4.5 
              },
              connectNulls: false
            }),
            currentDay < 4 ? React.createElement(Line, { 
              type: "monotone", 
              dataKey: "mood", 
              stroke: (() => {
                const moodValue = filteredTestData.find(d => d.day === currentDay)?.mood || 4;
                if (moodValue <= 1) return '#ef4444';
                if (moodValue >= 5) return '#3b82f6';
                if (moodValue <= 3) return '#8b5cf6';
                return '#3b82f6';
              })(),
              strokeWidth: 2,
              dot: false,
              connectNulls: false,
              data: filteredTestData.filter(d => d.day === currentDay)
            }) : null,
            React.createElement(Line, { 
              type: "monotone", 
              dataKey: "movingAvg", 
              stroke: currentDay >= 4 ? "url(#moodGradient)" : "transparent", 
              strokeWidth: 4,
              dot: false,
              connectNulls: false
            })
          )
        ),
        currentDay >= 4 ? React.createElement('div', { 
          className: "absolute text-sm font-bold pointer-events-auto", 
          style: { 
            left: labelXPosition, 
            top: labelYPosition, 
            color: labelColor,
            whiteSpace: 'nowrap',
            zIndex: 10,
            transform: 'translateY(-50%)'
          }
        }, "moving average") : null
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
        text.style.fontWeight = 'normal';
      });

    }, 100);
  } else {
    document.getElementById('root').innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Ошибка загрузки библиотек. Проверьте подключение к интернету.</div>';
  }
});
