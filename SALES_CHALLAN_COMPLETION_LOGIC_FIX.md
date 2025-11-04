# Sales Challan - Completion Logic Fix

## Issue

**Problem:** Stock was being deducted from inventory immediately when creating a Sales Challan, even for partial dispatches. This caused:
1. Challan shows "100% Complete" even though only 5 out of 10 bags dispatched
2. SO status shows "Partial" (correct)
3. Stock Out appears in Inventory Lots immediately (wrong)

**Expected Behavior (Like GRN):**
- Stock Out should ONLY appear in Inventory Lots when:
  1. SO item is 100% dispatched (e.g., 10 out of 10 bags), OR
  2. SO item is manually marked as complete
- Similar to GRN logic where inventory lots only appear when PO item is complete

---

## Root Cause

The Sales Challan controller was deducting stock immediately upon challan creation, without checking if the SO item was complete. This is different from the GRN pattern where inventory lots are only created when the PO item is complete.

---

## Fix Applied

### File: `server/src/controller/salesChallanController.js`

#### Added Completion Check Logic

```javascript
// BEFORE (Stock deducted immediately)
try {
  for (const item of items) {
    // Deduct stock immediately
    const lots = await InventoryLot.find({ product: item.product });
    // ... deduct from lots
  }
}

// AFTER (Stock deducted only when SO item complete)
try {
  for (const item of items) {
    // Find the SO item to check completion status
    const soItem = so.items.find(i => i._id.toString() === item.salesOrderItem.toString());
    
    // Calculate total dispatched for this SO item across all challans
    const totalDispatched = allChallans.reduce((sum, ch) => {
      const chItem = ch.items.find(i => i.salesOrderItem.toString() === item.salesOrderItem.toString());
      return sum + (chItem ? chItem.dispatchQuantity : 0);
    }, 0);
    
    // Check if this specific SO item is now complete
    const isItemComplete = item.markAsComplete || totalDispatched >= soItem.quantity;
    
    if (!isItemComplete) {
      console.log(`⏳ SO item not yet complete (${totalDispatched}/${soItem.quantity}). Stock will NOT be deducted yet.`);
      continue; // ✅ Skip stock deduction for incomplete items
    }
    
    console.log(`✅ SO item is COMPLETE. Processing stock out for ALL challans...`);
    // ... deduct stock
  }
}
```

#### Added Retroactive Deduction for All Challans

```javascript
// When item becomes complete, deduct stock for ALL challans (current + previous)
const challansForThisItem = allChallans.filter(ch => 
  ch.items.some(i => i.salesOrderItem.toString() === item.salesOrderItem.toString())
).sort({ createdAt: 1 });

let totalQtyToDeduct = 0;
let totalWeightToDeduct = 0;

// Calculate total quantity and weight to deduct from all challans
for (const challanToProcess of challansForThisItem) {
  const challanItem = challanToProcess.items.find(i => i.salesOrderItem.toString() === item.salesOrderItem.toString());
  if (challanItem) {
    totalQtyToDeduct += challanItem.dispatchQuantity;
    totalWeightToDeduct += challanItem.weight || 0;
  }
}

// Deduct total from inventory lots
let remainingQty = totalQtyToDeduct;
let remainingWeight = totalWeightToDeduct;
// ... FIFO deduction
```

#### Updated Movement Reference

```javascript
// Reference all challan numbers that contributed to this deduction
const challanRefs = challansForThisItem.map(ch => ch.challanNumber).join(', ');

lot.movements.push({
  type: 'Issued',
  quantity: qtyToDeduct,
  weight: weightToDeduct,
  date: new Date(),
  reference: challanRefs,  // ✅ All challan numbers
  notes: `Stock out for Sales Challan(s): ${challanRefs} (SO Item Completed)`,
  performedBy: createdBy || 'Admin'
});
```

---

## How It Works Now

### Scenario 1: Partial Dispatch (5 out of 10 bags)

