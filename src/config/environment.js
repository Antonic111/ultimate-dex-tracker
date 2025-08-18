// Environment configuration for different deployment environments
export const ENV_CONFIG = {
  // Development environment
  development: {
    API_BASE_URL: 'http://localhost:5000',
    NODE_ENV: 'development'
  },
  
  // Production environment (Vercel)
  production: {
    API_BASE_URL: 'https://www.ultimatedextracker.com',
    NODE_ENV: 'production'
  }
};

// Get current environment
const currentEnv = import.meta.env.MODE || 'development';
export const currentConfig = ENV_CONFIG[currentEnv];

export default currentConfig;
