# React Native GRN Components Guide

## 📱 Main Screen Component

### File: `screens/GRNScreen.js`

#### Key Features:
- **Statistics Cards** - Total GRNs, pending reviews, completed
- **Search & Filter** - Real-time search with status filtering
- **Grouped Display** - GRNs grouped by Purchase Orders
- **Pull-to-Refresh** - Data synchronization

#### Core State Management:
```javascript
const [grns, setGRNs] = useState([]);
const [groupedByPO, setGroupedByPO] = useState([]);
const [stats, setStats] = useState({
  totalGRNs: 0,
  partial: 0,
  completed: 0
});
const [searchTerm, setSearchTerm] = useState('');
const [statusFilter, setStatusFilter] = useState(''); // 'Draft', 'Partial', 'Complete'
```

#### Key Functions:
```javascript
// Data fetching
const fetchGRNs = async () => {
  const response = await grnAPI.getAll({ search: searchTerm, status: statusFilter });
  setGRNs(response.data);
  groupGRNsByPO(response.data);
};

// Group GRNs by Purchase Order
const groupGRNsByPO = (grnList) => {
  const grouped = grnList.reduce((acc, grn) => {
    const poKey = grn.purchaseOrder._id;
    if (!acc[poKey]) acc[poKey] = [];
    acc[poKey].push(grn);
    return acc;
  }, {});
  setGroupedByPO(Object.values(grouped));
};
```

## 📝 Form Component

### File: `components/GRNForm.js`

#### Key Features:
- **PO Selection** - Dropdown with incomplete Purchase Orders
- **Dynamic Item List** - Items from selected PO with receipt tracking
- **Quantity Management** - Ordered vs Received vs Pending
- **Warehouse Selection** - From predefined warehouse locations
- **Manual Completion** - Mark items as complete even if quantity doesn't match
- **Validation** - Form validation with error handling
- **No Edit Mode** - Create-only functionality (matches current implementation)

#### Form Structure:
```javascript
const [formData, setFormData] = useState({
  purchaseOrder: '',
  receiptDate: new Date().toISOString().split('T')[0],
  warehouseLocation: '',
  generalNotes: '',
  items: []
});
```

#### Key Form Functions:
```javascript
// Handle PO selection and populate items
const handlePOSelection = async (poId) => {
  const response = await purchaseOrderAPI.getById(poId);
  const po = response.data;
  
  const items = po.items.map(item => ({
    purchaseOrderItem: item._id,
    productName: item.productName,
    productCode: item.productCode,
    orderedQuantity: item.quantity,
    orderedWeight: item.specifications?.weight || 0,
    receivedQuantity: 0,
    receivedWeight: 0,
    previouslyReceived: item.receivedQuantity || 0,
    previousWeight: item.receivedWeight || 0,
    pendingQuantity: item.quantity - (item.receivedQuantity || 0),
    pendingWeight: (item.specifications?.weight || 0) - (item.receivedWeight || 0),
    unit: item.unit,
    manuallyCompleted: false
  }));
  
  setFormData(prev => ({ ...prev, purchaseOrder: poId, items }));
};

// Handle item quantity changes
const handleItemChange = (index, field, value) => {
  const updatedItems = [...formData.items];
  updatedItems[index][field] = value;
  
  // Auto-calculate pending quantity
  if (field === 'receivedQuantity') {
    updatedItems[index].pendingQuantity = 
      updatedItems[index].orderedQuantity - 
      updatedItems[index].previouslyReceived - 
      value;
  }
  
  setFormData(prev => ({ ...prev, items: updatedItems }));
};
```

## 📋 Detail Component

### File: `components/GRNDetail.js`

#### Key Features:
- **Complete GRN Information** - All receipt details
- **Simple Status Display** - Current status (Draft/Partial/Complete)
- **Receipt Summary** - Ordered vs Received quantities
- **Warehouse Information** - Storage location details
- **Action Buttons** - Print GRN, Close (no edit functionality)

#### Core Display Sections:
```javascript
// GRN Information
<View style={styles.section}>
  <Text style={styles.sectionTitle}>GRN Information</Text>
  <Text>GRN Number: {grn.grnNumber}</Text>
  <Text>PO Reference: {grn.poNumber}</Text>
  <Text>Receipt Date: {formatDate(grn.receiptDate)}</Text>
  <StatusBadge status={grn.status} />
</View>

// Supplier Information
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Supplier Information</Text>
  <Text>Company Name: {grn.supplierDetails.companyName}</Text>
</View>

// Items Received
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Items Received</Text>
  {grn.items.map((item, index) => (
    <ItemReceiptCard key={index} item={item} />
  ))}
</View>

// Warehouse Information
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Warehouse Information</Text>
  <Text>Location: {getWarehouseName(grn.warehouseLocation)}</Text>
</View>

// Additional Information
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Additional Information</Text>
  <Text>General Notes: {grn.generalNotes}</Text>
</View>
```

