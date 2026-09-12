# PHASE 11A: GAZE 904 × 4 Fallback Fix

**Date**: 2026-09-05  
**Status**: ✅ **COMPLETE - ALL TESTS PASSING**

---

## ISSUE IDENTIFIED

**Product**: GAZE 904 × 4  
**Expected weights**: [50, 30, 32]  
**Previously received**: 2 bags (50 + 30 = 80 kg)  
**Remaining**: 1 bag / 32 kg

**Problem**: GRN form was prefilling with **50 kg** (the first weight) instead of **32 kg** (the remaining expected weight).

**Root Cause**: The PO was created **BEFORE Phase 11A fix was deployed**, so the backend doesn't provide `remainingExpectedUnitWeights`. The frontend had no fallback calculation, so it defaulted to an empty array.

---

## SOLUTION IMPLEMENTED

### Frontend Fallback Logic

**File**: `client/src/components/GRN/GRNForm.jsx` (Lines 149-161)

**Added fallback calculation**:
```javascript
// FALLBACK: If backend doesn't provide remainingExpectedUnitWeights
// (for POs created before Phase 11A fix), calculate locally
if (remainingExpectedUnitWeights.length === 0 && orderedSubProductWeights.length > 0) {
  const startIdx = receivedQty;
  const endIdx = receivedQty + pendingQty;
  remainingExpectedUnitWeights = orderedSubProductWeights.slice(startIdx, endIdx);
}
```

**Logic**:
- If backend provides `remainingExpectedUnitWeights`, use it ✅
- If backend doesn't provide it (legacy POs), calculate locally using correct offset ✅
- Never reuse previously received weights ✅

---

## SCENARIO VERIFICATION: GAZE 904 × 4

### Before Fix (BUGGY)
```
PO: gaze 904 × 4
  Expected weights: [50, 30, 32]
  Previously received: 2 bags (50 + 30)
  Remaining: 1 bag / 32 kg

GRN Form:
  Exact unit weights: [50] ❌ (WRONG - first weight, not remaining)
```

### After Fix (CORRECT)
```
PO: gaze 904 × 4
  Expected weights: [50, 30, 32]
  Previously received: 2 bags (50 + 30)
  Remaining: 1 bag / 32 kg

GRN Form:
  Exact unit weights: [32] ✅ (CORRECT - remaining expected weight)
```

---

## FALLBACK CALCULATION LOGIC

For any PO with sub-product weights:

```
remainingExpectedWeights = orderedSubProductWeights.slice(
  previouslyReceivedQuantity,
  previouslyReceivedQuantity + pendingQuantity
)
```

**Examples**:

1. **GAZE 999 × 8**:
   - Ordered: [90, 33]
   - Previously received: 1 bag
   - Pending: 1 bag
   - Remaining: [90, 33].slice(1, 2) = [33] ✅

2. **GAZE 904 × 4**:
   - Ordered: [50, 30, 32]
   - Previously received: 2 bags
   - Pending: 1 bag
   - Remaining: [50, 30, 32].slice(2, 3) = [32] ✅

3. **GAZE 904 × 3**:
   - Ordered: [30, 33]
   - Previously received: 2 bags
   - Pending: 0 bags
   - Remaining: [30, 33].slice(2, 2) = [] ✅

---

## TESTS - ALL PASSING ✅

**File**: `server/tests/phase11a-fallback-test.js`

**Test Results**: 7 tests passing

```
PHASE 11A: Frontend Fallback Calculation
  Fallback calculation for legacy POs
    ✓ should calculate remaining weights for gaze 904 × 4
    ✓ should calculate remaining weights for GAZE 999 × 8
    ✓ should return empty array when all units received
    ✓ should return all weights when no receipt exists
    ✓ should handle partial pending quantity
    ✓ should never return previously received weights
  Fallback with empty orderedSubProductWeights
    ✓ should return empty array when no sub-product weights

7 passing ✅
```

---

## COMBINED TEST RESULTS

**Total Phase 11A Tests**: 25 passing ✅

- **Unit tests** (phase11a-unit-weight-fix.test.js): 18 passing
- **Fallback tests** (phase11a-fallback-test.js): 7 passing

---

## FILES CHANGED

| File | Change | Type |
|------|--------|------|
| `client/src/components/GRN/GRNForm.jsx` | Added fallback calculation | Frontend fix |
| `server/tests/phase11a-fallback-test.js` | NEW - 7 regression tests | Test coverage |

---

## BACKWARD COMPATIBILITY

✅ **Fully backward compatible**:
- New POs (with backend-provided `remainingExpectedUnitWeights`): Use backend data
- Legacy POs (without backend data): Use fallback calculation
- Both produce identical results

---

## DEPLOYMENT IMPACT

- ✅ No backend changes required
- ✅ Frontend fallback handles both new and legacy POs
- ✅ Mobile app already calculates correctly (no changes needed)
- ✅ All existing GRNs unaffected
- ✅ All existing POs unaffected

---

## VERIFICATION CHECKLIST

- ✅ GAZE 999 × 8: Shows 33 kg (not 90 kg)
- ✅ GAZE 904 × 4: Shows 32 kg (not 50 kg)
- ✅ GAZE 904 × 3: Shows empty (all received)
- ✅ Fallback calculation correct for all scenarios
- ✅ Previously received weights never reused
- ✅ All 25 Phase 11A tests passing
- ✅ Backward compatible with legacy POs

---

## CONCLUSION

**Status**: ✅ **PRODUCTION-READY**

The fallback fix ensures that both new POs (with backend-provided remaining weights) and legacy POs (without backend data) display the correct expected unit weights in the GRN form.

The issue with GAZE 904 × 4 showing 50 kg instead of 32 kg is now resolved.

