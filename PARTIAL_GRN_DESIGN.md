# Partial GRN System - Design Document

**Date:** October 28, 2025  
**Feature:** Partial Goods Receipt with Status Tracking  
**Status:** Design Phase

---

## 📋 Business Requirement

### **Scenario:**

**Purchase Order (PO):**
- Product: Yarn
- Ordered: 100 Bags
- Total Weight: 5000 kg

**GRN Process:**
1. **First Delivery (GRN-1):**
   - Received: 50 Bags = 2500 kg
   - Status: **Pending** (partial receipt)
   - PO Status: **Partially Received**

2. **Second Delivery (GRN-2):**
   - Received: 50 Bags = 2500 kg
   - Status: **Completed** (full receipt)
   - PO Status: **Completed**

---

## 🎯 Key Features

### **1. Partial Receipt Tracking**
- Track multiple GRNs against single PO
- Show received vs pending quantities
- Calculate completion percentage

### **2. Status Management**
- **PO Status:**
  - `Pending` - No items received
  - `Partially Received` - Some items received
  - `Completed` - All items received
  
- **GRN Status:**
  - `Partial` - Not all items received
  - `Complete` - All items received

### **3. Visual Indicators**
- Progress bars showing completion %
- Color-coded status badges
- Pending quantity alerts

---

## 🏗️ Database Schema Changes

### **PurchaseOrder Model:**

```javascript
{
  poNumber: "PKRK/PO/25-26/012",
  supplier: ObjectId,
  items: [
    {
      product: ObjectId,
      productName: "Yarn",
      productCode: "PROD0005",
      
      // Ordered quantities
      quantity: 100,              // Ordered: 100 Bags
      unit: "Bags",
      specifications: {
        weight: 5000              // Total: 5000 kg
      },
      
      // Received quantities (NEW)
      receivedQuantity: 50,       // Received so far: 50 Bags
      receivedWeight: 2500,       // Received weight: 2500 kg
      pendingQuantity: 50,        // Pending: 50 Bags
      pendingWeight: 2500,        // Pending weight: 2500 kg
      
      // Status (NEW)
      receiptStatus: "Partial"    // Partial | Complete
    }
  ],
  
  // Overall PO status (NEW)
  status: "Partially Received",   // Pending | Partially Received | Completed
  
  // Tracking (NEW)
  totalGRNs: 1,                   // Number of GRNs created
  completionPercentage: 50        // 50% received
}
```

---

### **GoodsReceiptNote Model:**

```javascript
{
  grnNumber: "GRN/25-26/001",
  purchaseOrder: ObjectId,
  receiptDate: Date,
  
  items: [
    {
      purchaseOrderItem: ObjectId,
      productName: "Yarn",
      productCode: "PROD0005",
      
      // What was ordered
      orderedQuantity: 100,       // Total ordered
      orderedWeight: 5000,        // Total weight
      
      // Previously received (NEW)
      previouslyReceived: 0,      // From previous GRNs
      previousWeight: 0,
      
      // Receiving now
      receivedQuantity: 50,       // This GRN: 50 Bags
      receivedWeight: 2500,       // This GRN: 2500 kg
      
      // Remaining (NEW)
      pendingQuantity: 50,        // Still pending: 50 Bags
      pendingWeight: 2500,        // Still pending: 2500 kg
      
      unit: "Bags",
      warehouseLocation: "Zone A"
    }
  ],
  
  // GRN Status (NEW)
  status: "Partial",              // Partial | Complete
  isPartialReceipt: true,         // Flag for partial receipt
  
  generalNotes: "First delivery of 50 bags received"
}
```

---

## 🎨 UI/UX Design

### **1. GRN Form - Items Received Table:**

