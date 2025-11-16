# React Native GRN Architecture Guide

## 🏗️ System Architecture

### Component Hierarchy
```
GRNScreen (Main)
├── GRNStatsCards
├── GRNSearchFilter
├── GRNGroupedList
│   ├── POGroupHeader
│   └── GRNCard[]
├── GRNForm (Modal)
│   ├── POSelector
│   ├── ItemReceiptTable
│   └── QualityControlInputs
└── GRNDetail (Modal)
    ├── GRNBasicInfo
    ├── GRNItemsList
    ├── GRNStatusManager
    └── GRNFinancialSummary
```

## 🔄 Data Flow Architecture

### 1. **Screen Load Flow**
```
GRNScreen → fetchStats() + fetchGRNs()
         ↓
      grnAPI.getStats() + grnAPI.getAll()
         ↓
      Backend: /grn/stats + /grn
         ↓
      Update State: stats + grns + groupedByPO
```

### 2. **Create GRN Flow**
```
Create Button → GRNForm
             ↓
          Load POs → purchaseOrderAPI.getAll()
             ↓
          Select PO → Populate Items
             ↓
          Fill Form → Validate → Submit
             ↓
          grnAPI.create() → Refresh List
```

### 3. **Status Update Flow**
```
GRNDetail → Status Button → StatusModal
         ↓
      Select Status → Add Notes → Confirm
         ↓
      grnAPI.updateStatus() → Refresh Data
```

## 📊 State Management

### Global State Structure
```javascript
// Main Screen State
const grnScreenState = {
  grns: [],                    // All GRNs
  groupedByPO: [],            // GRNs grouped by PO
  stats: {
    totalGRNs: 0,
    pendingReview: 0,
    completed: 0,
    thisMonth: 0
  },
  loading: false,
  error: null,
  searchTerm: '',
  statusFilter: '',
  selectedGRN: null
};

// Form State
const grnFormState = {
  formData: {
    purchaseOrder: '',
    receiptDate: '',
    warehouseLocation: '',
    generalNotes: '',
    items: []
  },
  purchaseOrders: [],         // Available POs
  selectedPO: null,           // Selected PO details
  errors: {},                 // Validation errors
  loading: false
};
```

### State Update Patterns
```javascript
// Optimistic Updates
const handleStatusUpdate = async (grnId, newStatus) => {
  // Optimistically update UI
  setGRNs(prev => prev.map(grn => 
    grn._id === grnId ? { ...grn, status: newStatus } : grn
  ));
  
  try {
    await grnAPI.updateStatus(grnId, newStatus);
    // Success - UI already updated
  } catch (error) {
    // Revert on error
    await fetchGRNs();
    Alert.alert('Error', 'Failed to update status');
  }
};
```

## 🎯 Key Business Logic

### 1. **Item Receipt Calculation**
```javascript
const calculateItemReceipt = (item) => {
  const orderedQty = item.orderedQuantity || 0;
  const previouslyReceived = item.previouslyReceived || 0;
  const receivedNow = item.receivedQuantity || 0;
  
  return {
    ...item,
    pendingQuantity: orderedQty - previouslyReceived - receivedNow,
    totalReceived: previouslyReceived + receivedNow,
    completionPercentage: orderedQty > 0 ? 
      Math.round(((previouslyReceived + receivedNow) / orderedQty) * 100) : 0
  };
};
```

### 2. **Quality Control Logic**
```javascript
const validateQualityControl = (item) => {
  const receivedQty = item.receivedQuantity || 0;
  const acceptedQty = item.acceptedQuantity || 0;
  const rejectedQty = item.rejectedQuantity || 0;
  const damageQty = item.damageQuantity || 0;
  
  // Validation rules
  const totalProcessed = acceptedQty + rejectedQty + damageQty;
  
  return {
    isValid: totalProcessed <= receivedQty,
    error: totalProcessed > receivedQty ? 
      'Total processed cannot exceed received quantity' : null,
    remainingQty: receivedQty - totalProcessed
  };
};
```

