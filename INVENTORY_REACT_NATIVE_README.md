# 📦 Inventory Management System - React Native Implementation Guide

## Overview

This guide provides a complete implementation roadmap for converting the YarnFlow Inventory Management System from React Web to React Native. The system is built on a GRN-based (Goods Receipt Note) inventory tracking architecture with real-time stock management, multi-warehouse support, and comprehensive movement history.

---

## 🎯 Core Features

### 1. **Inventory Dashboard**
- Real-time inventory statistics
- Category-based product grouping
- Search and filter functionality
- Pagination support
- Stock movement tracking (In/Out)

### 2. **Product Detail View**
- Comprehensive product information
- Stock summary cards
- Supplier information
- Lot-wise inventory tracking
- Movement history timeline

### 3. **Key Capabilities**
- ✅ GRN-based inventory (single source of truth)
- ✅ Multi-warehouse support
- ✅ Real-time stock tracking
- ✅ Category-wise organization
- ✅ Search with debouncing
- ✅ Lot/GRN movement history
- ✅ Stock In/Out visualization

---

## 📁 Project Structure

```
/src
  /screens
    ├── InventoryScreen.js          # Main inventory list screen
    └── ProductDetailScreen.js      # Product detail screen
  
  /components
    /inventory
      ├── InventoryCard.js          # Product card component
      ├── StatsCard.js              # Statistics card component
      ├── CategorySection.js        # Collapsible category section
      ├── LotCard.js                # Individual lot/GRN card
      ├── MovementHistoryItem.js    # Movement history item
      └── SearchBar.js              # Search input with debounce
  
  /services
    └── inventoryAPI.js             # API service layer
  
  /utils
    ├── inventoryUtils.js           # Utility functions
    └── formatters.js               # Data formatting helpers
  
  /constants
    ├── warehouseLocations.js       # Warehouse definitions
    └── colors.js                   # Theme colors
```

---

## 🔧 Dependencies

### Required Packages

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-native": "^0.72.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/native-stack": "^6.9.0",
    "react-native-screens": "^3.25.0",
    "react-native-safe-area-context": "^4.7.0",
    "axios": "^1.5.0",
    "react-native-vector-icons": "^10.0.0",
    "react-native-gesture-handler": "^2.13.0",
    "react-native-reanimated": "^3.5.0"
  }
}
```

### Installation Commands

```bash
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
npm install axios
npm install react-native-vector-icons
npm install react-native-gesture-handler react-native-reanimated