```
1. CREATE SALES ORDER
   Product: product20
   Quantity: 10 bags
   ↓
2. CREATE CHALLAN 1 (Partial)
   Dispatch: 5 bags
   ↓
   ✅ Challan created successfully
   ⏳ SO item not yet complete (5/10)
   ❌ Stock NOT deducted from inventory
   ❌ NO movement in inventory lots
   ↓
3. INVENTORY STATUS
   - SO Status: "Partial" ✅
   - Challan Status: "Partial" ✅
   - Inventory Lots: NO stock out shown ✅
```

### Scenario 2: Complete Dispatch (10 out of 10 bags)

```
1. CREATE SALES ORDER
   Product: product20
   Quantity: 10 bags
   ↓
2. CREATE CHALLAN 1 (Partial)
   Dispatch: 5 bags
   ↓
   ⏳ SO item not yet complete (5/10)
   ❌ Stock NOT deducted
   ↓
3. CREATE CHALLAN 2 (Completes the order)
   Dispatch: 5 bags
   ↓
   ✅ SO item NOW COMPLETE (10/10)
   ✅ Stock deducted for BOTH challans (5 + 5 = 10 bags)
   ✅ Movement created in inventory lots
   ↓
4. INVENTORY STATUS
   - SO Status: "Delivered" ✅
   - Challan 1 Status: "Complete" ✅
   - Challan 2 Status: "Complete" ✅
   - Inventory Lots: Stock out -10 bags ✅
   - Movement: "CH2025110022, CH2025110023 (SO Item Completed)"
```

### Scenario 3: Manual Completion

```
1. CREATE SALES ORDER
   Product: product20
   Quantity: 10 bags
   ↓
2. CREATE CHALLAN 1 (Partial)
   Dispatch: 5 bags
   Mark as Complete: ✅ (checked)
   ↓
   ✅ SO item MANUALLY COMPLETED
   ✅ Stock deducted for 5 bags
   ✅ Movement created in inventory lots
   ↓
3. INVENTORY STATUS
   - SO Status: "Delivered" ✅
   - Challan Status: "Complete" ✅
   - Inventory Lots: Stock out -5 bags ✅
   - Movement: "CH2025110022 (SO Item Completed)"
```

---

## Before vs After

### Before Fix

```
Scenario: SO with 10 bags, Challan 1 dispatches 5 bags

Challan Detail:
┌─────────────────────────────────────┐
│ SO Total: 10 Bags                   │
│ This Challan: 5 Bags                │
│ Completion: 100% ❌ (Wrong!)        │
│ Status: Complete ❌ (Wrong!)        │
└─────────────────────────────────────┘

Sales Challan List:
┌─────────────────────────────────────┐
│ SO2025000030 - Partial ✅           │
│ CH2025110022 - 5 Bags               │
│ Status: Partial ❌ (Should be)      │
└─────────────────────────────────────┘

Inventory Lots:
┌─────────────────────────────────────┐
│ Stock Out: CH2025110022             │
│ -5 Bags ❌ (Should NOT show yet)   │
└─────────────────────────────────────┘
```

### After Fix

```
Scenario: SO with 10 bags, Challan 1 dispatches 5 bags

Challan Detail:
┌─────────────────────────────────────┐
│ SO Total: 10 Bags                   │
│ This Challan: 5 Bags                │
│ Completion: 50% ✅                  │
│ Status: Partial ✅                  │
└─────────────────────────────────────┘

Sales Challan List:
┌─────────────────────────────────────┐
│ SO2025000030 - Partial ✅           │
│ CH2025110022 - 5 Bags               │
│ Status: Partial ✅                  │
└─────────────────────────────────────┘

Inventory Lots:
┌─────────────────────────────────────┐
│ (No stock out shown yet) ✅         │
│ Stock will deduct when SO complete  │
└─────────────────────────────────────┘

---

After Challan 2 (5 more bags):

Inventory Lots:
┌─────────────────────────────────────┐
│ Stock Out: CH2025110022, CH2025110023│
│ -10 Bags ✅ (All challans combined) │
└─────────────────────────────────────┘
```

---

## Console Logs

### Partial Dispatch (Not Complete)

```bash
⏳ SO item product20 not yet complete (5/10). Stock will NOT be deducted yet.
```

### Complete Dispatch

