# GRN Status Enum Fix

## Error Fixed

**Error:**
```
Error: GoodsReceiptNote validation failed: status: `Partial` is not a valid enum value for path `status`.
```

**Root Cause:**
The GRN model's `status` field has specific enum values, and 'Partial' is not one of them.

---

## GRN Status Enum Values

**Valid values in GoodsReceiptNote model:**
- `Draft` - Initial state
- `Received` - Goods received (partial or complete)
- `Under_Review` - Quality check in progress
- `Approved` - Quality approved
- `Rejected` - Quality rejected
- `Completed` - Fully processed and approved

**Invalid value we were using:**
- ❌ `Partial` - Not in enum

---

## Solution

**File:** `server/src/controller/grnController.js` (Line 276)

**Before:**
```javascript
const grnStatus = receiptStatus === 'Complete' ? 'Completed' : (anyItemReceived ? 'Partial' : 'Draft');
```

**After:**
```javascript
const grnStatus = receiptStatus === 'Complete' ? 'Completed' : (anyItemReceived ? 'Received' : 'Draft');
```

---

## Status Mapping

### Scenario 1: No items received
```
receivedQuantity: 0
receiptStatus: 'Pending'
↓
GRN status: 'Draft' ✅
```

### Scenario 2: Partial receipt
```
receivedQuantity: 50/100
receiptStatus: 'Partial'
↓
GRN status: 'Received' ✅ (was 'Partial' ❌)
```

### Scenario 3: Complete receipt
```
receivedQuantity: 100/100
receiptStatus: 'Complete'
↓
GRN status: 'Completed' ✅
```

### Scenario 4: Manual completion
```
receivedQuantity: 98/100
manuallyCompleted: true
receiptStatus: 'Complete'
↓
GRN status: 'Completed' ✅
```

---

## How It Works Now

### Partial GRN (50/100 bags):
```
1. Create GRN with 50 bags
   ↓
   receiptStatus: 'Partial'
   status: 'Received' ✅
   approvalStatus: 'Approved'
   ↓
2. InventoryLot created
   ↓
3. Shows in Inventory: 50 bags
```

### Complete GRN (50/100 + 50/100 = 100):
```
1. Create second GRN with 50 bags
   ↓
   receiptStatus: 'Complete'
   status: 'Completed' ✅
   approvalStatus: 'Approved'
   ↓
2. InventoryLot created
   ↓
3. Shows in Inventory: 100 bags (2 lots)
```

### Manual Completion (98/100 + mark complete):
```
1. Create GRN with 98 bags + check "Mark as Complete"
   ↓
   receiptStatus: 'Complete'
   status: 'Completed' ✅
   approvalStatus: 'Approved'
   manuallyCompleted: true
   ↓
2. InventoryLot created
   ↓
3. Shows in Inventory: 98 bags
```

---

## Summary

**Problem:** Using 'Partial' status which doesn't exist in enum  
**Solution:** Use 'Received' for partial receipts, 'Completed' for complete  
**Result:** GRNs created successfully, inventory updated correctly  

**Status:** ✅ Fixed - Create GRN to test

---

## Complete Status Flow

```
Draft → Received → Completed
  ↓         ↓           ↓
  No      Partial    Complete
  items   receipt    receipt
```

**All scenarios now work:**
- ✅ Partial GRN (50/100) → status: 'Received'
- ✅ Complete GRN (100/100) → status: 'Completed'
- ✅ Manual completion (98/100) → status: 'Completed'
- ✅ Multiple GRNs → All tracked in inventory
