# French Challenge

A beautiful, responsive dashboard for tracking French language learning progress with Google Sheets integration.

## Features

- 📊 **Real-time data** from Google Sheets
- 📈 **Interactive charts** showing learning progress
- 🎯 **Goal tracking** (40 lessons in 90 days)
- 📱 **Mobile responsive** design
- 🔄 **Auto-updating** data

## Charts

1. **Lessons Progress** - Cumulative lessons completed with automated forecast
2. **Daily Time** - Video time, homework time, and other activities
3. **Emotional State** - Mood tracking with moving average

## Setup

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/bogachev11/french-challenge.git
cd french-challenge
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp env.example .env.local
```

4. Start local server:
```bash
npm start
```

5. Open http://localhost:3000

### Google Sheets Setup

1. Create a Google Sheet with the following columns:
   - Column A: Index
   - Column B: Day (1-90)
   - Column C: Completed_Lessons
   - Column D: Attempted_Lessons
   - Column E: Video_Time (minutes)
   - Column F: Homework_Time (minutes)
   - Column G: Other_Time (minutes)
   - Column H: Mood (1-5)

2. Name the sheet "90_days_list"

3. Make the sheet publicly accessible (View permissions)

4. Update the SHEET_ID in your environment variables

## Deployment

### GitHub Pages

The project automatically deploys to GitHub Pages when you push to the `main` branch.

1. Enable GitHub Pages in repository settings
2. Set source to "GitHub Actions"
3. Push to main branch

### Manual Deployment

```bash
npm run deploy
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_GOOGLE_SHEETS_API_KEY` | Google Sheets API key | Provided |
| `REACT_APP_GOOGLE_SHEETS_ID` | Google Sheets document ID | Provided |
| `REACT_APP_GOOGLE_SHEETS_RANGE` | Data range in sheet | `90_days_list!A2:H` |

## Tech Stack

- **React** - UI framework
- **Recharts** - Chart library
- **Tailwind CSS** - Styling
- **Google Sheets API** - Data source
- **GitHub Pages** - Hosting

## Author

Aleksandr Bogachev - [@bogachev_al](https://twitter.com/bogachev_al)

## License

MIT License