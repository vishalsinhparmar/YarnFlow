# GRN Model Cleanup Plan

## 📋 Analysis Based on UI Screenshots & Code

### **Fields ACTUALLY USED in UI:**

#### **GRN Main Fields (Used):**
1. ✅ `grnNumber` - Shown in header
2. ✅ `purchaseOrder` (ref) - Required
3. ✅ `poNumber` - Shown as "PO Reference"
4. ✅ `supplier` (ref) - Required
5. ✅ `supplierDetails.companyName` - Shown in "Supplier Information"
6. ✅ `receiptDate` - Shown as "Receipt Date"
7. ✅ `items` - Array of received items
8. ✅ `status` - Shown as badge (Received, Partial, Complete)
9. ✅ `receiptStatus` - Shown as "Status" (Partial/Complete)
10. ✅ `warehouseLocation` - Shown in form and detail
11. ✅ `storageInstructions` - Shown as "Storage Notes" in form
12. ✅ `generalNotes` - Shown as "General Notes" in form
13. ✅ `createdAt` - Shown as "Created on"
14. ✅ `createdBy` - For audit

#### **GRN Item Fields (Used):**
1. ✅ `purchaseOrderItem` - Reference to PO item
2. ✅ `product` (ref) - Product reference
3. ✅ `productName` - Shown in table
4. ✅ `orderedQuantity` - Shown as "Ordered"
5. ✅ `orderedWeight` - Shown as "Ordered" weight
6. ✅ `previouslyReceived` - Shown as "Previously Received"
7. ✅ `previousWeight` - Shown as "Previously Received" weight
8. ✅ `receivedQuantity` - Shown as "This GRN" / "Receiving Now"
9. ✅ `receivedWeight` - Shown as "This GRN" weight
10. ✅ `pendingQuantity` - Shown as "Pending"
11. ✅ `pendingWeight` - Shown as "Pending" weight
12. ✅ `unit` - Shown (Bags, Kg, etc.)
13. ✅ `manuallyCompleted` - For marking items complete
14. ✅ `completionReason` - Notes for manual completion

---

### **Fields NOT USED (To Remove):**

#### **GRN Main Fields (Unused):**
1. ❌ `supplierDetails.contactPerson` - Not shown in UI
2. ❌ `supplierDetails.email` - Not shown in UI
3. ❌ `supplierDetails.phone` - Not shown in UI
4. ❌ `isPartialReceipt` - Redundant (use receiptStatus)
5. ❌ `qualityCheckStatus` - Not used in current flow
6. ❌ `qualityCheckBy` - Not used
7. ❌ `qualityCheckDate` - Not used
8. ❌ `qualityRemarks` - Not used
9. ❌ `totalReceivedValue` - Not shown in UI
10. ❌ `totalAcceptedValue` - Not shown in UI
11. ❌ `totalRejectedValue` - Not shown in UI
12. ❌ `approvalStatus` - Not used in current flow
13. ❌ `approvedBy` - Not used
14. ❌ `approvedDate` - Not used
15. ❌ `rejectionReason` - Not used
16. ❌ `checkedBy` - Not used
17. ❌ `internalNotes` - Not shown in UI
18. ❌ `attachments` - Not implemented in UI
19. ❌ `lastModifiedBy` - Not needed (use updatedAt)

#### **GRN Item Fields (Unused):**
1. ❌ `acceptedQuantity` - Not used (using receivedQuantity directly)
2. ❌ `rejectedQuantity` - Not used in current flow
3. ❌ `qualityStatus` - Not used
4. ❌ `qualityNotes` - Not used
5. ❌ `warehouseLocation` (item level) - Using GRN-level warehouse
6. ❌ `batchNumber` - Not shown in UI
7. ❌ `expiryDate` - Not shown in UI
8. ❌ `unitPrice` - Not shown in UI
9. ❌ `totalValue` - Not shown in UI
10. ❌ `completedAt` - Not needed
11. ❌ `damageQuantity` - Not used
12. ❌ `damageNotes` - Not used
13. ❌ `notes` (item level) - Not shown in UI

---

## 🎯 Simplified Model Structure

### **Clean GRN Schema:**

