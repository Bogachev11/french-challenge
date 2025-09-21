#!/bin/bash

# French Challenge Dashboard Setup Script

echo "🚀 Setting up French Challenge Dashboard..."

# Create .env.local file
cat > .env.local << EOF
# Local development environment variables
REACT_APP_GOOGLE_SHEETS_API_KEY=AIzaSyBOewv068qAmujAaU5du_-VqAfqzzjkgGM
REACT_APP_GOOGLE_SHEETS_ID=1h-5h_20vKLjIq9t0YlFf5BvPDMOaKURfbzZuNSyTyZ4
REACT_APP_GOOGLE_SHEETS_RANGE=90_days_list!A2:H
EOF

echo "✅ Created .env.local file"

# Install dependencies if package.json exists
if [ -f "package.json" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
fi

echo "🎉 Setup complete!"
echo ""
echo "To start development server:"
echo "  npm start"
echo ""
echo "To deploy to GitHub Pages:"
echo "  npm run deploy"
echo ""
echo "Local URL: http://localhost:3000"

