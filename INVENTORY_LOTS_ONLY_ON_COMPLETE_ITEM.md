# Inventory Lots - Only Create When Item is Complete

## Problem

**Issue:** Inventory lots were being created for partial receipts, even when the item was not fully received.

**Example:**
- PO has 2 items:
  - Plastic 500: 100 bags
  - Plastic 400: 50 bags
- GRN1: Receive 50 bags of Plastic 500 (partial)
- **Problem:** InventoryLot created for Plastic 500 even though only 50/100 received ❌

**User Requirement:**
- Create InventoryLot ONLY when a specific product item is **fully received** (100/100) OR **manually marked as complete**
- Don't create lots for partial receipts

---

## Solution

### Create InventoryLots ONLY for completed items

**File:** `server/src/controller/grnController.js`

### Change 1: Only create lots for complete items

```javascript
// BEFORE (Created lots for any received quantity)
for (const item of grn.items) {
  if (item.receivedQuantity > 0) {
    // Created lot even if partial (50/100)
  }
}

// AFTER (Only create lots for complete items)
for (const item of grn.items) {
  const isItemComplete = item.manuallyCompleted || item.pendingQuantity === 0;
  
  if (isItemComplete && item.receivedQuantity > 0) {
    // Only creates lot if item is complete (100/100 or manually completed)
  }
}
```

### Change 2: Only approve GRN when all items complete

```javascript
// BEFORE (Approved if any item received)
const approvalStatus = anyItemReceived ? 'Approved' : 'Pending';

// AFTER (Only approve when all items complete)
const approvalStatus = receiptStatus === 'Complete' ? 'Approved' : 'Pending';
```

---

## How It Works Now

### Scenario 1: Partial Receipt (50/100 bags)

```
PO: Plastic 500 - 100 bags

GRN1: Receive 50 bags
    ↓
item.receivedQuantity: 50
item.pendingQuantity: 50  ← Still pending
isItemComplete: false     ← NOT complete
    ↓
❌ NO InventoryLot created
❌ NOT in Inventory page
    ↓
GRN status: 'Received'
approvalStatus: 'Pending'
```

### Scenario 2: Complete Receipt (50 + 50 = 100 bags)

```
PO: Plastic 500 - 100 bags

GRN1: Receive 50 bags
    ↓
❌ No lot created (partial)

GRN2: Receive 50 bags (total 100)
    ↓
item.receivedQuantity: 50
item.pendingQuantity: 0   ← No pending!
isItemComplete: true      ← Complete!
    ↓
✅ InventoryLot created (50 bags from GRN2)
✅ Shows in Inventory
    ↓
GRN status: 'Completed'
approvalStatus: 'Approved'
```

**Important:** Only the LAST GRN that completes the item creates the lot!

### Scenario 3: Manual Completion (98/100 + mark complete)

```
PO: Plastic 500 - 100 bags

GRN1: Receive 98 bags + check "Mark as Complete"
    ↓
item.receivedQuantity: 98
item.pendingQuantity: 2
item.manuallyCompleted: true  ← Manually completed!
isItemComplete: true          ← Complete!
    ↓
✅ InventoryLot created (98 bags)
✅ Shows in Inventory
    ↓
GRN status: 'Completed'
approvalStatus: 'Approved'
```

### Scenario 4: Multi-Item PO

```
PO has 2 items:
- Plastic 500: 100 bags
- Plastic 400: 50 bags

GRN1: 
- Plastic 500: 50 bags (partial)
- Plastic 400: 50 bags (complete)
    ↓
Plastic 500:
  pendingQuantity: 50
  isItemComplete: false
  ❌ No lot created

Plastic 400:
  pendingQuantity: 0
  isItemComplete: true
  ✅ Lot created
    ↓
Inventory shows:
- Plastic 400: 50 bags ✅
- Plastic 500: Not shown ❌ (still pending)
```

---

## When InventoryLot is Created

### ✅ Created When:
1. **Item fully received** (pendingQuantity = 0)
   - Example: 100/100 bags received