```javascript
const grnItemSchema = new mongoose.Schema({
  // Reference
  purchaseOrderItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder.items'
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  
  // Quantities
  orderedQuantity: {
    type: Number,
    default: 0
  },
  orderedWeight: {
    type: Number,
    default: 0
  },
  previouslyReceived: {
    type: Number,
    default: 0
  },
  previousWeight: {
    type: Number,
    default: 0
  },
  receivedQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  receivedWeight: {
    type: Number,
    default: 0
  },
  pendingQuantity: {
    type: Number,
    default: 0
  },
  pendingWeight: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    enum: ['Bags', 'Rolls', 'Kg', 'Meters', 'Pieces'],
    default: 'Bags'
  },
  
  // Manual Completion
  manuallyCompleted: {
    type: Boolean,
    default: false
  },
  completionReason: {
    type: String,
    trim: true
  }
});

const grnSchema = new mongoose.Schema({
  grnNumber: {
    type: String,
    unique: true,
    uppercase: true
  },
  
  // Reference to Purchase Order
  purchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    required: true
  },
  poNumber: {
    type: String,
    required: true
  },
  
  // Supplier Information
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  supplierDetails: {
    companyName: String
  },
  
  // Receipt Information
  receiptDate: {
    type: Date,
    default: Date.now
  },
  
  // Items Received
  items: [grnItemSchema],
  
  // Status
  status: {
    type: String,
    enum: ['Draft', 'Received', 'Partial', 'Complete'],
    default: 'Draft'
  },
  receiptStatus: {
    type: String,
    enum: ['Partial', 'Complete'],
    default: 'Partial'
  },
  
  // Warehouse
  warehouseLocation: {
    type: String,
    trim: true
  },
  storageInstructions: {
    type: String,
    trim: true
  },
  
  // Notes
  generalNotes: {
    type: String,
    trim: true
  },
  
  // Audit
  createdBy: {
    type: String,
    required: true,
    default: 'System'
  }
}, {
  timestamps: true
});
```

---

## ⚠️ Fields to Keep for Backend Logic (Even if not shown in UI)

These fields are used in backend calculations but not displayed:

1. ✅ `previouslyReceived` - Calculated from PO
2. ✅ `previousWeight` - Calculated from PO
3. ✅ `pendingQuantity` - Auto-calculated
4. ✅ `pendingWeight` - Auto-calculated

---

## 🗑️ Safe to Remove

### **Completely Unused:**
- All quality check fields (qualityCheckStatus, qualityCheckBy, etc.)
- All approval workflow fields (approvalStatus, approvedBy, etc.)
- All financial fields (totalReceivedValue, totalAcceptedValue, etc.)
- All attachment fields
- Transport details (not in UI)
- Item-level warehouse location (using GRN-level)
- Batch number, expiry date
- Damage tracking fields
- Accepted/rejected quantities (using received directly)

---

## 📊 Comparison

| Category | Before | After | Removed |
|----------|--------|-------|---------|
| **GRN Main Fields** | 28 | 13 | 15 |
| **GRN Item Fields** | 23 | 14 | 9 |
| **Total Fields** | 51 | 27 | 24 (47%) |

---

## ✅ Benefits of Cleanup

1. **Simpler Model** - 47% fewer fields
2. **Easier to Maintain** - Less code to manage
3. **Better Performance** - Smaller documents
4. **Clearer Intent** - Only fields actually used
5. **No Breaking Changes** - Removing unused fields won't affect existing functionality

---

## 🚀 Migration Strategy

1. **Backup database** before making changes
2. **Remove unused fields** from model
3. **Remove unused pre-save hooks** for quality/approval
4. **Keep GRN number generation** (still needed)
5. **Test existing GRNs** to ensure they still work
6. **No data migration needed** - old documents will just have extra fields (ignored)

---

## 📝 Summary

**Current UI Uses:**
- GRN Number, PO Reference, Receipt Date, Status
- Supplier Company Name
- Warehouse Location, Storage Notes, General Notes
- Items: Product, Ordered, Previously Received, This GRN, Pending (all with qty + weight)
- Manual completion tracking

**Not Used (Can Remove):**
- Quality check workflow
- Approval workflow
- Financial calculations
- Attachments
- Transport details
- Item-level warehouse
- Batch/expiry tracking
- Damage tracking
- Supplier contact details (email, phone, contact person)
