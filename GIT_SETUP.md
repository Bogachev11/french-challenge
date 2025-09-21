# Git Repository Setup Instructions

## 1. Initialize Git Repository

```bash
# Initialize git repository
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: French Challenge Dashboard"
```

## 2. Connect to GitHub

```bash
# Add remote origin (replace with your repository URL)
git remote add origin https://github.com/bogachev-al/french-challenge-dashboard.git

# Push to main branch
git branch -M main
git push -u origin main
```

## 3. Set up GitHub Secrets

1. Go to your GitHub repository
2. Click "Settings" → "Secrets and variables" → "Actions"
3. Add these repository secrets:

| Secret Name | Value |
|-------------|-------|
| `GOOGLE_SHEETS_API_KEY` | AIzaSyBOewv068qAmujAaU5du_-VqAfqzzjkgGM |
| `GOOGLE_SHEETS_ID` | 1h-5h_20vKLjIq9t0YlFf5BvPDMOaKURfbzZuNSyTyZ4 |
| `GOOGLE_SHEETS_RANGE` | 90_days_list!A2:H |

## 4. Enable GitHub Pages

1. Go to repository "Settings"
2. Scroll to "Pages" section
3. Set source to "GitHub Actions"
4. Save

## 5. Local Development Setup

```bash
# Install dependencies
npm install

# Create local environment file
cp env.example .env.local

# Start development server
npm start
```

## 6. Deployment Commands

```bash
# Deploy to GitHub Pages
npm run deploy

# Or push to main branch (automatic deployment)
git add .
git commit -m "Update dashboard"
git push origin main
```

## 7. Verify Deployment

- Local: http://localhost:3000
- Production: https://bogachev-al.github.io/french-challenge-dashboard

## Troubleshooting

### Common Issues

1. **GitHub Actions fails**: Check secrets are set correctly
2. **Charts not loading**: Verify Google Sheets permissions
3. **Local development issues**: Check .env.local file exists

### Support

Contact: [@bogachev_al](https://twitter.com/bogachev_al)

