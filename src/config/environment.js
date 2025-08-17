// Environment configuration for different deployment environments
export const ENV_CONFIG = {
  // Development environment
  development: {
    API_BASE_URL: 'http://localhost:5000',
    NODE_ENV: 'development'
  },
  
  // Production environment (Vercel)
  production: {
    API_BASE_URL: 'https://ultimate-dex-tracker-backend.onrender.com',
    NODE_ENV: 'production'
  }
};

// Get current environment
const currentEnv = import.meta.env.MODE || 'development';
export const currentConfig = ENV_CONFIG[currentEnv];

// Log configuration for debugging
console.log('🌍 Environment:', currentEnv);
console.log('🔗 API Base URL:', currentConfig.API_BASE_URL);
console.log('⚙️  Node Environment:', currentConfig.NODE_ENV);

export default currentConfig;
