# React Native GRN API Implementation

## 🔌 Core API Service

### File: `services/GRNAPI.js`
```javascript
import { apiRequest } from './common';

export const grnAPI = {
  // Core CRUD Operations
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/grn${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id) => apiRequest(`/grn/${id}`),
  
  create: async (grnData) => apiRequest('/grn', {
    method: 'POST',
    body: JSON.stringify(grnData),
  }),

  update: async (id, grnData) => apiRequest(`/grn/${id}`, {
    method: 'PUT',
    body: JSON.stringify(grnData),
  }),

  delete: async (id) => apiRequest(`/grn/${id}`, { method: 'DELETE' }),

  // Status Management
  updateStatus: async (id, status, notes = '') => 
    apiRequest(`/grn/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),

  // Quality Control
  approve: async (id, approvedBy, notes = '') =>
    apiRequest(`/grn/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ approvedBy, notes }),
    }),

  // Analytics
  getStats: async () => apiRequest('/grn/stats'),
};
```

## 🛠️ Utility Functions

### File: `utils/GRNUtils.js`
```javascript
export const grnUtils = {
  // Status Management (Simplified - matches current implementation)
  formatStatus: (status) => {
    const statusMap = {
      'Draft': 'Draft',
      'Partial': 'Partial',
      'Complete': 'Complete'
    };
    return statusMap[status] || status;
  },

  getStatusColor: (status) => {
    const colorMap = {
      'Draft': '#6B7280',
      'Partial': '#F59E0B',
      'Complete': '#10B981'
    };
    return colorMap[status] || '#6B7280';
  },

  // Business Logic
  calculateCompletion: (items) => {
    if (!items || items.length === 0) return 0;
    
    let totalOrdered = 0;
    let totalReceived = 0;
    
    items.forEach(item => {
      totalOrdered += item.orderedQuantity || 0;
      totalReceived += item.receivedQuantity || 0;
    });
    
    return totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;
  },

  // Simplified Workflow
  getNextStatuses: (currentStatus) => {
    const statusFlow = {
      'Draft': ['Partial', 'Complete'],
      'Partial': ['Complete'],
      'Complete': []
    };
    return statusFlow[currentStatus] || [];
  },

  // Formatting
  formatDate: (date) => 
    new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
};
```

## 📡 Backend Endpoints

### Current API Routes
```javascript
// Statistics
GET /api/grn/stats

// CRUD Operations
GET /api/grn                    // Get all with filters
GET /api/grn/:id               // Get by ID
POST /api/grn                  // Create new GRN
PUT /api/grn/:id               // Update GRN
DELETE /api/grn/:id            // Delete GRN

// Status Management
PATCH /api/grn/:id/status      // Update status
PATCH /api/grn/:id/approve     // Approve GRN
```

### Query Parameters for GET /api/grn
```javascript
{
  page: 1,                     // Pagination
  limit: 10,                   // Items per page
  search: 'term',              // Search in GRN number, PO number
  status: 'Complete',          // Filter by status: Draft, Partial, Complete
  supplier: 'id',              // Filter by supplier
  purchaseOrder: 'id',         // Filter by PO
  dateFrom: '2024-01-01',      // Date range
  dateTo: '2024-12-31'
}
```

## 🔄 Data Flow Examples

### 1. Create GRN Flow
```javascript
// 1. Get incomplete POs
const pos = await purchaseOrderAPI.getAll({ 
  status: 'Approved' 
});

// 2. Select PO and get details
const poDetails = await purchaseOrderAPI.getById(selectedPOId);

// 3. Create GRN with items
const grnData = {
  purchaseOrder: selectedPOId,
  receiptDate: new Date(),
  warehouseLocation: 'WH001',
  items: poDetails.items.map(item => ({
    purchaseOrderItem: item._id,
    productName: item.productName,
    orderedQuantity: item.quantity,
    receivedQuantity: userInput.receivedQty,
    // ... other fields
  }))
};

await grnAPI.create(grnData);
```

### 2. Status Update Flow
```javascript
// Update GRN status (simplified)
await grnAPI.updateStatus(grnId, 'Complete', 'All items received');

// Refresh data
await fetchGRNs();
```

## 🎯 Key Integration Points

### Form Data Structure
```javascript
const formData = {
  purchaseOrder: 'po_id',
  receiptDate: '2024-01-01',
  warehouseLocation: 'godown-maryadpatti', // From warehouse constants
  generalNotes: 'Notes...',
  items: [
    {
      purchaseOrderItem: 'item_id',
      productName: 'Product Name',
      orderedQuantity: 100,
      receivedQuantity: 95,
      previouslyReceived: 0,
      pendingQuantity: 5,
      unit: 'Bags',
      weight: 5000, // in kg
      notes: 'Item notes...'
    }
  ]
};

// Warehouse Location Constants (from your warehouseLocations.js)
const WAREHOUSE_LOCATIONS = [
  {
    id: 'shop-chakinayat',
    name: 'Shop - Chakinayat',
    code: 'SHP-CHK',
    type: 'Shop'
  },
  {
    id: 'godown-maryadpatti',
    name: 'Godown -Maryadpatti',
    code: 'MYD-GDN',
    type: 'Godown'
  },
  {
    id: 'others',
    name: 'Others',
    code: 'OTH',
    type: 'Others'
  }
];
```

### Error Handling
```javascript
try {
  const result = await grnAPI.create(grnData);
  // Success handling
} catch (error) {
  // Error handling
  Alert.alert('Error', error.message || 'Failed to create GRN');
}
```