### 3. **Status Workflow Validation**
```javascript
const canUpdateStatus = (currentStatus, newStatus, userRole) => {
  const allowedTransitions = {
    'Draft': ['Received'],
    'Received': ['Under_Review', 'Approved'],
    'Under_Review': ['Approved', 'Rejected'],
    'Approved': ['Completed'],
    'Rejected': ['Under_Review']
  };
  
  const rolePermissions = {
    'warehouse_staff': ['Draft', 'Received'],
    'quality_inspector': ['Under_Review', 'Approved', 'Rejected'],
    'manager': ['Approved', 'Completed']
  };
  
  return allowedTransitions[currentStatus]?.includes(newStatus) &&
         rolePermissions[userRole]?.includes(newStatus);
};
```

## 📱 Mobile-Specific Patterns

### 1. **Offline Support**
```javascript
// Cache GRN data for offline access
const cacheGRNData = async (grns) => {
  try {
    await AsyncStorage.setItem('cached_grns', JSON.stringify(grns));
  } catch (error) {
    console.error('Failed to cache GRN data:', error);
  }
};

// Load cached data when offline
const loadCachedGRNs = async () => {
  try {
    const cached = await AsyncStorage.getItem('cached_grns');
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Failed to load cached GRNs:', error);
    return [];
  }
};
```

### 2. **Touch Optimizations**
```javascript
// Swipe actions for GRN cards
const SwipeableGRNCard = ({ grn, onStatusUpdate, onDelete }) => (
  <Swipeable
    renderRightActions={() => (
      <View style={styles.swipeActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => onStatusUpdate(grn._id, 'Approved')}
        >
          <Text>Approve</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(grn._id)}
        >
          <Text>Delete</Text>
        </TouchableOpacity>
      </View>
    )}
  >
    <GRNCard grn={grn} />
  </Swipeable>
);
```

### 3. **Performance Optimizations**
```javascript
// Virtualized list for large datasets
import { VirtualizedList } from 'react-native';

const OptimizedGRNList = ({ grns }) => (
  <VirtualizedList
    data={grns}
    initialNumToRender={10}
    renderItem={({ item }) => <GRNCard grn={item} />}
    keyExtractor={(item) => item._id}
    getItemCount={(data) => data.length}
    getItem={(data, index) => data[index]}
    windowSize={5}
    removeClippedSubviews={true}
  />
);
```

## 🔐 Security & Validation

### Form Validation Rules
```javascript
const validateGRNForm = (formData) => {
  const errors = {};
  
  // Required fields
  if (!formData.purchaseOrder) {
    errors.purchaseOrder = 'Purchase Order is required';
  }
  
  if (!formData.receiptDate) {
    errors.receiptDate = 'Receipt date is required';
  }
  
  if (!formData.warehouseLocation) {
    errors.warehouseLocation = 'Warehouse location is required';
  }
  
  // Item validations
  const hasValidItems = formData.items.some(item => 
    item.receivedQuantity > 0 || item.markAsComplete
  );
  
  if (!hasValidItems) {
    errors.items = 'At least one item must have received quantity';
  }
  
  // Quantity validations
  formData.items.forEach((item, index) => {
    const maxAllowed = item.orderedQuantity - item.previouslyReceived;
    if (item.receivedQuantity > maxAllowed) {
      errors[`items.${index}.receivedQuantity`] = 
        `Cannot exceed pending quantity (${maxAllowed})`;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

## 🚀 Implementation Steps

### Phase 1: Core Setup
1. Create API service layer
2. Set up basic screen structure
3. Implement GRN listing

### Phase 2: Form Implementation
1. Create GRN form component
2. Implement PO selection
3. Add item receipt tracking

### Phase 3: Detail & Status
1. Create detail view
2. Implement status management
3. Add quality control features

### Phase 4: Advanced Features
1. Add offline support
2. Implement file attachments
3. Add barcode scanning
4. Performance optimizations

## 📊 Performance Metrics

### Target Performance
- **Screen Load Time**: < 2 seconds
- **Form Submission**: < 3 seconds
- **Search Response**: < 500ms
- **Memory Usage**: < 100MB
- **Battery Impact**: Minimal

### Monitoring Points
- API response times
- Component render times
- Memory usage patterns
- Network request efficiency
- User interaction responsiveness
