// API configuration for different environments
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:5000'
  },
  production: {
    baseURL: import.meta.env.VITE_API_URL || 'https://your-railway-app-url.railway.app'
  }
};

const environment = import.meta.env.MODE || 'development';
export const API_BASE_URL = API_CONFIG[environment].baseURL;

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}/api${endpoint}`;
};
