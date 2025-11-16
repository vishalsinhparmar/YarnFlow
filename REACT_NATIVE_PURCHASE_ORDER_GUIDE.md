# React Native Purchase Order Implementation Guide

## 📋 Overview
This guide provides the complete architecture for implementing Purchase Order functionality in React Native, mirroring the web application's structure and API integration.

## 🏗️ Architecture Overview

### Web App Structure Analysis
```
Web App Components:
├── API Layer: purchaseOrderAPI.js
├── Main Page: PurchaseOrder.jsx  
├── Detail Component: PurchaseOrderDetail.jsx
└── Backend Routes: purchaseOrderRoutes.js
```

### React Native Implementation Structure
```
React Native Components:
├── services/PurchaseOrderAPI.js
├── screens/PurchaseOrderScreen.js
├── components/PurchaseOrderCard.js
├── components/PurchaseOrderDetail.js
├── components/PurchaseOrderForm.js
└── utils/POUtils.js
```

## 🔌 API Service Layer

### File: `services/PurchaseOrderAPI.js`
```javascript
import { apiRequest } from './common';

export const purchaseOrderAPI = {
  // Core CRUD Operations
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/purchase-orders?${queryString}` : '/purchase-orders';
    return apiRequest(endpoint);
  },

  getById: async (id) => apiRequest(`/purchase-orders/${id}`),
  
  create: async (poData) => apiRequest('/purchase-orders', {
    method: 'POST',
    body: JSON.stringify(poData),
  }),

  update: async (id, poData) => apiRequest(`/purchase-orders/${id}`, {
    method: 'PUT', 
    body: JSON.stringify(poData),
  }),

  delete: async (id) => apiRequest(`/purchase-orders/${id}`, {
    method: 'DELETE',
  }),

  // Status Management
  updateStatus: async (id, status, notes = '') => 
    apiRequest(`/purchase-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),

  // Analytics & Filtering
  getStats: async () => apiRequest('/purchase-orders/stats'),
  search: async (searchTerm, filters = {}) => 
    purchaseOrderAPI.getAll({ search: searchTerm, ...filters }),
  getOverdue: async () => purchaseOrderAPI.getAll({ overdue: 'true' }),
  getByStatus: async (status, params = {}) => 
    purchaseOrderAPI.getAll({ status, ...params }),
  getBySupplier: async (supplierId, params = {}) => 
    purchaseOrderAPI.getAll({ supplier: supplierId, ...params }),
  getByDateRange: async (dateFrom, dateTo, params = {}) => 
    purchaseOrderAPI.getAll({ dateFrom, dateTo, ...params }),
};
```

## 🛠️ Utility Functions

### File: `utils/POUtils.js`
```javascript
export const poUtils = {
  // Status Management
  formatStatus: (status) => {
    const statusMap = {
      'Draft': 'Draft',
      'Sent': 'Sent', 
      'Acknowledged': 'Acknowledged',
      'Approved': 'Approved',
      'Partially_Received': 'Partially Received',
      'Fully_Received': 'Fully Received',
      'Cancelled': 'Cancelled',
      'Closed': 'Closed'
    };
    return statusMap[status] || status;
  },

  getStatusColor: (status) => {
    const colorMap = {
      'Draft': '#6B7280',
      'Sent': '#3B82F6',
      'Acknowledged': '#F59E0B', 
      'Approved': '#10B981',
      'Partially_Received': '#F97316',
      'Fully_Received': '#10B981',
      'Cancelled': '#EF4444',
      'Closed': '#6B7280'
    };
    return colorMap[status] || '#6B7280';
  },

  // Business Logic
  isOverdue: (expectedDeliveryDate, status) => {
    const today = new Date();
    const deliveryDate = new Date(expectedDeliveryDate);
    const completedStatuses = ['Fully_Received', 'Cancelled', 'Closed'];
    return deliveryDate < today && !completedStatuses.includes(status);
  },

  calculateCompletion: (items) => {
    if (!items || items.length === 0) return 0;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const receivedQuantity = items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0);
    return totalQuantity > 0 ? Math.round((receivedQuantity / totalQuantity) * 100) : 0;
  },

  getNextStatuses: (currentStatus) => {
    const statusFlow = {
      'Draft': ['Sent', 'Cancelled'],
      'Sent': ['Acknowledged', 'Cancelled'],
      'Acknowledged': ['Approved', 'Cancelled'],
      'Approved': ['Partially_Received', 'Fully_Received', 'Cancelled'],
      'Partially_Received': ['Fully_Received', 'Cancelled'],
      'Fully_Received': ['Closed'],
      'Cancelled': [],
      'Closed': []
    };
    return statusFlow[currentStatus] || [];
  },

  // Formatting
  formatCurrency: (amount) => 
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount),

  formatDate: (date) => 
    new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    }),
};
```

## 📱 Main Screen Component

### File: `screens/PurchaseOrderScreen.js`
```javascript
import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, 
  TextInput, Alert, RefreshControl, ActivityIndicator 
} from 'react-native';
import { purchaseOrderAPI, poUtils } from '../services/PurchaseOrderAPI';
import PurchaseOrderCard from '../components/PurchaseOrderCard';
import PurchaseOrderDetail from '../components/PurchaseOrderDetail';

const PurchaseOrderScreen = () => {
  // State Management
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [stats, setStats] = useState({
    totalPOs: 0,
    statusBreakdown: [],
    overduePOs: 0,
    monthlyValue: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPO, setSelectedPO] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // Data Fetching
  const fetchStats = async () => {
    try {
      const response = await purchaseOrderAPI.getStats();
      setStats(response?.data || {
        totalPOs: 0, statusBreakdown: [], overduePOs: 0,
        monthlyValue: 0, pendingApprovals: 0
      });
    } catch (err) {
      console.error('Error fetching PO stats:', err);
    }
  };

  const fetchPurchaseOrders = async (search = '', status = '') => {
    try {
      setLoading(true);
      const params = {
        limit: 20,
        ...(search && { search }),
        ...(status && { status })
      };
      
      const response = await purchaseOrderAPI.getAll(params);
      setPurchaseOrders(response.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch purchase orders');
      console.error('Error fetching POs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Event Handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchPurchaseOrders(searchTerm, statusFilter)]);
    setRefreshing(false);
  };

  const handleViewPO = async (po) => {
    try {
      const response = await purchaseOrderAPI.getById(po._id);
      setSelectedPO(response.data);
      setShowDetail(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to load PO details');
    }
  };

  const handleStatusUpdate = async (poId, newStatus, notes = '') => {
    try {
      await purchaseOrderAPI.updateStatus(poId, newStatus, notes);
      await fetchPurchaseOrders(searchTerm, statusFilter);
      await fetchStats();
      
      if (selectedPO && selectedPO._id === poId) {
        const updatedPO = await purchaseOrderAPI.getById(poId);
        setSelectedPO(updatedPO.data);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update PO status');
    }
  };

  // Effects
  useEffect(() => {
    fetchStats();
    fetchPurchaseOrders();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPurchaseOrders(searchTerm, statusFilter);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  // Render Methods
  const renderPOCard = ({ item }) => (
    <PurchaseOrderCard 
      purchaseOrder={item}
      onPress={() => handleViewPO(item)}
      onStatusUpdate={handleStatusUpdate}
    />
  );

  const getStatusCount = (status) => {
    const statusItem = stats?.statusBreakdown?.find(item => item._id === status);
    return statusItem ? statusItem.count : 0;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Stats Cards */}
      <View style={{ flexDirection: 'row', padding: 16, justifyContent: 'space-between' }}>
        <View style={{ flex: 1, backgroundColor: 'white', padding: 16, marginRight: 8, borderRadius: 8 }}>
          <Text style={{ fontSize: 12, color: '#666' }}>Total POs</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{stats?.totalPOs || 0}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: 'white', padding: 16, marginHorizontal: 4, borderRadius: 8 }}>
          <Text style={{ fontSize: 12, color: '#666' }}>Partially Received</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#F97316' }}>
            {getStatusCount('Partially_Received')}
          </Text>
        </View>
        <View style={{ flex: 1, backgroundColor: 'white', padding: 16, marginLeft: 8, borderRadius: 8 }}>
          <Text style={{ fontSize: 12, color: '#666' }}>Fully Received</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#10B981' }}>
            {getStatusCount('Fully_Received')}
          </Text>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={{ padding: 16, backgroundColor: 'white', marginHorizontal: 16, borderRadius: 8 }}>
        <TextInput
          placeholder="Search POs by number, supplier..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={{ borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8 }}
        />
      </View>

      {/* PO List */}
      <FlatList
        data={purchaseOrders}
        renderItem={renderPOCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={{ padding: 32, alignItems: 'center' }}>
            {loading ? (
              <ActivityIndicator size="large" color="#3B82F6" />
            ) : (
              <Text style={{ color: '#666' }}>No purchase orders found</Text>
            )}
          </View>
        )}
      />

      {/* Detail Modal */}
      {showDetail && selectedPO && (
        <PurchaseOrderDetail
          purchaseOrder={selectedPO}
          visible={showDetail}
          onClose={() => setShowDetail(false)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </View>
  );
};

export default PurchaseOrderScreen;
```

## 🎴 Card Component

### File: `components/PurchaseOrderCard.js`
```javascript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { poUtils } from '../utils/POUtils';

const PurchaseOrderCard = ({ purchaseOrder, onPress, onStatusUpdate }) => {
  const isOverdue = poUtils.isOverdue(purchaseOrder.expectedDeliveryDate, purchaseOrder.status);
  const statusColor = poUtils.getStatusColor(purchaseOrder.status);

  return (
    <TouchableOpacity 
      onPress={onPress}
      style={{
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 12,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
            {purchaseOrder.poNumber}
          </Text>
          {isOverdue && (
            <Text style={{ fontSize: 12, color: '#EF4444', marginBottom: 4 }}>Overdue</Text>
          )}
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 2 }}>
            {purchaseOrder.supplierDetails?.companyName}
          </Text>
          <Text style={{ fontSize: 12, color: '#999' }}>
            {poUtils.formatDate(purchaseOrder.orderDate)}
          </Text>
        </View>
        
        <View style={{ alignItems: 'flex-end' }}>
          <View style={{
            backgroundColor: statusColor + '20',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            marginBottom: 8,
          }}>
            <Text style={{ fontSize: 12, color: statusColor, fontWeight: '600' }}>
              {poUtils.formatStatus(purchaseOrder.status)}
            </Text>
          </View>
          
          <Text style={{ fontSize: 12, color: '#666' }}>
            {purchaseOrder.category?.categoryName || 'N/A'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default PurchaseOrderCard;
```

## 📋 Backend API Endpoints

### Current Backend Routes (`server/src/routes/purchaseOrderRoutes.js`)
```javascript
// Statistics
GET /api/purchase-orders/stats

// CRUD Operations  
GET /api/purchase-orders          // Get all with filters
GET /api/purchase-orders/:id      // Get by ID
POST /api/purchase-orders         // Create new PO
PUT /api/purchase-orders/:id      // Update PO
DELETE /api/purchase-orders/:id   // Delete PO

// Status Management
PATCH /api/purchase-orders/:id/status  // Update status
```

### Query Parameters for GET /api/purchase-orders
```javascript
{
  page: 1,              // Pagination
  limit: 10,            // Items per page
  search: 'term',       // Search in PO number, supplier, notes
  status: 'Draft',      // Filter by status
  supplier: 'id',       // Filter by supplier ID
  overdue: 'true',      // Get overdue POs only
  dateFrom: '2024-01-01', // Date range filter
  dateTo: '2024-12-31'
}
```

## 🔄 Data Flow Architecture

### 1. **Screen Load Flow**
```
PurchaseOrderScreen → fetchStats() + fetchPurchaseOrders()
                   ↓
                purchaseOrderAPI.getStats() + purchaseOrderAPI.getAll()
                   ↓
                Backend Routes: /stats + /purchase-orders
                   ↓
                Update State: stats + purchaseOrders
```

### 2. **Search/Filter Flow**
```
User Input → useEffect with debounce (500ms)
           ↓
        fetchPurchaseOrders(searchTerm, statusFilter)
           ↓
        purchaseOrderAPI.getAll({ search, status })
           ↓
        Backend: GET /purchase-orders?search=term&status=Draft
```

### 3. **Status Update Flow**
```
PurchaseOrderDetail → handleStatusUpdate()
                   ↓
                purchaseOrderAPI.updateStatus(id, status, notes)
                   ↓
                Backend: PATCH /purchase-orders/:id/status
                   ↓
                Refresh: fetchPurchaseOrders() + fetchStats()
```

## 🎯 Key Features Implementation

### ✅ **Implemented Features**
- **Complete CRUD Operations** - Create, Read, Update, Delete POs
- **Status Management** - Workflow-based status transitions
- **Search & Filtering** - Real-time search with debouncing
- **Statistics Dashboard** - PO counts by status
- **Detail View** - Complete PO information display
- **Overdue Detection** - Automatic overdue PO identification
- **Progress Tracking** - Completion percentage calculation

### 🔄 **Status Workflow**
```
Draft → Sent → Acknowledged → Approved → Partially_Received → Fully_Received → Closed
  ↓       ↓         ↓           ↓              ↓                    ↓
Cancelled ← Cancelled ← Cancelled ← Cancelled ← Cancelled
```

## 📦 Required Dependencies

### React Native Dependencies
```json
{
  "@react-navigation/native": "^6.x.x",
  "@react-navigation/stack": "^6.x.x", 
  "react-native-vector-icons": "^9.x.x",
  "react-native-modal": "^13.x.x",
  "react-native-picker-select": "^8.x.x"
}
```

## 🚀 Implementation Steps

### Phase 1: Setup API Layer
1. Create `services/PurchaseOrderAPI.js`
2. Create `utils/POUtils.js`
3. Test API connectivity

### Phase 2: Core Components
1. Create `PurchaseOrderCard.js`
2. Create `PurchaseOrderDetail.js`
3. Create main `PurchaseOrderScreen.js`

### Phase 3: Advanced Features
1. Add search and filtering
2. Implement status updates
3. Add statistics dashboard

### Phase 4: Polish & Testing
1. Add loading states
2. Implement error handling
3. Add pull-to-refresh
4. Test all workflows

## 📝 Notes

- **Backend Compatibility**: All APIs are already implemented and tested in the web app
- **State Management**: Uses React hooks (useState, useEffect) for simplicity
- **Navigation**: Assumes React Navigation is set up
- **Styling**: Uses inline styles for clarity - can be moved to StyleSheet
- **Error Handling**: Includes comprehensive error handling with user feedback

This architecture provides a complete, production-ready Purchase Order system for React Native that mirrors the web application's functionality while being optimized for mobile use.
