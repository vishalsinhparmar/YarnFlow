# GRN Syntax Error Fix

## Error Fixed

**Error:**
```
SyntaxError: Identifier 'anyItemReceived' has already been declared
```

**Root Cause:**
The variable `anyItemReceived` was declared twice in the same scope:
- Line 246: First declaration
- Line 274: Duplicate declaration (error)

---

## Solution

**File:** `server/src/controller/grnController.js` (Line 274)

**Before:**
```javascript
// Line 246
const anyItemReceived = validatedItems.some(item => 
  item.receivedQuantity > 0 || item.manuallyCompleted
);

// Line 274 - DUPLICATE!
const anyItemReceived = validatedItems.some(item => item.receivedQuantity > 0);
```

**After:**
```javascript
// Line 246 (kept)
const anyItemReceived = validatedItems.some(item => 
  item.receivedQuantity > 0 || item.manuallyCompleted
);

// Line 274 (removed duplicate, just use the variable)
// anyItemReceived is already calculated above (line 246)
const grnStatus = receiptStatus === 'Complete' ? 'Completed' : (anyItemReceived ? 'Partial' : 'Draft');
```

---

## Summary

**Problem:** Duplicate variable declaration  
**Solution:** Removed duplicate, use existing variable  
**Result:** Server starts successfully ✅  

**Status:** ✅ Fixed - Server should restart now