```
┌────────────────────────────────────────────────────────────────────────┐
│ Items Received                                                         │
├────────────────────────────────────────────────────────────────────────┤
│ PRODUCT      │ ORDERED │ PREV REC │ RECEIVING NOW* │ PENDING │ WEIGHT │
├──────────────┼─────────┼──────────┼────────────────┼─────────┼────────┤
│ Yarn         │ 100 Bags│ 0 Bags   │ [50] Bags      │ 50 Bags │ 2500kg │
│ PROD0005     │         │          │                │         │        │
│              │         │          │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│              │         │          │ Progress: 50% (50/100 Bags)       │
└──────────────┴─────────┴──────────┴────────────────┴─────────┴────────┘
```

**Features:**
- **Ordered:** Total quantity from PO
- **Prev Rec:** Previously received (from other GRNs)
- **Receiving Now:** Editable input for current receipt
- **Pending:** Auto-calculated remaining quantity
- **Weight:** Auto-calculated based on quantity
- **Progress Bar:** Visual completion indicator

---

### **2. Status Badges:**

```javascript
// PO Status
<span className="badge-pending">Pending</span>
<span className="badge-partial">Partially Received (50%)</span>
<span className="badge-complete">Completed</span>

// GRN Status
<span className="badge-partial">Partial Receipt</span>
<span className="badge-complete">Complete Receipt</span>
```

---

### **3. PO List View:**

```
┌────────────────────────────────────────────────────────────────────────┐
│ Purchase Orders                                                        │
├────────────────────────────────────────────────────────────────────────┤
│ PO NUMBER        │ SUPPLIER │ STATUS              │ COMPLETION │ GRNs │
├──────────────────┼──────────┼─────────────────────┼────────────┼──────┤
│ PKRK/PO/25-26/12 │ Supplier │ 🟡 Partially Rec.   │ ████░░ 50% │ 1/2  │
│                  │          │                     │            │      │
└──────────────────┴──────────┴─────────────────────┴────────────┴──────┘
```

---

## 💻 Implementation Approach

### **Phase 1: Backend Changes**

#### **1. Update PurchaseOrder Model:**

```javascript
// server/src/models/PurchaseOrder.js

const purchaseOrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: String,
  productCode: String,
  quantity: Number,
  unit: String,
  specifications: {
    weight: Number,
    // ... other specs
  },
  
  // NEW: Receipt tracking
  receivedQuantity: { type: Number, default: 0 },
  receivedWeight: { type: Number, default: 0 },
  pendingQuantity: { type: Number },
  pendingWeight: { type: Number },
  receiptStatus: {
    type: String,
    enum: ['Pending', 'Partial', 'Complete'],
    default: 'Pending'
  }
});

// Auto-calculate pending quantities
purchaseOrderItemSchema.pre('save', function(next) {
  this.pendingQuantity = this.quantity - (this.receivedQuantity || 0);
  this.pendingWeight = (this.specifications?.weight || 0) - (this.receivedWeight || 0);
  
  // Update status
  if (this.receivedQuantity === 0) {
    this.receiptStatus = 'Pending';
  } else if (this.receivedQuantity < this.quantity) {
    this.receiptStatus = 'Partial';
  } else {
    this.receiptStatus = 'Complete';
  }
  
  next();
});

const purchaseOrderSchema = new mongoose.Schema({
  // ... existing fields
  
  // NEW: Overall status
  status: {
    type: String,
    enum: ['Pending', 'Partially Received', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  
  totalGRNs: { type: Number, default: 0 },
  completionPercentage: { type: Number, default: 0 }
});

// Auto-calculate PO status
purchaseOrderSchema.methods.updateReceiptStatus = function() {
  const totalItems = this.items.length;
  const completedItems = this.items.filter(item => item.receiptStatus === 'Complete').length;
  const partialItems = this.items.filter(item => item.receiptStatus === 'Partial').length;
  
  if (completedItems === totalItems) {
    this.status = 'Completed';
    this.completionPercentage = 100;
  } else if (partialItems > 0 || completedItems > 0) {
    this.status = 'Partially Received';
    this.completionPercentage = Math.round((completedItems / totalItems) * 100);
  } else {
    this.status = 'Pending';
    this.completionPercentage = 0;
  }
};
```