# For iOS
cd ios && pod install && cd ..
```

---

## 🎨 UI Design Guidelines

### Color Palette

```javascript
// colors.js
export const COLORS = {
  // Primary
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  
  // Status Colors
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  
  // Neutral
  gray900: '#111827',
  gray700: '#374151',
  gray600: '#6B7280',
  gray500: '#9CA3AF',
  gray300: '#D1D5DB',
  gray200: '#E5E7EB',
  gray100: '#F3F4F6',
  gray50: '#F9FAFB',
  
  // Background
  background: '#F3F4F6',
  white: '#FFFFFF',
};
```

### Typography

```javascript
// Typography scale
const TYPOGRAPHY = {
  h1: { fontSize: 24, fontWeight: 'bold' },
  h2: { fontSize: 20, fontWeight: '600' },
  h3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 14, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
  small: { fontSize: 10, fontWeight: '400' },
};
```

---

## 📱 Screen Implementations

### 1. Navigation Setup

```javascript
// App.js or Navigation.js
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InventoryScreen from './screens/InventoryScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2563EB',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Inventory" 
          component={InventoryScreen}
          options={{ title: 'Inventory Management' }}
        />
        <Stack.Screen 
          name="ProductDetail" 
          component={ProductDetailScreen}
          options={{ title: 'Product Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
```

---

## 🔌 API Service Layer

### inventoryAPI.js

```javascript
import axios from 'axios';

const API_BASE_URL = 'https://your-api-url.com/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Add auth token from AsyncStorage
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const inventoryAPI = {
  // Get all inventory with filters
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const response = await apiClient.get(
        `/inventory${queryString ? `?${queryString}` : ''}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  },

  // Search inventory
  search: async (searchTerm, filters = {}) => {
    const params = { search: searchTerm, ...filters };
    return inventoryAPI.getAll(params);
  },

  // Get by category
  getByCategory: async (categoryId, params = {}) => {
    return inventoryAPI.getAll({ category: categoryId, ...params });
  },
};

export default inventoryAPI;
```

---

## 🛠️ Utility Functions

### inventoryUtils.js

```javascript
// Format currency (Indian Rupees)
export const formatCurrency = (amount) => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toFixed(0)}`;
};

// Format quantity with unit
export const formatQuantity = (quantity, unit) => {
  if (quantity >= 1000) {
    return `${(quantity / 1000).toFixed(1)}K ${unit}`;
  }
  return `${quantity} ${unit}`;
};

// Format date
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Format relative time
export const formatRelativeTime = (date) => {
  if (!date) return '-';
  
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return formatDate(date);
};

// Get status color
export const getStatusColor = (status) => {
  const colorMap = {
    'Active': '#16A34A',
    'Reserved': '#F59E0B',
    'Consumed': '#6B7280',
    'Expired': '#DC2626',
    'Damaged': '#DC2626',
    'Returned': '#2563EB'
  };
  return colorMap[status] || '#6B7280';
};

// Calculate stock percentage
export const calculateStockPercentage = (current, received) => {
  if (!received || received === 0) return 0;
  return Math.round((current / received) * 100);
};
```

---

## 📊 Component Examples

### StatsCard Component

```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const StatsCard = ({ icon, label, value, subtitle, color }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.value, { color }]}>{value}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <Icon name={icon} size={40} color={color} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    color: '#9CA3AF',
  },
});

