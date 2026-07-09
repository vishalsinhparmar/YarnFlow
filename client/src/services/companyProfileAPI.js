import { apiRequest } from './common.js';

// ============ COMPANY PROFILE API ============
export const companyProfileAPI = {
  // GET  /api/company-profile
  get: async () => {
    return apiRequest('/company-profile');
  },

  // PUT  /api/company-profile
  update: async (data) => {
    return apiRequest('/company-profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};

export default companyProfileAPI;
