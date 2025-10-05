// Check library availability
if (typeof React === 'undefined') {
  console.error('React not loaded');
}
if (typeof Recharts === 'undefined') {
  console.error('Recharts not loaded');
}

const { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, ComposedChart, Dot } = Recharts;

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

// Кастомный компонент для выделения текущего дня на оси X
const CustomXAxisTick = (props) => {
  const { x, y, payload, currentDay, hideLabels } = props;
  const isCurrentDay = payload.value === currentDay;
  
  // Если нужно скрыть labels, возвращаем пустой элемент
  if (hideLabels) {
    return React.createElement('g', { transform: `translate(${x},${y})` });
  }
  
  // Скрываем подписи для 1, 10, 30, 60, 90 если текущий день рядом
  const specialDays = [1, 10, 30, 60, 90];
  const shouldHideSpecialDay = specialDays.includes(payload.value) && 
    Math.abs(payload.value - currentDay) <= 2;
  
  if (shouldHideSpecialDay) {
    return React.createElement('g', { transform: `translate(${x},${y})` });
  }
  
  return React.createElement('g', { transform: `translate(${x},${y})` },
    React.createElement('text', {
      x: 0,
      y: 0,
      dy: 10,
      textAnchor: "middle",
      fill: isCurrentDay ? '#000000' : '#666666',
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
    return `${diffMinutes} min ago`;
  } else if (diffHours < 24 && diffDays === 0) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays >= 2) {
    return '2+ days ago';
  }
  
  return 'today';
};

// Simple function to log update time
const saveUpdateTime = (time) => {
  console.log('Update time:', time);
};

// GitHub API function to update log file
const updateGitHubFiles = async (newDataHash) => {
  try {
    console.log('🚀 GitHub API: Starting update process...');
    
    const now = new Date();
    
    // Обновляем update-log.json
    const updateLogData = {
      lastUpdateTime: now.toISOString(),
      commitMessage: `Data updated at ${now.toLocaleDateString('ru-RU')}, ${now.toLocaleTimeString('ru-RU')}`,
      location: "GitHub repository",
      dataHash: newDataHash
    };

    // Получаем SHA для update-log.json
    const getLogResponse = await fetch(`https://api.github.com/repos/bogachev11/french-challenge/contents/update-log.json`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    let logSha = null;
    if (getLogResponse.ok) {
      const fileData = await getLogResponse.json();
      logSha = fileData.sha;
    }

    // Обновляем файл
    const updateLogResponse = await fetch(`https://api.github.com/repos/bogachev11/french-challenge/contents/update-log.json`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Update time at ${now.toISOString()}`,
        content: btoa(JSON.stringify(updateLogData, null, 2)),
        sha: logSha
      })
    });

    if (updateLogResponse.ok) {
      console.log('✅ GitHub files updated successfully');
    } else {
      console.error('❌ GitHub update failed');
    }
  } catch (error) {
    console.error('GitHub API error:', error);
  }
};

// Simple function to calculate data hash
const calculateDataHash = (data) => {
  return JSON.stringify(data);
};

const FrenchChallengeDashboard = () => {
  // State for Google Sheets data
  const [sheetData, setSheetData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [lastUpdateTime, setLastUpdateTime] = React.useState(new Date(Date.now() - 24 * 60 * 60 * 1000)); // Default to yesterday
  const [previousDataHash, setPreviousDataHash] = React.useState('loading');
  
  // Load last update time and data hash from files
  React.useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Attempting to load update-log.json...');
        const githubResponse = await fetch('./update-log.json');
        console.log('📡 Response status:', githubResponse.status);
        console.log('📡 Response ok:', githubResponse.ok);
        
        if (githubResponse.ok) {
          const githubData = await githubResponse.json();
          console.log('📄 Raw file data:', githubData);
          
          if (githubData.lastUpdateTime) {
            setLastUpdateTime(new Date(githubData.lastUpdateTime));
            console.log('✅ Loaded last update time from GitHub file:', new Date(githubData.lastUpdateTime));
          } else {
            console.log('❌ No lastUpdateTime in file');
          }
          
          if (githubData.dataHash && githubData.dataHash.length > 0) {
            setPreviousDataHash(githubData.dataHash);
            console.log('✅ Loaded previous data hash from update-log.json:', githubData.dataHash.substring(0, 50) + '...');
          } else {
            console.log('❌ No data hash found in update-log.json');
            setPreviousDataHash('');
          }
        } else {
          console.log('❌ Failed to load update-log.json:', githubResponse.status, githubResponse.statusText);
          const errorText = await githubResponse.text();
          console.log('❌ Error response:', errorText);
        }
      } catch (error) {
        console.log('❌ Files not available, using defaults. Error:', error);
        setLastUpdateTime(new Date(Date.now() - 24 * 60 * 60 * 1000));
        setPreviousDataHash('');
      }
    };
    
    loadData();
  }, []);
  
  // Google Sheets API settings
  const SHEET_ID = '1h-5h_20vKLjIq9t0YlFf5BvPDMOaKURfbzZuNSyTyZ4';
  const API_KEY = 'AIzaSyBOewv068qAmujAaU5du_-VqAfqzzjkgGM';
  const RANGE = '90_days_list!A2:J'; // Data starting from row 2 (without headers) from sheet "90_days_list"
  
  // Load data from Google Sheets
  React.useEffect(() => {
    // Don't fetch data until we have loaded the previous hash
    if (previousDataHash === 'loading') return;
    
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
              mood: parseInt(row[8]) || null
            }));
        
        setSheetData(formattedData);
        setError(null);
        
        console.log('Formatted data:', formattedData);
        
        // Check if data actually changed by comparing hashes
        const newDataHash = calculateDataHash(formattedData);
        
        console.log('🔍 HASH ANALYSIS:');
        console.log('📊 New data hash length:', newDataHash.length);
        console.log('📊 Previous data hash length:', previousDataHash.length);
        console.log('📊 Hash comparison - Equal:', newDataHash === previousDataHash);
        console.log('📊 Previous hash exists:', !!previousDataHash);
        console.log('📊 New hash preview:', newDataHash.substring(0, 100) + '...');
        console.log('📊 Previous hash preview:', previousDataHash.substring(0, 100) + '...');
        
        // Debug: show what's different if lengths don't match
        if (previousDataHash && newDataHash.length !== previousDataHash.length) {
          console.log('⚠️ Hash lengths differ - investigating...');
          const newData = JSON.parse(newDataHash);
          const prevData = JSON.parse(previousDataHash);
          console.log('New data entries:', newData.length);
          console.log('Previous data entries:', prevData.length);
          
          // Compare each entry to find differences
          for (let i = 0; i < Math.max(newData.length, prevData.length); i++) {
            if (!newData[i] || !prevData[i] || JSON.stringify(newData[i]) !== JSON.stringify(prevData[i])) {
              console.log(`Difference at index ${i}:`, {
                new: newData[i],
                prev: prevData[i]
              });
            }
          }
        }
        
        // Update time only if we have previous data and it changed
        if (previousDataHash && newDataHash !== previousDataHash) {
          // Data changed - update time
          console.log('🔄 DATA CHANGED - updating time and calling GitHub API');
          const now = new Date();
          setLastUpdateTime(now);
          saveUpdateTime(now);
          
          // Обновить GitHub файл через API
          updateGitHubFiles(newDataHash);
          
          console.log('Data changed! Time updated to now');
        } else if (previousDataHash) {
          console.log('✅ No changes detected - keeping existing time');
        } else {
          console.log('🚀 First load - not updating time');
          // При первом запуске GitHub Actions обновит файл автоматически
          console.log('📝 First load - GitHub Actions will update log file automatically');
        }
        
        // Always save current data hash for next comparison
        setPreviousDataHash(newDataHash);
        
      } catch (apiError) {
        console.error('API failed:', apiError);
        setError(`Loading error: ${apiError.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [previousDataHash]);
  
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
  
  // Рассчитываем общее время (включая otherTime)
  const totalTime = filteredTestData.reduce((sum, day) => sum + day.theoryTime + day.homeworkTime + day.prolingvoTime + day.otherTime, 0);
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
  
  // Данные для графика времени (все 90 дней)
  const timeData = [];
  for (let day = 1; day <= displayCurrentDay; day++) {
    const existingDay = filteredTestData.find(d => d.day === day);
    timeData.push({
      day: day,
      theoryTime: existingDay ? existingDay.theoryTime : 0,
      homeworkTime: existingDay ? existingDay.homeworkTime : 0,
      prolingvoTime: existingDay ? existingDay.prolingvoTime : 0,
      otherTime: existingDay ? existingDay.otherTime : 0
    });
  }
  
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
    const hasActivity = (day.theoryTime + day.homeworkTime + day.prolingvoTime + day.otherTime) > 0 || 
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
        React.createElement('div', { className: "text-xl font-bold text-gray-800" }, 
          `${avgTime}`, React.createElement('span', { className: "thin-nbsp" }), 'm'
        ),
        React.createElement('div', { className: "text-sm text-gray-600" }, "avg/day")
      ),
      React.createElement('div', { className: "bg-gray-50 p-2 rounded-lg" },
        React.createElement('div', { className: "text-xl font-bold text-gray-800" }, 
          `${Math.round(totalTime/60)}`, React.createElement('span', { className: "thin-nbsp" }), 'h'
        ),
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
      React.createElement('h3', { className: "text-base font-medium text-gray-700" }, "Lessons Progress"),
      React.createElement('div', { className: "text-sm text-gray-500 mb-1 flex items-center gap-3" },
        React.createElement('div', { className: "flex items-center gap-1" },
          React.createElement('div', { 
            style: { 
              width: '8px', 
              height: '8px', 
              backgroundColor: '#3b82f6',
              borderRadius: '50%'
            } 
          }),
          React.createElement('span', null, "Cumulative")
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
          React.createElement('span', null, "Daily")
        )
      ),
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
                  ticks.sort((a, b) => a - b);
                }
                
                return ticks;
              })(),
              tickFormatter: (value) => {
                return ''; // Скрываем все labels
              },
              tickLine: { stroke: '#000000', strokeWidth: 1 },
              tick: (props) => React.createElement(CustomXAxisTick, { ...props, currentDay: displayCurrentDay, hideLabels: true })
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
              dot: false,
              connectNulls: false,
              data: allData.filter(d => d.day <= displayCurrentDay)
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
              fill: "#9ca3af", 
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
          React.createElement('span', null, "Theory")
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
              backgroundColor: '#e91e63',
              borderRadius: '50%'
            } 
          }),
          React.createElement('span', null, "Basic grammar")
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
      React.createElement('div', { className: "h-36", style: { marginTop: '10px', height: 'calc(9rem * 0.85)' } },
        React.createElement(ResponsiveContainer, { width: "100%", height: "100%" },
          React.createElement(BarChart, { data: timeData, barCategoryGap: 0, margin: { left: 5, right: 10, top: 9, bottom: 0 }, key: chartKey },
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
              domain: [0, Math.ceil(Math.max(...timeData.map(d => d.totalTime)) / 30) * 30],
              ticks: (() => {
                const max = Math.ceil(Math.max(...timeData.map(d => d.totalTime)) / 30) * 30;
                const ticks = [];
                for (let i = 0; i <= max; i += 30) {
                  ticks.push(i);
                }
                return ticks;
              })(),
              tickFormatter: (value) => {
                if (value === 0) return '0\u202Fm';
                if (value < 60) return `${value}\u202Fm`;
                const hours = Math.floor(value / 60);
                const minutes = value % 60;
                if (minutes === 0) return `${hours}\u202Fh`;
                return `${hours}\u202Fh\u202F${minutes}\u202Fm`;
              },
              axisLine: false,
              fontSize: 12
            }),
            React.createElement(Bar, { dataKey: "theoryTime", stackId: "time", fill: "#03a9f4" }),
            React.createElement(Bar, { dataKey: "homeworkTime", stackId: "time", fill: "#673ab7" }),
            React.createElement(Bar, { dataKey: "prolingvoTime", stackId: "time", fill: "#e91e63" }),
            React.createElement(Bar, { dataKey: "otherTime", stackId: "time", fill: "#9ca3af" })
          )
        )
      )
    ),

    // График настроения
    React.createElement('div', { className: "px-4 mb-0" },
      React.createElement('h3', { className: "text-base font-medium text-gray-700" }, "Emotional State, moving average"),
      React.createElement('div', { className: "text-sm text-gray-500 mb-1" }, "1 – Total disaster, 5 – absolutely brilliant"),
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