export default StatsCard;
```

### InventoryCard Component

```javascript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const InventoryCard = ({ product, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.productName}>{product.productName}</Text>
        <Icon name="chevron-right" size={20} color="#9CA3AF" />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Current</Text>
          <Text style={[styles.statValue, styles.green]}>
            {product.currentStock} {product.unit}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Stock In</Text>
          <Text style={[styles.statValue, styles.blue]}>
            +{product.receivedStock}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Stock Out</Text>
          <Text style={[styles.statValue, styles.red]}>
            -{product.issuedStock || 0}
          </Text>
        </View>
      </View>

      {product.currentWeight && (
        <View style={styles.weightRow}>
          <Icon name="weight-kilogram" size={14} color="#6B7280" />
          <Text style={styles.weightText}>
            {product.currentWeight.toFixed(2)} Kg
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  green: { color: '#16A34A' },
  blue: { color: '#2563EB' },
  red: { color: '#DC2626' },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  weightText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default InventoryCard;
```

---

## 🚀 Implementation Steps

### Phase 1: Setup (Day 1)
1. ✅ Install dependencies
2. ✅ Setup navigation structure
3. ✅ Create folder structure
4. ✅ Setup API service layer
5. ✅ Create constants and utilities

### Phase 2: Core Components (Day 2-3)
1. ✅ Build StatsCard component
2. ✅ Build InventoryCard component
3. ✅ Build CategorySection component
4. ✅ Build SearchBar component
5. ✅ Build LotCard component

### Phase 3: Screens (Day 4-5)
1. ✅ Implement InventoryScreen
2. ✅ Implement ProductDetailScreen
3. ✅ Add search and filter functionality
4. ✅ Add pagination
5. ✅ Add pull-to-refresh

### Phase 4: Polish (Day 6)
1. ✅ Add loading states
2. ✅ Add error handling
3. ✅ Add empty states
4. ✅ Optimize performance
5. ✅ Test on both iOS and Android

---

## 🎯 Key Features Mapping

### From Web to React Native

| Web Feature | React Native Equivalent |
|------------|------------------------|
| `<div>` | `<View>` |
| `<span>`, `<p>` | `<Text>` |
| `<button>` | `<TouchableOpacity>` |
| `<input>` | `<TextInput>` |
| CSS classes | StyleSheet |
| onClick | onPress |
| Hover effects | activeOpacity |
| Scrolling | ScrollView / FlatList |
| Icons (emoji) | react-native-vector-icons |

---

## 📝 API Response Structure

### Inventory List Response

```json
{
  "success": true,
  "data": [
    {
      "categoryId": "cat123",
      "categoryName": "Raw Materials",
      "products": [
        {
          "productId": "prod456",
          "productName": "Cotton Yarn 20s",
          "currentStock": 1500,
          "receivedStock": 2000,
          "issuedStock": 500,
          "unit": "Kg",
          "currentWeight": 1500.50,
          "totalWeight": 2000.00,
          "receivedWeight": 2000.00,
          "issuedWeight": 499.50,
          "lotCount": 5,
          "suppliers": ["Supplier A", "Supplier B"]
        }
      ]
    }
  ],
  "pagination": {
    "total": 10,
    "totalProducts": 150,
    "page": 1,
    "pages": 5,
    "limit": 20
  }
}
```

### Product Detail Response

```json
{
  "productId": "prod456",
  "productName": "Cotton Yarn 20s",
  "currentStock": 1500,
  "receivedStock": 2000,
  "issuedStock": 500,
  "unit": "Kg",
  "lots": [
    {
      "lotNumber": "LOT-2024-001",
      "grnNumber": "GRN-2024-001",
      "status": "Active",
      "supplierName": "Supplier A",
      "warehouse": "WH-001",
      "receivedQuantity": 500,
      "currentQuantity": 300,
      "issuedQuantity": 200,
      "receivedDate": "2024-01-15",
      "movements": [
        {
          "type": "Received",
          "quantity": 500,
          "reference": "GRN-2024-001",
          "notes": "Initial receipt",
          "date": "2024-01-15"
        },
        {
          "type": "Issued",
          "quantity": 200,
          "reference": "CHALLAN-2024-001",
          "notes": "Issued to production",
          "date": "2024-01-20"
        }
      ]
    }
  ]
}
```

---

## 🔍 Search & Filter Implementation

### Debounced Search Hook

```javascript
import { useState, useEffect } from 'react';

export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Usage in component
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 500);

useEffect(() => {
  if (debouncedSearch) {
    fetchInventory({ search: debouncedSearch });
  }
}, [debouncedSearch]);
```

---

## 🎨 UI/UX Best Practices

### 1. **Loading States**
- Show skeleton loaders for better UX
- Use ActivityIndicator for async operations
- Implement pull-to-refresh

### 2. **Error Handling**
- Display user-friendly error messages
- Provide retry options
- Log errors for debugging

### 3. **Performance**
- Use FlatList for large lists
- Implement pagination
- Optimize images and icons
- Use memo for expensive components

### 4. **Accessibility**
- Add accessible labels
- Support screen readers
- Ensure proper color contrast
- Make touch targets at least 44x44

---

## 📱 Platform-Specific Considerations

### iOS
- Use SafeAreaView for notch support
- Follow iOS Human Interface Guidelines
- Test on multiple iPhone sizes

### Android
- Handle back button navigation
- Follow Material Design guidelines
- Test on various Android versions
- Handle different screen densities

---

## 🧪 Testing Checklist

- [ ] Search functionality works correctly
- [ ] Category filter applies properly
- [ ] Pagination navigates correctly
- [ ] Product details load completely
- [ ] Movement history displays accurately
- [ ] Pull-to-refresh updates data
- [ ] Loading states show appropriately
- [ ] Error messages display correctly
- [ ] Works on iOS and Android
- [ ] Handles network errors gracefully

---

## 📚 Additional Resources

- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Vector Icons](https://github.com/oblador/react-native-vector-icons)
- [Axios Documentation](https://axios-http.com/)

---

## 🤝 Support

For questions or issues, please contact the development team or refer to the project documentation.

---

**Version:** 1.0.0  
**Last Updated:** November 2024  
**Maintained by:** YarnFlow Development Team
