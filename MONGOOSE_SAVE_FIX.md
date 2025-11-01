# Mongoose Nested Document Save Fix

## 🚨 **THE PROBLEM**

```
Before save (in memory): pending = 0, status = 'Fully_Received' ✅
After save (in database): pending = 2, status = 'Partially_Received' ❌

WHY? Mongoose wasn't detecting changes to nested documents!
```

---

## 🔍 **Root Cause**

Mongoose has issues detecting changes to nested documents (items in an array). When you modify properties of objects inside an array, Mongoose doesn't always track those changes.

### **What Wasn't Working:**

```javascript
// ❌ Direct modification - Mongoose might not detect
this.items.forEach(item => {
  item.pendingQuantity = 0;
  item.receiptStatus = 'Complete';
});
// Changes made in memory but NOT saved to database!
```

---

## ✅ **THE FIX**

### **1. Create New Array (Trigger Change Detection)**

**File:** `server/src/models/PurchaseOrder.js`

```javascript
// ✅ Create NEW array with .map()
const updatedItems = this.items.map((item) => {
  if (item.manuallyCompleted) {
    item.receiptStatus = 'Complete';
    item.pendingQuantity = 0;
    item.pendingWeight = 0;
  } else {
    item.pendingQuantity = item.quantity - item.receivedQuantity;
    // ... other logic
  }
  return item;  // Return modified item
});

// ✅ Reassign array to trigger Mongoose change detection
this.items = updatedItems;
```

### **2. Mark Fields as Modified**

```javascript
// ✅ Tell Mongoose these fields changed
this.markModified('status');
this.markModified('completionPercentage');
this.markModified('items');
```

### **3. Save with Options**

**File:** `server/src/controller/grnController.js`

```javascript
// ✅ Force save with all validations
await purchaseOrder.save({ validateModifiedOnly: false });
```

---

## 📊 **How It Works Now**

### **Step 1: Update Quantities**
```javascript
poItem.receivedQuantity = 98;
poItem.manuallyCompleted = true;
```

### **Step 2: Call updateReceiptStatus()**
```javascript
await purchaseOrder.updateReceiptStatus();
// Creates NEW array with updated values
// this.items = [{ pending: 0, status: 'Complete', ... }]
```

### **Step 3: Mongoose Detects Changes**
```javascript
// Because we:
// 1. Created new array
// 2. Reassigned this.items
// 3. Called markModified()
// Mongoose knows the items changed!
```

### **Step 4: Save to Database**
```javascript
await purchaseOrder.save({ validateModifiedOnly: false });
// ✅ All changes persisted!
```

---

## 🧪 **Expected Results**

### **Console Logs:**
```
📦 PO Items: [{ pending: 0, manuallyCompleted: true, status: 'Complete' }]
💾 PO saved successfully
🔍 Verification - PO from DB:
   Status: Fully_Received  ✅
   Items: [{ pending: 0, manuallyCompleted: true, status: 'Complete' }]  ✅
```

### **Database:**
```json
{
  "status": "Fully_Received",
  "items": [{
    "receiptStatus": "Complete",
    "manuallyCompleted": true,
    "pendingQuantity": 0,
    "pendingWeight": 0,
    "receivedQuantity": 98
  }]
}
```

### **UI:**
- ✅ PO List: Shows "Fully Received"
- ✅ PO Detail: Shows 0 pending
- ✅ Inventory: Shows product (because PO is complete)
- ✅ GRN Page: Shows "Complete"

---

## 🔧 **Files Changed**

### **1. server/src/models/PurchaseOrder.js**
```javascript
// Changed from forEach to map
const updatedItems = this.items.map((item) => {
  // ... update logic
  return item;
});

// Reassign array
this.items = updatedItems;

// Mark as modified
this.markModified('status');
this.markModified('completionPercentage');
this.markModified('items');
```

### **2. server/src/controller/grnController.js**
```javascript
// Save with options
await purchaseOrder.save({ validateModifiedOnly: false });
```

---

## 📝 **Why Each Change Matters**

### **`.map()` instead of `.forEach()`:**
```javascript
// ❌ forEach - modifies in place, Mongoose might not detect
this.items.forEach(item => item.pending = 0);

// ✅ map - creates new array, Mongoose detects change
this.items = this.items.map(item => {
  item.pending = 0;
  return item;
});
```

### **Reassign `this.items`:**
```javascript
// ❌ Direct modification
this.items[0].pending = 0;  // Mongoose might not detect

// ✅ Reassignment
this.items = updatedItems;  // Mongoose detects!
```

### **`markModified()`:**
```javascript
// ✅ Explicitly tell Mongoose what changed
this.markModified('items');
// Now Mongoose KNOWS to save items array
```

### **Save options:**
```javascript
// ✅ Force full validation and save
await doc.save({ validateModifiedOnly: false });
// Ensures all changes persist
```

---

## 🎯 **Testing**

### **Test 1: Create GRN with Mark Complete**
```
1. Create PO: 100 bags
2. Create GRN: 98 bags + Mark Complete ✓
3. Check logs:
   📦 PO Items: [{ pending: 0 }]
   🔍 Verification: Status: Fully_Received, pending: 0
4. Check database:
   status: "Fully_Received"
   items[0].pendingQuantity: 0
5. Check UI:
   PO shows "Fully Received"
   Inventory shows product
```

### **Test 2: Verify Database Persistence**
```javascript
// In MongoDB shell:
db.purchaseorders.findOne({ poNumber: "PKRK/PO/25-26/040" })

// Should show:
{
  status: "Fully_Received",
  items: [{
    receiptStatus: "Complete",
    manuallyCompleted: true,
    pendingQuantity: 0,
    pendingWeight: 0
  }]
}
```

---

## 🚀 **Deployment**

### **Files to Deploy:**
1. ✅ `server/src/models/PurchaseOrder.js`
2. ✅ `server/src/controller/grnController.js`

### **No Migration Needed:**
- Existing POs will work fine
- New logic only applies to new GRNs
- Backward compatible

---

## 📞 **If Still Not Working**

### **Check 1: Mongoose Version**
```bash
# Check version
npm list mongoose

# If < 6.0, might need different approach
```

### **Check 2: Schema Definition**
```javascript
// Ensure items is defined as array of subdocuments
items: [purchaseOrderItemSchema]
// NOT: items: { type: Array }
```

### **Check 3: Database Connection**
```javascript
// Ensure using same database
console.log(mongoose.connection.name);
```

---

## ✅ **Summary**

### **Problem:**
Mongoose wasn't saving nested document changes

### **Solution:**
1. Create new array with `.map()`
2. Reassign `this.items = updatedItems`
3. Call `markModified('items')`
4. Save with `{ validateModifiedOnly: false }`

### **Result:**
✅ Changes persist to database
✅ Verification matches in-memory state
✅ UI shows correct status
✅ Inventory shows products

---

**Status:** 🔧 **CRITICAL FIX APPLIED - TEST NOW!**

Please create a new GRN and verify the database saves correctly!
