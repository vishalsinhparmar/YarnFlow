# All GRNs Create Lots When Item Completes

## Problem

**Issue:** When completing a PO item with multiple GRNs, only the LAST GRN created an inventory lot.

**Example:**
- PO: product20 - 100 bags
- GRN1: 50 bags (partial) → ❌ No lot created
- GRN2: 50 bags (complete) → ✅ Only this lot created
- **Result:** Inventory shows 50 bags instead of 100 bags ❌

**User Requirement:**
- When item becomes complete, create lots for ALL GRNs (including previous partial ones)
- Inventory should show total 100 bags (2 lots of 50 each)
- Both GRNs should show status "Completed"

---

## Solution

### Create lots for ALL GRNs when item becomes complete

**File:** `server/src/controller/grnController.js`

### Key Changes:

**1. Find Previous GRNs**
```javascript
// When item becomes complete, find all previous GRNs for this PO and product
const previousGRNs = await GoodsReceiptNote.find({
  purchaseOrder: grn.purchaseOrder,
  'items.product': item.product,
  _id: { $ne: grn._id } // Exclude current GRN
}).sort({ createdAt: 1 });
```

**2. Create Lots for Previous GRNs**
```javascript
for (const prevGRN of previousGRNs) {
  const prevItem = prevGRN.items.find(i => i.product.toString() === item.product.toString());
  
  if (prevItem && prevItem.receivedQuantity > 0) {
    // Check if lot already exists
    const existingLot = await InventoryLot.findOne({
      grn: prevGRN._id,
      product: item.product
    });
    
    if (!existingLot) {
      // Create lot for previous GRN
      const prevLot = new InventoryLot({
        grnNumber: prevGRN.grnNumber,
        receivedQuantity: prevItem.receivedQuantity,
        qualityNotes: 'Auto-approved (Item Completed in Later GRN)',
        ...
      });
      
      await prevLot.save();
      
      // Update product inventory
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { 'inventory.currentStock': prevItem.receivedQuantity } }
      );
      
      // Update previous GRN status to Completed
      await GoodsReceiptNote.findByIdAndUpdate(prevGRN._id, {
        status: 'Completed',
        approvalStatus: 'Approved'
      });
    }
  }
}
```

**3. Create Lot for Current GRN**
```javascript
// After creating lots for previous GRNs, create lot for current GRN
const lot = new InventoryLot({
  grnNumber: grn.grnNumber,
  receivedQuantity: item.receivedQuantity,
  ...
});
```

---

## How It Works Now

### Scenario: Two GRNs to Complete (50 + 50 = 100)

```
Step 1: Create PO
  product20: 100 bags

Step 2: Create GRN1 (Partial)
  Receive: 50 bags
  Pending: 50 bags
  ↓
  isItemComplete: false
  ↓
  ❌ No lot created yet
  ❌ Not in Inventory
  GRN1 status: 'Received'

Step 3: Create GRN2 (Complete)
  Receive: 50 bags
  Pending: 0 bags ← Item now complete!
  ↓
  isItemComplete: true
  ↓
  System finds previous GRN1
  ↓
  ✅ Create lot for GRN1 (50 bags)
  ✅ Update GRN1 status to 'Completed'
  ✅ Create lot for GRN2 (50 bags)
  ✅ Update GRN2 status to 'Completed'
  ↓
  Inventory shows: 100 bags (2 lots) ✅
  
  Lot 1:
    GRN: GRN2025110050
    Quantity: 50 bags
    Status: Active
  
  Lot 2:
    GRN: GRN2025110051
    Quantity: 50 bags
    Status: Active
```

---

## Complete Flow Examples

### Example 1: Two Partial GRNs

```
PO: 100 bags

GRN1: 50 bags
  ↓
  Pending: 50
  ❌ No lot
  Status: 'Received'

GRN2: 50 bags
  ↓
  Pending: 0 ← Complete!
  ↓
  ✅ Create lot for GRN1 (50 bags)
  ✅ Update GRN1 to 'Completed'
  ✅ Create lot for GRN2 (50 bags)
  ✅ Update GRN2 to 'Completed'
  ↓
  Inventory: 100 bags (2 lots)
  GRN1 status: 'Completed' ✅
  GRN2 status: 'Completed' ✅
```

### Example 2: Three Partial GRNs

```
PO: 100 bags

GRN1: 30 bags → No lot, status: 'Received'
GRN2: 40 bags → No lot, status: 'Received'
GRN3: 30 bags → Complete!
  ↓
  ✅ Create lot for GRN1 (30 bags)
  ✅ Update GRN1 to 'Completed'
  ✅ Create lot for GRN2 (40 bags)
  ✅ Update GRN2 to 'Completed'
  ✅ Create lot for GRN3 (30 bags)
  ✅ Update GRN3 to 'Completed'
  ↓
  Inventory: 100 bags (3 lots)
  All GRNs status: 'Completed' ✅
```

### Example 3: Manual Completion

```
PO: 100 bags

GRN1: 50 bags → No lot, status: 'Received'
GRN2: 48 bags + "Mark as Complete"
  ↓
  manuallyCompleted: true
  isItemComplete: true
  ↓
  ✅ Create lot for GRN1 (50 bags)
  ✅ Update GRN1 to 'Completed'
  ✅ Create lot for GRN2 (48 bags)
  ✅ Update GRN2 to 'Completed'
  ↓
  Inventory: 98 bags (2 lots)
  All GRNs status: 'Completed' ✅
```