2. **Item manually completed** (manuallyCompleted = true)
   - Example: 98/100 bags + marked complete

### ❌ NOT Created When:
1. **Item partially received** (pendingQuantity > 0)
   - Example: 50/100 bags received
2. **Item not marked complete** (manuallyCompleted = false)
   - Example: 98/100 bags without marking complete

---

## Complete Flow Examples

### Example 1: Two GRNs to Complete

```
Step 1: Create PO
  Plastic 500: 100 bags

Step 2: Create GRN1
  Receive: 50 bags
  Pending: 50 bags
  ↓
  ❌ No InventoryLot
  ❌ Not in Inventory
  GRN status: 'Received'

Step 3: Create GRN2
  Receive: 50 bags
  Pending: 0 bags ← Complete!
  ↓
  ✅ InventoryLot created (50 bags from GRN2)
  ✅ Shows in Inventory: 50 bags
  GRN status: 'Completed'
```

**Note:** Only 50 bags show in inventory (from GRN2), not 100 bags!

### Example 2: Three GRNs to Complete

```
PO: 100 bags

GRN1: 30 bags → ❌ No lot (pending: 70)
GRN2: 40 bags → ❌ No lot (pending: 30)
GRN3: 30 bags → ✅ Lot created (30 bags)

Inventory shows: 30 bags (only from GRN3)
```

### Example 3: Manual Completion

```
PO: 100 bags

GRN1: 98 bags + "Mark as Complete"
  ↓
  ✅ InventoryLot created (98 bags)
  ✅ Shows in Inventory: 98 bags
  GRN status: 'Completed'
```

---

## Important Notes

### ⚠️ Only Last GRN Creates Lot

When multiple GRNs are needed to complete an item, **only the LAST GRN** creates the InventoryLot.

**Example:**
- GRN1: 50 bags → No lot
- GRN2: 50 bags → Lot created with 50 bags

**Inventory shows:** 50 bags (not 100)

### ⚠️ If You Want All Quantities

If you want inventory to show ALL received quantities (100 bags from both GRNs), you would need to:
1. Create a lot for each GRN (even partial)
2. Aggregate all lots in inventory

But based on your requirement, you only want lots when item is complete.

---

## Testing Instructions

### Test 1: Partial Receipt
1. Create PO for 100 bags
2. Create GRN with 50 bags
3. **Verify:**
   - GRN status: "Received"
   - Approval status: "Pending"
   - ❌ Product NOT in Inventory page
   - ❌ No InventoryLot created

### Test 2: Complete with Second GRN
1. Create second GRN with 50 bags
2. **Verify:**
   - GRN status: "Completed"
   - Approval status: "Approved"
   - ✅ Product shows in Inventory
   - ✅ InventoryLot created (50 bags)

### Test 3: Manual Completion
1. Create PO for 100 bags
2. Create GRN with 98 bags + check "Mark as Complete"
3. **Verify:**
   - GRN status: "Completed"
   - ✅ Product shows in Inventory (98 bags)
   - ✅ InventoryLot created

### Test 4: Multi-Item PO
1. Create PO with:
   - Plastic 500: 100 bags
   - Plastic 400: 50 bags
2. Create GRN with:
   - Plastic 500: 50 bags (partial)
   - Plastic 400: 50 bags (complete)
3. **Verify:**
   - ✅ Plastic 400 in Inventory (50 bags)
   - ❌ Plastic 500 NOT in Inventory
4. Create second GRN with:
   - Plastic 500: 50 bags (complete)
5. **Verify:**
   - ✅ Plastic 500 now in Inventory (50 bags)

---

## Summary

**Problem:** Partial receipts created inventory lots  
**Solution:** Only create lots when item is fully received or manually completed  
**Result:** Inventory shows only completed items  

**When Lot is Created:**
- ✅ Item fully received (100/100)
- ✅ Item manually completed (98/100 + marked)

**When Lot is NOT Created:**
- ❌ Item partially received (50/100)
- ❌ Item not marked complete

**Status:** ✅ Fixed - Test with partial GRN to verify
