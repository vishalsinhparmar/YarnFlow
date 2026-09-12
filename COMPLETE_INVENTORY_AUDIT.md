# Complete Inventory System Audit - NO CHANGES YET

## Executive Summary

**Current Status**: Inventory system has architectural issues causing negative balance weights in reports.

**Root Cause**: The report is using `currentQuantity` (remaining balance) as "Weight In" instead of the original `totalWeight` (received weight).

**Error Message**: "Unsupported selected field: reservedQuantity" - This field was removed from the definition but is still referenced in saved reports or frontend state.

---

## 1. GRN Creation/Update Code

**Location**: `server/src/controller/grnController.js`

### What It Does:
- Creates GRN records from Purchase Orders
- Creates InventoryLot records when GRN is received
- Records "Received" movements in InventoryLot

### Key Code (Lines 508-552):
```javascript
const lot = new InventoryLot({
  grn: grn._id,
  grnNumber: grn.grnNumber,
  // ...
  receivedQuantity: item.receivedQuantity,
  currentQuantity: item.receivedQuantity,
  totalWeight: item.receivedWeight || 0,  // ← RECEIVED WEIGHT
  // ...
});

lot.movements.push({
  type: 'Received',
  quantity: item.receivedQuantity,
  weight: item.receivedWeight || 0,  // ← RECEIVED WEIGHT
  date: grn.receiptDate,
  reference: grn.grnNumber,
  // ...
});
```

### Status: ✅ CORRECT
- Sets `totalWeight` from `item.receivedWeight`
- Creates "Received" movement with weight
- Preserves original received quantity

---

## 2. InventoryLot Creation/Update Code

**Location**: `server/src/models/InventoryLot.js`

### Fields:
```javascript
receivedQuantity: Number  // Original received amount
currentQuantity: Number   // Remaining amount
totalWeight: Number       // Original received weight
movements: [{
  type: 'Received' | 'Issued' | 'Returned' | 'Adjusted',
  quantity: Number,
  weight: Number,
  // ...
}]
reservedQuantity: Number  // For inventory management (kept in model)
availableQuantity: Number // Calculated: currentQuantity - reservedQuantity
```

### Status: ✅ CORRECT
- Has all necessary fields
- Movements array tracks all transactions
- Pre-save hooks calculate availableQuantity correctly

---

## 3. Received Movement Creation

**Location**: `server/src/controller/grnController.js` (Lines 470-478, 542-552)

### Code:
```javascript
lot.movements.push({
  type: 'Received',
  quantity: item.receivedQuantity,
  weight: item.receivedWeight || 0,
  date: grn.receiptDate,
  reference: grn.grnNumber,
  notes: `Received via GRN ${grn.grnNumber}`,
  performedBy: 'System'
});
```

### Status: ✅ CORRECT
- Records "Received" type
- Includes weight from GRN
- Immutable record of original receipt

---

## 4. Sales Challan Inventory Update Code

**Location**: `server/src/controller/salesChallanController.js` (Lines 450-540)

### Code:
```javascript
const lots = await InventoryLot.find(lotFilter).sort({ receivedDate: 1 });

for (const lot of lots) {
  if (qtyToDeduct <= 0) continue;
  
  lot.currentQuantity -= qtyToDeduct;
  lot.totalWeight = Math.max(0, (lot.totalWeight || 0) - weightToDeduct);
  
  lot.movements.push({
    type: 'Issued',
    quantity: qtyToDeduct,
    weight: weightToDeduct,
    date: new Date(),
    reference: movementReference,
    // ...
  });
}
```

### Status: ❌ PROBLEM FOUND
- **Line 523**: `lot.totalWeight = Math.max(0, (lot.totalWeight || 0) - weightToDeduct);`
- **This is WRONG!** It's reducing the original received weight
- Should NOT modify `totalWeight` - it should remain immutable
- Only `currentQuantity` should be reduced