---

## What This Fixes

### ✅ All GRNs Create Lots
- GRN1 (50 bags) → Lot created when item completes
- GRN2 (50 bags) → Lot created when item completes
- Total: 100 bags in inventory

### ✅ All GRNs Show as Completed
- GRN1 status: 'Completed' (updated retroactively)
- GRN2 status: 'Completed'
- Both show green "Complete" badge

### ✅ Correct Inventory Total
- Shows 100 bags (not 50)
- 2 lots visible
- Each lot shows its GRN number

### ✅ Complete Audit Trail
- Movement history shows both GRNs
- Each lot has its own movement record
- Full traceability

---

## API Response Structure

### GET /api/inventory (After both GRNs)

```json
{
  "data": [
    {
      "categoryName": "Cotton Yarn",
      "products": [
        {
          "productName": "product20",
          "productCode": "PROD0007",
          "currentStock": 100,        ← ✅ Total from both GRNs
          "receivedStock": 100,
          "issuedStock": 0,
          "totalWeight": 5000,
          "lotCount": 2,              ← ✅ Two lots
          "lots": [
            {
              "lotNumber": "LOT2025110009",
              "grnNumber": "GRN2025110050",  ← ✅ First GRN
              "receivedQuantity": 50,
              "currentQuantity": 50,
              "status": "Active",
              "movements": [
                {
                  "type": "Received",
                  "quantity": 50,
                  "reference": "GRN2025110050"
                }
              ]
            },
            {
              "lotNumber": "LOT2025110010",
              "grnNumber": "GRN2025110051",  ← ✅ Second GRN
              "receivedQuantity": 50,
              "currentQuantity": 50,
              "status": "Active",
              "movements": [
                {
                  "type": "Received",
                  "quantity": 50,
                  "reference": "GRN2025110051"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## GRN List View

### Before Fix:
```
GRN2025110050 - Partial  ⚠️  (50 bags)
GRN2025110051 - Complete ✅ (50 bags)
```

### After Fix:
```
GRN2025110050 - Complete ✅ (50 bags)
GRN2025110051 - Complete ✅ (50 bags)
```

Both GRNs now show as "Complete"!

---

## Testing Instructions

### Test 1: Two Partial GRNs
1. Create PO for 100 bags
2. Create GRN1 with 50 bags
3. **Verify:**
   - GRN1 status: "Received" (not complete yet)
   - ❌ Product NOT in Inventory
4. Create GRN2 with 50 bags
5. **Verify:**
   - GRN1 status: "Completed" ✅ (updated)
   - GRN2 status: "Completed" ✅
   - ✅ Product in Inventory: 100 bags
   - ✅ 2 lots visible (50 + 50)

### Test 2: Three Partial GRNs
1. Create PO for 100 bags
2. Create GRN1 (30 bags) → Not in inventory
3. Create GRN2 (40 bags) → Not in inventory
4. Create GRN3 (30 bags) → Completes item
5. **Verify:**
   - All 3 GRNs status: "Completed" ✅
   - Inventory: 100 bags (3 lots) ✅
   - Lots: 30 + 40 + 30 = 100

### Test 3: Manual Completion
1. Create PO for 100 bags
2. Create GRN1 (50 bags) → Not in inventory
3. Create GRN2 (48 bags) + mark complete
4. **Verify:**
   - Both GRNs status: "Completed" ✅
   - Inventory: 98 bags (2 lots) ✅

### Test 4: Check Database
```javascript
// Check InventoryLots
db.inventorylots.find({ 
  productCode: "PROD0007" 
}).sort({ receivedDate: 1 })

// Should return 2 lots:
[
  {
    grnNumber: "GRN2025110050",
    receivedQuantity: 50,
    qualityNotes: "Auto-approved (Item Completed in Later GRN)"
  },
  {
    grnNumber: "GRN2025110051",
    receivedQuantity: 50,
    qualityNotes: "Auto-approved (Item Fully Received)"
  }
]

// Check GRN status
db.goodsreceiptnotes.find({ 
  grnNumber: { $in: ["GRN2025110050", "GRN2025110051"] } 
})

// Both should show:
{
  status: "Completed",
  approvalStatus: "Approved"
}
```

---

## Benefits

### 1. Accurate Inventory ✅
- Shows total quantity from all GRNs
- No missing quantities
- Complete visibility

### 2. Complete Audit Trail ✅
- Each GRN creates its own lot
- Full movement history
- Clear traceability

### 3. Correct GRN Status ✅
- All GRNs show as "Completed"
- No confusion with "Partial" status
- Clear indication of completion

### 4. Better UX ✅
- Users see all received quantities
- Multiple lots per product
- Easy to track which GRN contributed what

---

## Summary

**Problem:** Only last GRN created lot, inventory showed 50 instead of 100  
**Solution:** When item completes, create lots for ALL GRNs (including previous ones)  
**Result:** All GRNs create lots, inventory shows correct total, all GRNs marked complete  

**What Happens Now:**
1. GRN1 (50 bags) → No lot initially
2. GRN2 (50 bags) → Item complete!
3. System creates lot for GRN1 ✅
4. System creates lot for GRN2 ✅
5. System updates GRN1 to "Completed" ✅
6. System updates GRN2 to "Completed" ✅
7. Inventory shows 100 bags (2 lots) ✅

**Status:** ✅ Fixed - Create new GRNs to test
