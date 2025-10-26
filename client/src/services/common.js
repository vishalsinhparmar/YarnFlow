// Centralized API config and request helper
// Automatically detects environment and uses correct API URL

// Get environment variable from Vite (if set)
const VITE_API_URL = import.meta.env.VITE_API_BASE_URL;

// Detect if we're in development or production
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Set API URLs
const DEVELOPMENT_API = 'http://localhost:3050/api';
const PRODUCTION_API = 'https://yarnflow-production.up.railway.app/api';

// Automatic selection: Use VITE env var if set, otherwise auto-detect
export const API_BASE_URL = VITE_API_URL || (isDevelopment ? DEVELOPMENT_API : PRODUCTION_API);

// Log which API is being used (helpful for debugging)
console.log(`🌐 API Mode: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`🔗 API URL: ${API_BASE_URL}`);

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || `HTTP error! status: ${response.status}`;
    throw new Error(message);
  }

  return data;
};

export default { API_BASE_URL, apiRequest };
