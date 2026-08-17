// Environment configuration for different deployment environments
export const ENV_CONFIG = {
  // Development environment (uses relative path /api with Vite proxy for both localhost & LAN IPs)
  development: {
    API_BASE_URL: '',
    NODE_ENV: 'development'
  },
  
  // Production environment (Vercel)
  production: {
    API_BASE_URL: '',
    NODE_ENV: 'production'
  }
};

// Get current environment
const currentEnv = import.meta.env.MODE || 'development';
export const currentConfig = ENV_CONFIG[currentEnv] || ENV_CONFIG.development;

export default currentConfig;

