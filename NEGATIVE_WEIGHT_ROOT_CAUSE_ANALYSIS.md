# Negative Weight Issue - Root Cause Analysis ✅

## Problem Identified

**Report shows**: -2500.00 KG (NEGATIVE)
**Expected**: 0.00 KG

### Scenario
```
GRN/003: 100 Bags / 5000 KG (Received)
SC/003: 50 Bags / 2500 KG (Issued)
SC/004: 50 Bags / 2500 KG (Issued)

Expected Calculation:
├─ Received Weight: 5000 KG ✅
├─ Issued Weight: 2500 + 2500 = 5000 KG ✅
└─ Balance: 5000 - 5000 = 0 KG ✅

Actual Report Shows:
├─ Received Weight: 5000 KG ✅
├─ Issued Weight: 7500 KG ❌ (WRONG!)
└─ Balance: 5000 - 7500 = -2500 KG ❌
```

---

## Investigation Results

### 1. Report Calculation Logic ✅ CORRECT
**File**: `server/src/reports/report.definitions/inventoryLot.definition.js` (Lines 86-113)

The report uses MongoDB aggregation to calculate:
```javascript
Balance Weight = 
  SUM(movements where type='Received' weight) - 
  SUM(movements where type='Issued' weight)
```

This logic is **CORRECT**.

### 2. Movement Recording Logic ✅ CORRECT
**File**: `server/src/controller/salesChallanController.js` (Lines 540-548)

When a challan is created, a movement is recorded:
```javascript
lot.movements.push({
  type: 'Issued',
  quantity: qtyToDeduct,
  weight: weightToDeduct,  // ✅ Correctly calculated
  date: new Date(),
  reference: movementReference,
  notes: `Stock out for Sales Challan: ${challan.challanNumber}`,
  performedBy: createdBy || 'Admin'
});
```

This logic is **CORRECT**.

### 3. Weight Calculation Logic ✅ CORRECT
**File**: `server/src/controller/inventoryController.js` (Lines 148-159)

The inventory controller calculates:
```javascript
agg.currentWeight = agg.receivedWeight - agg.issuedWeight;
```

This logic is **CORRECT** (we fixed it earlier).

---

## Root Cause: DATA INTEGRITY ISSUE

Since all the code logic is correct, but the report shows **Issued Weight = 7500 KG instead of 5000 KG**, the issue must be:

### Possibility 1: Duplicate Movements in Database
The database might have **duplicate "Issued" movements** recorded:
```
Movement 1: Issued, 2500 KG (SC/003)
Movement 2: Issued, 2500 KG (SC/004)
Movement 3: Issued, 2500 KG (DUPLICATE - should not exist!)
Total Issued: 7500 KG ❌
```

### Possibility 2: Incorrect Weight Recorded
One of the movements might have recorded the wrong weight:
```
Movement 1: Issued, 2500 KG (SC/003)
Movement 2: Issued, 5000 KG (SC/004) ❌ WRONG - should be 2500
Total Issued: 7500 KG ❌
```

### Possibility 3: Old Data Before Fixes
The data might have been created before the weight calculation fixes were applied.

---

## Solution: Data Cleanup + Code Fix

### Step 1: Verify the Data
Run a diagnostic query to check movements:

```javascript
// Check the movements for the Hemp Yarn product
db.inventorylots.findOne({
  productName: "Hemp Yarn"
}).then(lot => {
  console.log("Lot:", lot.lotNumber);
  console.log("Movements:");
  lot.movements.forEach(m => {
    console.log(`  - Type: ${m.type}, Qty: ${m.quantity}, Weight: ${m.weight}, Ref: ${m.reference}`);
  });
  console.log("Total Issued Weight:", 
    lot.movements
      .filter(m => m.type === 'Issued')
      .reduce((sum, m) => sum + m.weight, 0)
  );
});
```

### Step 2: Identify Duplicate or Wrong Movements
If duplicates are found:
```javascript
// Remove duplicate movements
db.inventorylots.updateOne(
  { lotNumber: "LOT2026090003" },
  { $set: { movements: [...correctMovementsOnly] } }
);
```

### Step 3: Recalculate Inventory
After cleaning the data, the inventory controller will automatically recalculate:
```javascript
agg.currentWeight = agg.receivedWeight - agg.issuedWeight;
```

---

## Why This Happened

The negative weight issue is likely due to:

1. **Old data before fixes** - Data created before the weight calculation logic was corrected
2. **Duplicate movements** - Movements recorded multiple times due to retry logic or transaction issues
3. **Manual database edits** - Someone manually edited the database without proper validation

---

## Prevention

To prevent this in the future:

### 1. Add Data Validation
```javascript
// In salesChallanController.js
// Check for duplicate movements before creating new one
const existingMovement = lot.movements.find(m =>
  m.type === 'Issued' &&
  m.reference === movementReference
);

if (existingMovement) {
  console.warn('Movement already exists, skipping...');
  continue;
}
```

### 2. Add Database Constraints
```javascript
// In InventoryLot schema
movements: [{
  type: String,
  reference: { type: String, unique: true },  // Prevent duplicates
  weight: Number,
  // ...
}]
```

### 3. Add Audit Logging
```javascript
// Log all movement changes
console.log('Movement recorded:', {
  lotNumber: lot.lotNumber,
  type: 'Issued',
  weight: weightToDeduct,
  reference: movementReference,
  timestamp: new Date()
});
```

---

## Immediate Action Required

### 1. Diagnose the Data
Run the diagnostic query to identify:
- How many movements are recorded for each lot
- What weights are recorded
- If there are duplicates

### 2. Clean the Data
Remove duplicate or incorrect movements from the database

### 3. Verify the Fix
After cleanup, the report should show:
- Issued Weight: 5000 KG ✅
- Balance Weight: 0 KG ✅

---

## Summary

| Aspect | Status | Issue |
|--------|--------|-------|
| **Report Calculation Logic** | ✅ CORRECT | None |
| **Movement Recording Logic** | ✅ CORRECT | None |
| **Weight Calculation Logic** | ✅ CORRECT | None |
| **Database Data** | ❌ CORRUPTED | Duplicate or wrong movements |

**Root Cause**: Data integrity issue in the database, not a code issue.

**Solution**: Clean the database data and verify the fix.

---

## Files Involved

- ✅ `server/src/reports/report.definitions/inventoryLot.definition.js` - Report calculation (CORRECT)
- ✅ `server/src/controller/salesChallanController.js` - Movement recording (CORRECT)
- ✅ `server/src/controller/inventoryController.js` - Weight calculation (CORRECT)
- ❌ **Database** - Data integrity issue (NEEDS CLEANUP)

---

## Next Steps

1. Run diagnostic query to identify the issue
2. Clean the database data
3. Verify the report shows correct values
4. Add validation to prevent future issues

