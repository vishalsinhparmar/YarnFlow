# Run Warehouse Fix Scripts ✅

## Scripts Fixed

The scripts have been updated to properly import Mongoose models.

## How to Run

### Step 1: Check Warehouse Data

```bash
cd C:\Users\Vishal\YarnFlow\server
node scripts/checkWarehouseData.js
```

This will show:
- ✅ All warehouses in database
- ✅ How many inventory lots have warehouse data
- ✅ All warehouse values
- ⚠️ How many lots are missing warehouse

### Step 2: Populate Warehouse Data (If Needed)

If the diagnostic shows missing warehouse data, run:

```bash
cd C:\Users\Vishal\YarnFlow\server
node scripts/populateWarehouseData.js
```

This will:
- ✅ Create default warehouse if needed
- ✅ Update all empty warehouse fields
- ✅ Verify the data

### Step 3: Restart Server

```bash
npm run dev
```

### Step 4: Test Filter

1. Clear browser cache (F12 → Application → Clear Storage)
2. Hard refresh (Ctrl+Shift+R)
3. Open Inventory Lots report
4. Add warehouse filter
5. Should see results!

## Expected Output

### checkWarehouseData.js Output:
```
✅ Connected to MongoDB
📦 Checking WarehouseLocation collection...
Found 5 warehouses:
  - Godown - Maryadpatti (code: GDN-MAR, type: Godown)
  - Shop - Main (code: SHP-MAIN, type: Shop)
  - ...

📦 Checking InventoryLot warehouse field...
Lots with warehouse: 150 / 200

🔍 Checking for lots with warehouse: "Godown - Maryadpatti"
Found 45 lots with warehouse "Godown - Maryadpatti"

📊 All warehouse values in database:
  - "Godown - Maryadpatti"
  - "Shop - Main"
  - ...

✅ Check complete!
```

### populateWarehouseData.js Output:
```
✅ Connected to MongoDB
📦 Found 5 warehouses

⚠️  Found 50 lots without warehouse data

🔄 Populating warehouse data for empty lots...
Using warehouse: "Godown - Maryadpatti"
✅ Updated 30 lots without warehouse field
✅ Updated 15 lots with null warehouse
✅ Updated 5 lots with empty warehouse

✅ Verification:
Lots with warehouse: 200 / 200

Warehouse values in inventory lots:
  - "Godown - Maryadpatti"

✅ Population complete!
```

## What Was Fixed

The scripts now properly import Mongoose models before using them. This ensures:
- ✅ Models are registered with Mongoose
- ✅ Schemas are available
- ✅ Database queries work correctly

## Complete Workflow

```
1. Run: node scripts/checkWarehouseData.js
   ↓
2. Check output - is warehouse data missing?
   ↓
3. If YES: Run: node scripts/populateWarehouseData.js
   ↓
4. Restart server: npm run dev
   ↓
5. Clear browser cache & hard refresh
   ↓
6. Test warehouse filter
   ↓
✅ Filter works!
```

## Troubleshooting

**Issue**: Script still fails
**Solution**: Make sure you're in the server directory:
```bash
cd C:\Users\Vishal\YarnFlow\server
```

**Issue**: Still 0 results after running script
**Solution**:
1. Verify script ran successfully
2. Check output shows warehouse data was populated
3. Restart server
4. Clear browser cache again
5. Hard refresh page

## Summary

✅ Scripts are now fixed
✅ Ready to run
✅ Will populate warehouse data
✅ Filter will work after running scripts
