// Centralized API config and request helper
// Vite env: define VITE_API_BASE_URL during build/deploy
// Examples:
//   VITE_API_BASE_URL=https://api.yourdomain.com/api
//   VITE_API_BASE_URL=http://localhost:3020/api

const ENV_BASE = 'http://localhost:3050/api'|| "https://yarnflow-production.up.railway.app/api";

// Fallback logic:
// - If ENV_BASE exists, use it
// - Else if running in browser, try same-origin "/api"
// - Else default to local dev backend
export const API_BASE_URL =
  ENV_BASE ||
  'http://localhost:3050/api';

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
