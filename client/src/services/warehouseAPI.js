import { apiRequest, API_BASE_URL } from './common.js';

export const warehouseAPI = {
  getAll: (includeInactive = false) =>
    apiRequest(`/warehouses${includeInactive ? '?includeInactive=true' : ''}`),

  create: (data) =>
    apiRequest('/warehouses', { method: 'POST', body: JSON.stringify(data) }),

  update: (id, data) =>
    apiRequest(`/warehouses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  remove: (id) =>
    apiRequest(`/warehouses/${id}`, { method: 'DELETE' }),
};

export default warehouseAPI;