---

#### **2. Update GRN Model:**

```javascript
// server/src/models/GoodsReceiptNote.js

const grnItemSchema = new mongoose.Schema({
  purchaseOrderItem: { type: mongoose.Schema.Types.ObjectId },
  productName: String,
  productCode: String,
  
  // Ordered quantities
  orderedQuantity: Number,
  orderedWeight: Number,
  
  // Previously received (NEW)
  previouslyReceived: { type: Number, default: 0 },
  previousWeight: { type: Number, default: 0 },
  
  // Receiving now
  receivedQuantity: Number,
  receivedWeight: Number,
  
  // Remaining (NEW)
  pendingQuantity: Number,
  pendingWeight: Number,
  
  unit: String,
  warehouseLocation: String,
  notes: String
});

const grnSchema = new mongoose.Schema({
  // ... existing fields
  
  // NEW: Status tracking
  status: {
    type: String,
    enum: ['Partial', 'Complete'],
    default: 'Partial'
  },
  isPartialReceipt: { type: Boolean, default: false }
});
```

---

#### **3. Update GRN Creation Logic:**

```javascript
// server/src/controllers/grnController.js

exports.createGRN = async (req, res) => {
  try {
    const { purchaseOrder, items, ...otherData } = req.body;
    
    // 1. Get PO with current receipt status
    const po = await PurchaseOrder.findById(purchaseOrder);
    
    // 2. Get all existing GRNs for this PO
    const existingGRNs = await GoodsReceiptNote.find({ purchaseOrder });
    
    // 3. Calculate previously received quantities
    const previousReceipts = {};
    existingGRNs.forEach(grn => {
      grn.items.forEach(item => {
        const key = item.purchaseOrderItem.toString();
        if (!previousReceipts[key]) {
          previousReceipts[key] = {
            quantity: 0,
            weight: 0
          };
        }
        previousReceipts[key].quantity += item.receivedQuantity;
        previousReceipts[key].weight += item.receivedWeight || 0;
      });
    });
    
    // 4. Prepare GRN items with tracking
    const grnItems = items.map(item => {
      const poItem = po.items.find(i => i._id.toString() === item.purchaseOrderItem);
      const previous = previousReceipts[item.purchaseOrderItem] || { quantity: 0, weight: 0 };
      
      const receivedWeight = item.receivedWeight || 
        (item.receivedQuantity * (poItem.specifications?.weight || 0) / poItem.quantity);
      
      return {
        ...item,
        orderedQuantity: poItem.quantity,
        orderedWeight: poItem.specifications?.weight || 0,
        previouslyReceived: previous.quantity,
        previousWeight: previous.weight,
        receivedWeight,
        pendingQuantity: poItem.quantity - previous.quantity - item.receivedQuantity,
        pendingWeight: (poItem.specifications?.weight || 0) - previous.weight - receivedWeight
      };
    });
    
    // 5. Determine if this is a partial or complete receipt
    const isPartialReceipt = grnItems.some(item => item.pendingQuantity > 0);
    
    // 6. Create GRN
    const grn = await GoodsReceiptNote.create({
      ...otherData,
      purchaseOrder,
      items: grnItems,
      status: isPartialReceipt ? 'Partial' : 'Complete',
      isPartialReceipt
    });
    
    // 7. Update PO receipt status
    grnItems.forEach(grnItem => {
      const poItem = po.items.find(i => i._id.toString() === grnItem.purchaseOrderItem);
      if (poItem) {
        poItem.receivedQuantity = (poItem.receivedQuantity || 0) + grnItem.receivedQuantity;
        poItem.receivedWeight = (poItem.receivedWeight || 0) + grnItem.receivedWeight;
      }
    });
    
    po.totalGRNs = (po.totalGRNs || 0) + 1;
    po.updateReceiptStatus();
    await po.save();
    
    res.status(201).json({
      success: true,
      data: grn,
      message: isPartialReceipt ? 
        'Partial GRN created successfully' : 
        'Complete GRN created successfully'
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

### **Phase 2: Frontend Changes**

#### **1. Enhanced GRN Form:**

```javascript
// client/src/components/GRN/GRNForm.jsx

