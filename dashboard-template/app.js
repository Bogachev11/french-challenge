// Проверка загрузки библиотек
if (typeof React === 'undefined') {
  console.error('React not loaded');
}
if (typeof Recharts === 'undefined') {
  console.error('Recharts not loaded');
}

const { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, ComposedChart, Dot, ReferenceLine, Label } = Recharts;

// Пример данных (замените на свои)
const sampleData = [
  { day: 1, value: 10, category: 'A' },
  { day: 2, value: 15, category: 'A' },
  { day: 3, value: 12, category: 'B' },
  { day: 4, value: 20, category: 'A' },
  { day: 5, value: 18, category: 'B' },
];

function Dashboard() {
  const [data] = React.useState(sampleData);
  const currentDay = data.length > 0 ? data[data.length - 1].day : 1;

  // Вертикальная центрированная верстка
  return React.createElement('div', { 
    className: "max-w-md mx-auto bg-white min-h-screen border border-gray-300 px-1" 
  },
    // Заголовок
    React.createElement('div', { 
      className: "bg-data-categories-neutral text-black px-4 pt-4 pb-0 relative mb-0" 
    },
      React.createElement('h1', { 
        className: "text-3xl font-bold text-black" 
      }, "Dashboard Title"),
      React.createElement('p', { 
        className: "text-black text-base opacity-70" 
      }, `Day ${currentDay}`)
    ),

    // Метрики (пример карточек)
    React.createElement('div', { 
      className: "grid grid-cols-4 gap-2 p-4" 
    },
      React.createElement('div', { 
        className: "bg-gray-50 p-2 rounded-lg" 
      },
        React.createElement('div', { 
          className: "text-xl font-bold text-gray-800" 
        }, "42"),
        React.createElement('div', { 
          className: "text-sm text-gray-600" 
        }, "metric 1")
      ),
      React.createElement('div', { 
        className: "bg-gray-50 p-2 rounded-lg" 
      },
        React.createElement('div', { 
          className: "text-xl font-bold text-gray-800" 
        }, "15"),
        React.createElement('div', { 
          className: "text-sm text-gray-600" 
        }, "metric 2")
      ),
      React.createElement('div', { 
        className: "bg-gray-50 p-2 rounded-lg" 
      },
        React.createElement('div', { 
          className: "text-xl font-bold text-gray-800" 
        }, "8"),
        React.createElement('div', { 
          className: "text-sm text-gray-600" 
        }, "metric 3")
      ),
      React.createElement('div', { 
        className: "bg-gray-50 p-2 rounded-lg" 
      },
        React.createElement('div', { 
          className: "text-xl font-bold text-gray-800" 
        }, "5"),
        React.createElement('div', { 
          className: "text-sm text-gray-600" 
        }, "metric 4")
      )
    ),

    // Пример графика - Line Chart
    React.createElement('div', { 
      className: "px-4 mb-4" 
    },
      React.createElement('h3', { 
        className: "text-base font-medium text-gray-700" 
      }, "Chart Title"),
      React.createElement('div', { 
        className: "h-36 relative", 
        style: { marginTop: '10px', height: 'calc(9rem * 0.85 / 1.5 + 10px)' } 
      },
        React.createElement(ResponsiveContainer, { 
          width: "100%", 
          height: "100%" 
        },
          React.createElement(LineChart, { 
            data: data, 
            margin: { left: 5, right: 10, top: 9, bottom: 0 } 
          },
            React.createElement(XAxis, { 
              type: "number",
              dataKey: "day", 
              domain: [0, 10],
              tick: { fill: '#000000', fontSize: 12 },
              tickLine: { stroke: '#000000', strokeWidth: 1 }
            }),
            React.createElement(YAxis, { 
              tick: { fill: '#000000', fontSize: 12 },
              tickLine: { stroke: '#000000', strokeWidth: 1 }
            }),
            React.createElement(Line, { 
              type: "monotone", 
              dataKey: "value", 
              stroke: "#3b82f6", 
              strokeWidth: 2,
              dot: false
            })
          )
        )
      )
    ),

    // Пример графика - Bar Chart
    React.createElement('div', { 
      className: "px-4 mb-4" 
    },
      React.createElement('h3', { 
        className: "text-base font-medium text-gray-700" 
      }, "Bar Chart Title"),
      React.createElement('div', { 
        className: "h-36 relative", 
        style: { marginTop: '10px', height: 'calc(9rem * 0.85 / 1.5 + 10px)' } 
      },
        React.createElement(ResponsiveContainer, { 
          width: "100%", 
          height: "100%" 
        },
          React.createElement(BarChart, { 
            data: data, 
            margin: { left: 5, right: 10, top: 9, bottom: 0 } 
          },
            React.createElement(XAxis, { 
              type: "number",
              dataKey: "day", 
              domain: [0, 10],
              tick: { fill: '#000000', fontSize: 12 },
              tickLine: { stroke: '#000000', strokeWidth: 1 }
            }),
            React.createElement(YAxis, { 
              tick: { fill: '#000000', fontSize: 12 },
              tickLine: { stroke: '#000000', strokeWidth: 1 }
            }),
            React.createElement(Bar, { 
              dataKey: "value", 
              fill: "#3b82f6"
            })
          )
        )
      )
    )
  );
}

// Рендеринг
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(Dashboard));