### Correct Approach:
```javascript
lot.currentQuantity -= qtyToDeduct;
// DO NOT modify lot.totalWeight - it's immutable!

lot.movements.push({
  type: 'Issued',
  quantity: qtyToDeduct,
  weight: weightToDeduct,
  // ...
});
```

---

## 5. Issued Movement Creation

**Location**: `server/src/controller/salesChallanController.js` (Lines 526-534)

### Code:
```javascript
lot.movements.push({
  type: 'Issued',
  quantity: qtyToDeduct,
  weight: weightToDeduct,
  date: new Date(),
  reference: movementReference,
  notes: `Issued via Challan ${challan.challanNumber}`,
  performedBy: createdBy || 'System'
});
```

### Status: ✅ CORRECT
- Records "Issued" type
- Includes weight issued
- Proper reference to challan

---

## 6. Report API/Aggregation Code

**Location**: `server/src/reports/report.service.js`

### Code:
```javascript
export const previewReport = async (reportKey, payload, query) => {
  const definition = validateReportKey(reportKey);
  const validated = validatePayload(definition, payload);
  const model = getModel(definition);
  const pipeline = buildPreviewPipeline(definition, validated, pagination);
  const [result] = await model.aggregate(pipeline).allowDiskUse(true);
  // ...
};
```

### Status: ⚠️ DEPENDS ON DEFINITION
- Uses report definition to build aggregation pipeline
- Validates selected fields against definition
- **Error**: Throws "Unsupported selected field: reservedQuantity" when field not in definition

---

## 7. Report Frontend Components

**Location**: `client/src/components/reports/`

### Files:
- `ReportBuilder.jsx` - Main builder UI
- `FieldPanel.jsx` - Field selection
- `PreviewPanel.jsx` - Preview display
- `useReportBuilder.js` - State management

### Issue:
- Line 73 in `PreviewPanel.jsx` displays error: `{error}`
- Error comes from backend validation (report.validator.js line 37)
- Frontend still has `reservedQuantity` in selectedFields

### Status: ❌ PROBLEM FOUND
- Frontend tries to select `reservedQuantity` field
- Backend definition doesn't have it anymore
- Validation fails with "Unsupported selected field: reservedQuantity"

---

## 8. PDF Generation Code

**Location**: `server/src/utils/reportPdfGenerator.js`

### What It Does:
- Generates PDF from report data
- Uses selected fields to build table
- Formats values for display

### Status: ✅ CORRECT
- Uses report data as-is
- No calculation issues
- Problem is in the data, not PDF generation

---

## 9. Excel Generation Code

**Location**: `server/src/reports/report.export.service.js`

### What It Does:
- Generates Excel from report data
- Uses selected fields
- Formats values

### Status: ✅ CORRECT
- Uses report data as-is
- No calculation issues
- Problem is in the data, not Excel generation

---

## 10. Weight Balance Calculation Locations

### Location 1: Report Definition
**File**: `server/src/reports/report.definitions/inventoryLot.definition.js`

```javascript
field({
  key: 'calculatedWeightBalance',
  label: 'Weight Balance (kg)',
  expression: {
    $round: [{
      $subtract: [
        { $ifNull: ['$totalWeight', 0] },  // ← RECEIVED WEIGHT
        {
          $reduce: {
            input: { $filter: { input: '$movements', cond: { $eq: ['$$m.type', 'Issued'] } } },
            initialValue: 0,
            in: { $add: ['$$value', { $ifNull: ['$$this.weight', 0] }] }
          }
        }  // ← ISSUED WEIGHT
      ]
    }, 2]
  }
})
```

### Status: ✅ FORMULA IS CORRECT
- Uses `totalWeight` (original received)
- Subtracts sum of "Issued" movements
- Math is correct: 90 - 50 = 40

### Location 2: Sales Challan Controller
**File**: `server/src/controller/salesChallanController.js` (Line 523)

