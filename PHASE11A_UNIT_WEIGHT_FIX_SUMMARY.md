# PHASE 11A: UNIT WEIGHT DATA FIX - SUMMARY

**Date**: 2026-09-05  
**Status**: ✅ **COMPLETE - ALL TESTS PASSING**

---

## PROBLEM IDENTIFIED

When creating a new GRN for a partially received PO, the frontend was incorrectly prefilling the expected unit weights with previously received weights instead of remaining expected weights.

### Example Bug

**PO GAZE 999 × 8**:
- Ordered quantity: 2 bags
- Expected unit weights: [90 kg, 33 kg]

**Previous GRN (GRN/011)**:
- Received quantity: 1 bag
- Actual received weight: 90 kg

**Next GRN Form (GRN/012) - BUGGY BEHAVIOR**:
- PO Balance: 1 bag / 33 kg ✅ (correct)
- Exact unit weight prefill: 90 kg ❌ (WRONG - this is the previously received weight!)
- Should be: 33 kg ✅ (the remaining expected weight)

---

## ROOT CAUSE

**File**: `client/src/components/GRN/GRNForm.jsx`  
**Lines**: 150-154

```javascript
// BUGGY CODE
const orderedSubProductWeights = item.subProductWeights || [];
const receiveQty = pendingQty > 0 ? pendingQty : 0;
const defaultReceivedWeights = orderedSubProductWeights.length > 0
  ? orderedSubProductWeights.slice(0, receiveQty)  // ❌ WRONG!
  : [];
```

The code was slicing from index 0 (the start), which returned the previously received weights instead of the remaining expected weights.

**Example**:
- `orderedSubProductWeights = [90, 33]`
- `receivedQty = 1` (already received)
- `pendingQty = 1` (still pending)
- `receiveQty = 1`
- `orderedSubProductWeights.slice(0, 1)` = `[90]` ❌ (wrong - this is already received)
- Should be: `orderedSubProductWeights.slice(1, 2)` = `[33]` ✅ (correct - remaining expected)

---

## SOLUTION IMPLEMENTED

### 1. Backend Enhancement

**File**: `server/src/utils/grnValidation.js`

Added new helper function:

```javascript
export const getRemainingExpectedUnitWeights = (poItem, pendingQuantity) => {
  const orderedSubProductWeights = Array.isArray(poItem.subProductWeights)
    ? poItem.subProductWeights
    : [];
  
  if (orderedSubProductWeights.length === 0) {
    return [];
  }
  
  const previouslyReceived = toNumber(poItem.receivedQuantity || 0);
  const startIndex = previouslyReceived;
  const endIndex = previouslyReceived + pendingQuantity;
  
  // Return only the remaining expected weights
  return orderedSubProductWeights.slice(startIndex, endIndex);
};
```

**File**: `server/src/controller/purchaseOrderController.js`

Enhanced `getPurchaseOrderById` endpoint to calculate and return remaining expected unit weights:

```javascript
// PHASE 11A FIX: Calculate remaining expected unit weights for GRN form
const enrichedItems = purchaseOrder.items.map(item => {
  const pendingQuantity = Math.max(0, item.quantity - (item.receivedQuantity || 0));
  const remainingExpectedUnitWeights = getRemainingExpectedUnitWeights(item, pendingQuantity);
  
  return {
    ...item.toObject(),
    remainingExpectedUnitWeights,
    pendingQuantity
  };
});
```

### 2. Frontend Fix

**File**: `client/src/components/GRN/GRNForm.jsx`

Updated to use backend-provided remaining expected weights:

```javascript
// PHASE 11A FIX: Use remaining expected unit weights from backend
const remainingExpectedUnitWeights = item.remainingExpectedUnitWeights || [];
const receiveQty = pendingQty > 0 ? pendingQty : 0;
const defaultReceivedWeights = remainingExpectedUnitWeights.length > 0
  ? remainingExpectedUnitWeights.slice(0, receiveQty)
  : [];
```

### 3. API Contract

Both Web and Mobile apps use the same `getPurchaseOrderById` endpoint:
- **Web**: `client/src/services/purchaseOrderAPI.js` (line 19-22)
- **Mobile**: `Yarnflow_app/services/purchaseOrderAPI.js` (line 19-22)

Both will automatically receive the enhanced data with `remainingExpectedUnitWeights`.

---

## REGRESSION TESTS

**File**: `server/tests/phase11a-unit-weight-fix.test.js`

Created comprehensive test suite with 18 test cases:

### Test Coverage