const [formData, setFormData] = useState({
  purchaseOrder: '',
  receiptDate: new Date().toISOString().split('T')[0],
  warehouseLocation: '',
  generalNotes: '',
  items: []
});

// Fetch PO with receipt status
const handlePOSelection = async (poId) => {
  try {
    const response = await purchaseOrderAPI.getById(poId);
    const po = response.data;
    setSelectedPO(po);
    
    // Get existing GRNs for this PO
    const grnsResponse = await grnAPI.getByPO(poId);
    const existingGRNs = grnsResponse.data || [];
    
    // Calculate previously received quantities
    const previousReceipts = {};
    existingGRNs.forEach(grn => {
      grn.items.forEach(item => {
        const key = item.purchaseOrderItem;
        if (!previousReceipts[key]) {
          previousReceipts[key] = {
            quantity: 0,
            weight: 0
          };
        }
        previousReceipts[key].quantity += item.receivedQuantity;
        previousReceipts[key].weight += item.receivedWeight || 0;
      });
    });
    
    // Populate items with tracking
    const items = po.items.map(item => {
      const previous = previousReceipts[item._id] || { quantity: 0, weight: 0 };
      const pending = item.quantity - previous.quantity;
      const pendingWeight = (item.specifications?.weight || 0) - previous.weight;
      
      return {
        purchaseOrderItem: item._id,
        productName: item.productName,
        productCode: item.productCode,
        orderedQuantity: item.quantity,
        orderedWeight: item.specifications?.weight || 0,
        previouslyReceived: previous.quantity,
        previousWeight: previous.weight,
        receivedQuantity: 0,  // User will input
        receivedWeight: 0,    // Auto-calculated
        pendingQuantity: pending,
        pendingWeight: pendingWeight,
        unit: item.unit,
        specifications: item.specifications || {},
        warehouseLocation: formData.warehouseLocation,
        notes: ''
      };
    });
    
    setFormData(prev => ({
      ...prev,
      purchaseOrder: poId,
      items
    }));
    
  } catch (error) {
    console.error('Error fetching PO:', error);
  }
};

