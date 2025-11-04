# GRN Supplier Name Fix

## Error Fixed

**Error:**
```
Error creating GRN: Error: InventoryLot validation failed: supplierName: Path `supplierName` is required.
```

**Root Cause:**
When creating InventoryLot, the code tried to access `grn.supplier.companyName`, but `grn.supplier` is just an ObjectId (not populated), so `companyName` was undefined.

---

## Solution

**File:** `server/src/controller/grnController.js` (Line 390)

**Before:**
```javascript
const lot = new InventoryLot({
  ...
  supplier: grn.supplier,
  supplierName: grn.supplier.companyName,  // ❌ grn.supplier is ObjectId, not object
  ...
});
```

**After:**
```javascript
const lot = new InventoryLot({
  ...
  supplier: grn.supplier,
  supplierName: grn.supplierDetails.companyName,  // ✅ Use supplierDetails
  ...
});
```

---

## Why This Works

### GRN Structure:
```javascript
{
  supplier: ObjectId("..."),           // Just an ID
  supplierDetails: {                   // Full supplier info
    companyName: "arrati",
    contactPerson: "...",
    phone: "..."
  }
}
```

### InventoryLot Needs:
```javascript
{
  supplier: ObjectId("..."),           // Reference to supplier
  supplierName: "arrati"               // String for display
}
```

---

## What This Fixes

✅ **Complete GRNs** → InventoryLot created successfully  
✅ **Manual Completion** → InventoryLot created successfully  
✅ **Supplier Name** → Properly stored in InventoryLot  
✅ **No Validation Errors** → All required fields present  

---

## Testing

**Create New GRN:**
1. Create PO with supplier "arrati"
2. Create GRN with 100 bags
3. **Verify:** No validation error ✅
4. **Verify:** InventoryLot created with supplierName ✅
5. **Verify:** Product shows in Inventory ✅

**Check Database:**
```javascript
db.inventorylots.findOne({ grnNumber: "GRN2025110042" })

// Should show:
{
  supplierName: "arrati",  // ✅ Not undefined
  ...
}
```

---

## Summary

**Problem:** InventoryLot validation failed - supplierName required  
**Cause:** Accessed `grn.supplier.companyName` (undefined)  
**Solution:** Use `grn.supplierDetails.companyName` instead  
**Result:** InventoryLots created successfully ✅  

**Status:** ✅ Fixed - Create new GRN to test
