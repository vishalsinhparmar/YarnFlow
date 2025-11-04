# Debug Guide: Stock Out Not Working

## Current Issue

New challan CH2025110029 for SO2025000034 (Delivered) is NOT creating stock out movement in inventory lots.

---

## Enhanced Logging Added

Added detailed console logs to track the entire stock out process:

### Logs to Check

```bash
# 1. Start of processing
🔄 Starting stock out processing for X item(s)...

# 2. Item details
📦 Processing item: product20
   Product ID: 673...
   SO Item ID: 673...
   Dispatch Qty: 10
   Weight: 1971.81

# 3. SO item found
   SO Item found: product20, Qty: 10

# 4. Completion check
   Total dispatched across all challans: 10
   SO item quantity: 10
   Mark as complete: false
   Is item complete: true

# 5. Processing decision
✅ SO item product20 is COMPLETE (10/10). Processing stock out for ALL challans...

# 6. Challan details
📦 Found 1 challan(s) for this item. Processing stock out...
   Challan numbers: CH2025110029

# 7. Duplicate check
   Looking for existing movement with reference: "CH2025110029"
   No existing movement found. Proceeding with stock deduction...

# 8. Deduction details
📊 Total to deduct: 10 Bags, 1971.81 kg

# 9. FIFO processing
📦 Deducted 10 Bags (1971.81 kg) of product20 from lot LOT...
⚖️  Weight saved in movement: 1971.81 kg
```

---

## How to Test

### Step 1: Check Server Logs

After creating challan CH2025110029, check the server console for the logs above.

**If you see:**
```bash
⏳ SO item not yet complete (X/10). Stock will NOT be deducted yet.
```
→ The SO is not marked as complete. Check why.

**If you see:**
```bash
⏭️ Stock already deducted for this SO item
```
→ A movement already exists. Check inventory lots.

**If you see:**
```bash
📦 Deducted 10 Bags...
```
→ Stock deduction worked! Check why it's not showing in UI.

### Step 2: Check Database Directly

```javascript
// Connect to MongoDB
use yarnflow

// Check the SO status
db.salesorders.findOne({ soNumber: "SO2025000034" })
// Look for: status, items[].quantity, items[].deliveredQuantity

// Check challans for this SO
db.saleschallans.find({ salesOrder: ObjectId("...") })
// Count total dispatchQuantity

// Check inventory lots for movements
db.inventorylots.find({ 
  product: ObjectId("..."),
  "movements.type": "Issued"
})
// Look for movements with CH2025110029
```

### Step 3: Manual Test

```bash
# 1. Create new SO
POST /api/sales-orders
{
  "customer": "...",
  "items": [{
    "product": "...",
    "quantity": 10,
    "weight": 1971.81
  }]
}

# 2. Create challan (full dispatch)
POST /api/sales-challans
{
  "salesOrder": "...",
  "items": [{
    "product": "...",
    "dispatchQuantity": 10,
    "weight": 1971.81
  }]
}

# 3. Check server logs for detailed output

# 4. Check inventory
GET /api/inventory/product/{productId}
```

---

## Possible Issues

### Issue 1: SO Not Marked as Delivered

**Symptom:** Logs show "not yet complete"

**Cause:** `updateDispatchStatus` not working correctly

**Fix:** Check SalesOrder model's `updateDispatchStatus` method

### Issue 2: Duplicate Movement Found

**Symptom:** Logs show "already deducted"

**Cause:** Old movement exists with same challan number

**Fix:** Run migration script to clean old movements

### Issue 3: FIFO Finding No Lots

**Symptom:** Logs show "No inventory lots found"

**Cause:** No active inventory lots for the product

**Fix:** Create GRN to add inventory

### Issue 4: Movement Created But Not Showing

**Symptom:** Logs show "Deducted..." but UI doesn't show it

**Cause:** Frontend not refreshing or API not returning movements

**Fix:** Check inventory controller aggregation

---

## Quick Fixes

### Fix 1: Restart Server

```bash
# Sometimes schema changes need restart
pm2 restart yarnflow-server
```

### Fix 2: Clear Old Movements

```bash
# Run migration script
node server/src/scripts/fixOldChallanMovements.js
```

### Fix 3: Force Completion

```javascript
// In CreateChallanModal, add markAsComplete checkbox
<input 
  type="checkbox" 
  checked={item.markAsComplete}
  onChange={(e) => handleItemChange(index, 'markAsComplete', e.target.checked)}
/>
```

---

## Expected Behavior

### Scenario: Single Challan (Full Dispatch)

```
SO: 10 bags
Challan 1: 10 bags

Logs:
✅ SO item is COMPLETE (10/10)
📦 Found 1 challan(s)
   Challan numbers: CH2025110029
   No existing movement found
📊 Total to deduct: 10 Bags, 1971.81 kg
📦 Deducted 10 Bags from lot LOT...

Result:
✅ Movement created in inventory lot
✅ Stock out shows -10 bags
✅ Weight shows -1971.81 kg
```

### Scenario: Multiple Challans

```
SO: 10 bags

Challan 1: 5 bags
Logs:
⏳ SO item not yet complete (5/10)
Result: No stock deduction

Challan 2: 5 bags
Logs:
✅ SO item is COMPLETE (10/10)
📦 Found 2 challan(s)
   Challan numbers: CH..., CH...
📊 Total to deduct: 10 Bags
📦 Deducted 10 Bags from lot LOT...

Result:
✅ Movement created for BOTH challans
✅ Stock out shows -10 bags
```

---

## Debugging Checklist

- [ ] Server logs show "🔄 Starting stock out processing"
- [ ] Logs show "📦 Processing item: product20"
- [ ] Logs show "SO Item found"
- [ ] Logs show "Is item complete: true"
- [ ] Logs show "✅ SO item is COMPLETE"
- [ ] Logs show "📦 Found X challan(s)"
- [ ] Logs show "No existing movement found"
- [ ] Logs show "📊 Total to deduct"
- [ ] Logs show "📦 Deducted X Bags"
- [ ] Database has new movement in inventory lot
- [ ] UI shows new stock out movement

---

## Next Steps

1. **Create new challan** for SO2025000034
2. **Check server console** for detailed logs
3. **Share the logs** to identify where it's failing
4. **Check database** to verify movement created
5. **Refresh inventory page** to see if it shows

---

## Status

✅ Enhanced logging added
✅ Ready to debug with detailed output
⏳ Waiting for test results with logs