// Auto-calculate weight when quantity changes
const handleItemChange = (index, field, value) => {
  const updatedItems = [...formData.items];
  updatedItems[index] = {
    ...updatedItems[index],
    [field]: value
  };
  
  // Auto-calculate weight
  if (field === 'receivedQuantity') {
    const item = updatedItems[index];
    const weightPerUnit = item.orderedWeight / item.orderedQuantity;
    updatedItems[index].receivedWeight = value * weightPerUnit;
    
    // Update pending
    updatedItems[index].pendingQuantity = 
      item.orderedQuantity - item.previouslyReceived - value;
    updatedItems[index].pendingWeight = 
      item.orderedWeight - item.previousWeight - (value * weightPerUnit);
  }
  
  setFormData(prev => ({
    ...prev,
    items: updatedItems
  }));
};
```

---

#### **2. Enhanced Items Table:**

```javascript
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        Product
      </th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        Ordered
      </th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        Prev. Received
      </th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        Receiving Now *
      </th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        Pending
      </th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        Weight
      </th>
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
        Progress
      </th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {formData.items.map((item, index) => {
      const completionPercentage = Math.round(
        ((item.previouslyReceived + item.receivedQuantity) / item.orderedQuantity) * 100
      );
      
      return (
        <tr key={index}>
          {/* Product */}
          <td className="px-4 py-4">
            <div className="text-sm font-medium text-gray-900">{item.productName}</div>
            <div className="text-sm text-gray-500">{item.productCode}</div>
          </td>
          
          {/* Ordered */}
          <td className="px-4 py-4 text-sm text-gray-900">
            {item.orderedQuantity} {item.unit}
            <div className="text-xs text-gray-500">{item.orderedWeight} kg</div>
          </td>
          
          {/* Previously Received */}
          <td className="px-4 py-4 text-sm text-gray-600">
            {item.previouslyReceived} {item.unit}
            <div className="text-xs text-gray-500">{item.previousWeight} kg</div>
          </td>
          
          {/* Receiving Now */}
          <td className="px-4 py-4">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={item.receivedQuantity}
                onChange={(e) => handleItemChange(index, 'receivedQuantity', Number(e.target.value))}
                max={item.pendingQuantity}
                min="0"
                className="w-20 px-2 py-1 border border-gray-300 rounded-md"
              />
              <span className="text-sm text-gray-500">{item.unit}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {item.receivedWeight.toFixed(2)} kg
            </div>
          </td>
          
          {/* Pending */}
          <td className="px-4 py-4">
            <div className="text-sm font-medium text-orange-600">
              {item.pendingQuantity} {item.unit}
            </div>
            <div className="text-xs text-gray-500">{item.pendingWeight.toFixed(2)} kg</div>
          </td>
          
          {/* Weight */}
          <td className="px-4 py-4 text-sm text-gray-900">
            {item.specifications?.weight ? `${item.specifications.weight} kg` : '-'}
          </td>
          
          {/* Progress */}
          <td className="px-4 py-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  completionPercentage === 100 ? 'bg-green-600' : 'bg-blue-600'
                }`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-1">{completionPercentage}%</div>
          </td>
        </tr>
      );
    })}
  </tbody>
</table>
```

---

## 🎨 Status Badge Component

```javascript
// client/src/components/common/StatusBadge.jsx

const StatusBadge = ({ status, type = 'po' }) => {
  const getStyles = () => {
    if (type === 'po') {
      switch (status) {
        case 'Pending':
          return 'bg-gray-100 text-gray-800';
        case 'Partially Received':
          return 'bg-yellow-100 text-yellow-800';
        case 'Completed':
          return 'bg-green-100 text-green-800';
        case 'Cancelled':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    } else {
      // GRN status
      switch (status) {
        case 'Partial':
          return 'bg-yellow-100 text-yellow-800';
        case 'Complete':
          return 'bg-green-100 text-green-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStyles()}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
```

---

## ✅ Implementation Checklist

### **Backend:**
- [ ] Update PurchaseOrder model with receipt tracking fields
- [ ] Update GRN model with status fields
- [ ] Add method to calculate PO completion status
- [ ] Update GRN creation logic to track partial receipts
- [ ] Add API endpoint to get GRNs by PO
- [ ] Update PO list API to include status

### **Frontend:**
- [ ] Update GRN form to show previous receipts
- [ ] Add "Receiving Now" editable input
- [ ] Auto-calculate pending quantities
- [ ] Add progress bars
- [ ] Create StatusBadge component
- [ ] Update PO list to show completion status
- [ ] Add validation for over-receiving

### **Testing:**
- [ ] Test partial receipt creation
- [ ] Test multiple GRNs for same PO
- [ ] Test completion status updates
- [ ] Test weight calculations
- [ ] Test validation rules

---

## 🚀 Production Deployment

1. **Database Migration:**
   - Add new fields to existing POs
   - Set default values
   - Calculate current receipt status

2. **Backward Compatibility:**
   - Existing GRNs work without changes
   - New fields are optional
   - Gradual rollout possible

3. **User Training:**
   - Document partial receipt process
   - Create user guide
   - Provide examples

---

**End of Design Document**
