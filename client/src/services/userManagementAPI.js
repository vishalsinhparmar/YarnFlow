import { apiRequest } from './common.js';

export const userManagementAPI = {
  getAll: () => apiRequest('/users'),

  create: (data) =>
    apiRequest('/users', { method: 'POST', body: JSON.stringify(data) }),

  update: (id, data) =>
    apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  toggleActive: (id) =>
    apiRequest(`/users/${id}/toggle-active`, { method: 'PATCH' }),

  resetPassword: (id, password) =>
    apiRequest(`/users/${id}/reset-password`, { method: 'PATCH', body: JSON.stringify({ password }) }),

  remove: (id) =>
    apiRequest(`/users/${id}`, { method: 'DELETE' }),
};

export default userManagementAPI;
