// Environment check utility
const checkEnvironment = () => {
  const requiredVars = [
    'REACT_APP_GOOGLE_SHEETS_API_KEY',
    'REACT_APP_GOOGLE_SHEETS_ID',
    'REACT_APP_GOOGLE_SHEETS_RANGE'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing);
    console.warn('Using default values. For production, set these in GitHub Secrets.');
  }
  
  return {
    hasAllVars: missing.length === 0,
    missingVars: missing,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development'
  };
};

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = checkEnvironment;
} else {
  window.checkEnvironment = checkEnvironment;
}

