// API configuration for different environments
import { currentConfig } from './environment.js';

const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:5000'
  },
  production: {
    baseURL: currentConfig.API_BASE_URL
  }
};

const environment = import.meta.env.MODE || 'development';
export const API_BASE_URL = API_CONFIG[environment].baseURL;

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}/api${endpoint}`;
};

// Log API configuration for debugging
console.log('🔗 API Configuration:');
console.log('  Environment:', environment);
console.log('  Base URL:', API_BASE_URL);
console.log('  Sample endpoint:', buildApiUrl('/health'));