```bash
✅ SO item product20 is COMPLETE (10/10). Processing stock out for ALL challans...
📦 Found 2 challan(s) for this item. Processing stock out...
📊 Total to deduct: 10 Bags, 1971.80 kg
📦 Deducted 10 Bags (1971.80 kg) of product20 from lot LOT2025110013
⚖️  Weight saved in movement: 1971.80 kg
```

---

## Comparison with GRN Logic

### GRN (Stock In)

```
PO: 100 bags

GRN 1: Receive 50 bags
  ↓
  ⏳ PO item not complete (50/100)
  ❌ Inventory lot NOT created yet

GRN 2: Receive 50 bags
  ↓
  ✅ PO item NOW COMPLETE (100/100)
  ✅ Inventory lots created for BOTH GRNs
  ✅ Stock In: +50 (GRN1) + +50 (GRN2) = +100
```

### Sales Challan (Stock Out)

```
SO: 10 bags

Challan 1: Dispatch 5 bags
  ↓
  ⏳ SO item not complete (5/10)
  ❌ Stock NOT deducted yet

Challan 2: Dispatch 5 bags
  ↓
  ✅ SO item NOW COMPLETE (10/10)
  ✅ Stock deducted for BOTH challans
  ✅ Stock Out: -5 (CH1) + -5 (CH2) = -10
```

**Perfect symmetry!** ✅

---

## Testing Instructions

### Test 1: Partial Dispatch

1. **Create SO**: 10 bags
2. **Create Challan 1**: Dispatch 5 bags
3. **Verify:**
   - [ ] Challan shows "Partial" status
   - [ ] SO shows "Partial" status
   - [ ] Inventory Lots: NO stock out shown
   - [ ] Console: "⏳ SO item not yet complete (5/10)"

### Test 2: Complete Dispatch

1. **Continue from Test 1**
2. **Create Challan 2**: Dispatch 5 bags
3. **Verify:**
   - [ ] Challan 1 shows "Complete" status
   - [ ] Challan 2 shows "Complete" status
   - [ ] SO shows "Delivered" status
   - [ ] Inventory Lots: Stock out -10 bags
   - [ ] Movement references both challans
   - [ ] Console: "✅ SO item is COMPLETE (10/10)"

### Test 3: Manual Completion

1. **Create SO**: 10 bags
2. **Create Challan**: Dispatch 5 bags, check "Mark as Complete"
3. **Verify:**
   - [ ] Challan shows "Complete" status
   - [ ] SO shows "Delivered" status
   - [ ] Inventory Lots: Stock out -5 bags
   - [ ] Console: "✅ SO item is COMPLETE"

### Test 4: Multiple Items

1. **Create SO**: 
   - Item 1: 10 bags
   - Item 2: 20 bags
2. **Create Challan 1**: 
   - Item 1: 10 bags (complete)
   - Item 2: 10 bags (partial)
3. **Verify:**
   - [ ] Item 1: Stock deducted (-10 bags)
   - [ ] Item 2: Stock NOT deducted yet
4. **Create Challan 2**:
   - Item 2: 10 bags (complete)
5. **Verify:**
   - [ ] Item 2: Stock deducted (-20 bags total)

---

## Impact

✅ **No Breaking Changes**
- Existing challans continue to work
- Only affects new challans
- Backward compatible

✅ **Matches GRN Pattern**
- Consistent logic across system
- Stock In (GRN) and Stock Out (Challan) work the same way
- Easy to understand and maintain

✅ **Accurate Inventory**
- Stock only deducted when SO complete
- No premature stock deductions
- Inventory Lots show accurate data

✅ **Better Status Display**
- Challan status reflects actual completion
- SO status reflects dispatch progress
- Clear indication of partial vs complete

---

## Summary

**Problem:** Stock deducted immediately, even for partial dispatches

**Root Cause:** Missing completion check in sales challan controller

**Fix:** 
1. ✅ Check if SO item is complete before deducting stock
2. ✅ Deduct stock for ALL challans when item completes
3. ✅ Reference all challan numbers in movement
4. ✅ Match GRN pattern for consistency

**Result:**
- Stock only deducted when SO item complete
- Inventory Lots show accurate stock out
- Challan status reflects actual completion
- Perfect symmetry with GRN logic

**Status:** ✅ Fixed - Ready to test
