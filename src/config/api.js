// API configuration for different environments
import { currentConfig } from './environment.js';

let rawEnvUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL = rawEnvUrl !== undefined ? rawEnvUrl : (currentConfig?.API_BASE_URL ?? '');

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!API_BASE_URL) {
    return cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api${cleanEndpoint}`;
  }
  const cleanBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return cleanEndpoint.startsWith('/api') ? `${cleanBase}${cleanEndpoint}` : `${cleanBase}/api${cleanEndpoint}`;
};


