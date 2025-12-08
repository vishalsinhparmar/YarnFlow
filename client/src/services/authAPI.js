// Authentication API Service
import { apiRequest } from './common.js';

export const authAPI = {
  // Register new user
  register: async (email, password) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Login user
  login: async (email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Verify token
  verifyToken: async (token) => {
    return apiRequest('/auth/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};

export default authAPI;
