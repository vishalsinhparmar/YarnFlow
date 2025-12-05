// Inventory API Service
import { apiRequest } from './common.js';

// ============ INVENTORY API SERVICE ============
// Note: Inventory is now GRN-based (single source of truth)
// This file maintains backward compatibility while redirecting to GRN endpoints

export const inventoryAPI = {
  // Get all inventory (now fetches from GRN-based inventory)
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    // Redirect to GRN-based inventory endpoint
    return apiRequest(`/inventory${queryString ? `?${queryString}` : ''}`);
  },

  // Note: All inventory operations are now handled through GRN-based endpoints
  // Legacy methods have been removed as inventory is the single source of truth from GRNs
};

export default inventoryAPI;