```javascript
lot.totalWeight = Math.max(0, (lot.totalWeight || 0) - weightToDeduct);
```

### Status: ❌ THIS IS THE PROBLEM
- Modifying `totalWeight` (should be immutable)
- This causes the report to show wrong "Weight In"
- Example:
  - Original: totalWeight = 90
  - After challan: totalWeight = 90 - 50 = 40
  - Report calculates: 40 - 50 = -10 ❌

---

## Summary of Issues Found

| Issue | Location | Status | Impact |
|-------|----------|--------|--------|
| Sales Challan modifies totalWeight | grnController.js:523 | ❌ BUG | Causes negative balance |
| reservedQuantity removed from definition | inventoryLot.definition.js | ❌ INCOMPLETE | Causes validation error |
| Report formula is correct | inventoryLot.definition.js | ✅ OK | No changes needed |
| GRN creates correct movements | grnController.js | ✅ OK | No changes needed |
| InventoryLot model is correct | InventoryLot.js | ✅ OK | No changes needed |

---

## Files That Need Modification

1. **`server/src/controller/salesChallanController.js`**
   - Line 523: REMOVE the line that modifies `totalWeight`
   - Keep only: `lot.currentQuantity -= qtyToDeduct;`

2. **`server/src/reports/report.definitions/inventoryLot.definition.js`**
   - Already removed `reservedQuantity` from fields (DONE)
   - Already removed from defaultFields (DONE)
   - Need to clear frontend cache/localStorage

3. **`client/src/components/reports/useReportBuilder.js`**
   - May need to filter out invalid fields when loading saved reports
   - Lines 77-80 already do this validation

---

## Files That Should NOT Be Modified

- `server/src/models/InventoryLot.js` - Keep as-is
- `server/src/controller/grnController.js` - Keep as-is
- `server/src/reports/report.definitions/inventoryLot.definition.js` (definition formulas) - Keep as-is
- `server/src/utils/reportPdfGenerator.js` - Keep as-is
- `server/src/reports/report.export.service.js` - Keep as-is

---

## Current Calculation Causing Negative Balance

### Example:
```
GRN received: 90 KG
Sales Challan issued: 50 KG

CURRENT (WRONG):
1. GRN creates InventoryLot with totalWeight = 90
2. Sales Challan runs: totalWeight = 90 - 50 = 40
3. Report calculates: 40 - 50 = -50 ❌

CORRECT:
1. GRN creates InventoryLot with totalWeight = 90
2. Sales Challan runs: currentQuantity = 2 - 1 = 1 (no change to totalWeight)
3. Report calculates: 90 - 50 = 40 ✅
```

---

## Recommended Production-Safe Solution

### Step 1: Fix Sales Challan Controller
**File**: `server/src/controller/salesChallanController.js` (Line 523)

**REMOVE THIS LINE**:
```javascript
lot.totalWeight = Math.max(0, (lot.totalWeight || 0) - weightToDeduct);
```

**REASON**: `totalWeight` is the original received weight and should be immutable. Only `currentQuantity` should be reduced.

### Step 2: Clear Frontend Cache
- Clear browser localStorage/sessionStorage
- Clear any saved report configurations that reference `reservedQuantity`

### Step 3: Verify Report Output
- GRN: 90 KG received
- Sales Challan: 50 KG issued
- Report should show: 90 - 50 = 40 KG balance ✅

---

## Does GRN/Sales Challan Core Logic Need Changes?

**GRN**: ✅ NO - Works correctly
**Sales Challan**: ❌ YES - One line needs removal (line 523)

---

## Approval Needed

Before proceeding with modifications:

1. ✅ Confirm the root cause is line 523 in salesChallanController.js
2. ✅ Confirm removing that line is safe
3. ✅ Confirm no other code depends on `totalWeight` being modified
4. ✅ Confirm report definition formulas are correct

**WAITING FOR APPROVAL TO PROCEED WITH CHANGES**