✅ **Basic Functionality** (10 tests)
- Remaining expected weights with partial receipt
- All expected weights when no receipt exists
- Empty array when all units received
- Multiple partial receipts
- Undefined/empty subProductWeights
- Partial pending quantity
- Never returning previously received weights
- Numeric string weights
- Mixed numeric and string weights

✅ **Regression Tests** (3 tests)
- GAZE 999 × 8 scenario (the exact bug case)
- Multi-unit scenarios
- Varying weights in sequence

✅ **Edge Cases** (5 tests)
- Zero receivedQuantity
- Null receivedQuantity
- Undefined receivedQuantity
- Very large weight values
- Very small weight values

### Test Results

```
PHASE 11A: Unit Weight Data Fix
  getRemainingExpectedUnitWeights
    ✓ should return remaining expected weights when partial receipt exists
    ✓ should return all expected weights when no receipt exists
    ✓ should return empty array when all units received
    ✓ should handle multiple partial receipts correctly
    ✓ should return empty array when no subProductWeights defined
    ✓ should handle undefined subProductWeights
    ✓ should handle partial pending quantity correctly
    ✓ should never return previously received weights
    ✓ should handle numeric string weights
    ✓ should handle mixed numeric and string weights
  Regression: Previously received weights should not appear in remaining
    ✓ GAZE 999 × 8 scenario: 90kg already received, 33kg remaining
    ✓ should not reuse first weight in multi-unit scenario
    ✓ should correctly handle varying weights in sequence
  Edge cases
    ✓ should handle zero receivedQuantity
    ✓ should handle null receivedQuantity
    ✓ should handle undefined receivedQuantity
    ✓ should handle very large weight values
    ✓ should handle very small weight values

18 passing
```

---

## FILES CHANGED

### Backend
1. **server/src/utils/grnValidation.js**
   - Added `getRemainingExpectedUnitWeights()` function
   - Updated exports

2. **server/src/controller/purchaseOrderController.js**
   - Added import for `getRemainingExpectedUnitWeights`
   - Enhanced `getPurchaseOrderById()` to calculate and return remaining expected weights

### Frontend
1. **client/src/components/GRN/GRNForm.jsx**
   - Updated unit weight prefill logic to use backend-provided remaining expected weights

### Tests
1. **server/tests/phase11a-unit-weight-fix.test.js** (NEW)
   - 18 comprehensive regression tests

---

## VERIFICATION

### ✅ Correct Behavior After Fix

**PO GAZE 999 × 8**:
- Ordered quantity: 2 bags
- Expected unit weights: [90 kg, 33 kg]

**Previous GRN (GRN/011)**:
- Received quantity: 1 bag
- Actual received weight: 90 kg

**Next GRN Form (GRN/012) - FIXED BEHAVIOR**:
- PO Balance: 1 bag / 33 kg ✅
- Exact unit weight prefill: 33 kg ✅ (correct remaining expected weight)
- User can enter actual weight: 44 kg (within tolerance) ✅

### ✅ API Contract

Both Web and Mobile receive:
```json
{
  "items": [
    {
      "quantity": 2,
      "receivedQuantity": 1,
      "subProductWeights": [90, 33],
      "remainingExpectedUnitWeights": [33],  // NEW - calculated by backend
      "pendingQuantity": 1                   // NEW - calculated by backend
    }
  ]
}
```

### ✅ Weight Tolerance Rule

The existing weight tolerance validation remains unchanged:
- Actual received weight can differ from expected weight
- Tolerance is enforced by existing validation logic
- Example: Expected 33 kg, actual 44 kg is acceptable if within tolerance

---

## IMPORTANT NOTES

1. **No PO modifications**: PO records are not modified
2. **No historical GRN changes**: Existing GRNs are not affected
3. **No tolerance rule changes**: Weight tolerance validation unchanged
4. **No inventory logic changes**: Inventory creation logic unchanged
5. **No approval workflow**: No approval workflow introduced
6. **Backward compatible**: Works with both new and old GRNs

---

## DEPLOYMENT CHECKLIST

- [x] Backend helper function implemented
- [x] Backend API endpoint enhanced
- [x] Frontend updated to use new data
- [x] Regression tests created and passing
- [x] API contract verified for Web and Mobile
- [x] No breaking changes
- [x] Ready for production deployment

---

## CONCLUSION

The unit weight data fix is complete and verified. The issue where previously received unit weights were incorrectly prefilled in partial GRN receipts has been resolved. All 18 regression tests pass, and the fix is backward compatible with both Web and Mobile clients.