## 🎴 Card Component

### File: `components/GRNCard.js`

#### Key Features:
- **Compact Display** - Essential GRN information
- **Status Indicator** - Visual status representation
- **Progress Bar** - Completion percentage
- **Quick Actions** - Swipe actions for common tasks

#### Card Structure:
```javascript
const GRNCard = ({ grn, onPress, onStatusUpdate }) => {
  const completionPercentage = grnUtils.calculateCompletion(grn.items);
  const statusColor = grnUtils.getStatusColor(grn.status);
  
  return (
    <TouchableOpacity onPress={onPress}>
      {/* GRN Number & Status */}
      <View style={styles.header}>
        <Text style={styles.grnNumber}>{grn.grnNumber}</Text>
        <StatusBadge status={grn.status} color={statusColor} />
      </View>
      
      {/* PO Information */}
      <Text style={styles.poNumber}>PO: {grn.poNumber}</Text>
      <Text style={styles.supplier}>{grn.supplierDetails.companyName}</Text>
      
      {/* Progress Bar */}
      <ProgressBar percentage={completionPercentage} />
      
      {/* Receipt Date */}
      <Text style={styles.date}>
        {grnUtils.formatDate(grn.receiptDate)}
      </Text>
    </TouchableOpacity>
  );
};
```

## 🎯 Key UI Patterns

### 1. **Item Receipt Table**
```javascript
// Mobile-optimized table for item receipt tracking
<ScrollView horizontal>
  <View style={styles.table}>
    {/* Headers */}
    <View style={styles.tableHeader}>
      <Text>Product</Text>
      <Text>Ordered</Text>
      <Text>Received</Text>
      <Text>Pending</Text>
      <Text>Status</Text>
    </View>
    
    {/* Rows */}
    {items.map((item, index) => (
      <ItemRow 
        key={index}
        item={item}
        onQuantityChange={(field, value) => 
          handleItemChange(index, field, value)
        }
      />
    ))}
  </View>
</ScrollView>
```

### 2. **Status Update Modal**
```javascript
const StatusUpdateModal = ({ visible, currentStatus, onUpdate, onClose }) => (
  <Modal visible={visible} animationType="slide">
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Update GRN Status</Text>
      
      <Picker
        selectedValue={newStatus}
        onValueChange={setNewStatus}
      >
        {grnUtils.getNextStatuses(currentStatus).map(status => (
          <Picker.Item key={status} label={status} value={status} />
        ))}
      </Picker>
      
      <TextInput
        placeholder="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
      />
      
      <View style={styles.modalActions}>
        <Button title="Cancel" onPress={onClose} />
        <Button title="Update" onPress={() => onUpdate(newStatus, notes)} />
      </View>
    </View>
  </Modal>
);
```

### 3. **Quality Control Interface**
```javascript
const QualityControlSection = ({ item, onQualityUpdate }) => (
  <View style={styles.qualitySection}>
    <Text style={styles.sectionTitle}>Quality Control</Text>
    
    <View style={styles.quantityInputs}>
      <TextInput
        placeholder="Accepted Qty"
        value={item.acceptedQuantity?.toString()}
        onChangeText={(value) => 
          onQualityUpdate('acceptedQuantity', parseInt(value) || 0)
        }
        keyboardType="numeric"
      />
      
      <TextInput
        placeholder="Rejected Qty"
        value={item.rejectedQuantity?.toString()}
        onChangeText={(value) => 
          onQualityUpdate('rejectedQuantity', parseInt(value) || 0)
        }
        keyboardType="numeric"
      />
    </View>
    
    <TextInput
      placeholder="Quality notes..."
      value={item.qualityNotes}
      onChangeText={(value) => onQualityUpdate('qualityNotes', value)}
      multiline
    />
  </View>
);
```

## 🔄 Component Integration Flow

### 1. **Screen → Form → API**
```
GRNScreen → Create Button → GRNForm → Submit → grnAPI.create()
```

### 2. **Card → Detail → Actions**
```
GRNCard → Tap → GRNDetail → Status Update → grnAPI.updateStatus()
```

### 3. **Form → Validation → Submission**
```
GRNForm → Validate → Transform Data → API Call → Success/Error Handling
```
