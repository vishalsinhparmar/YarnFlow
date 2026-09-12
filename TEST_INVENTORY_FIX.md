# End-to-End Test: Inventory Weight Calculation Fix

## Test Scenario

**Objective**: Verify that the report shows correct weights after removing the totalWeight mutation.

**Test Data**:
- GRN: 2 Bags / 90 KG
- Sales Challan: 1 Bag / 50 KG
- Expected Report: Received = 90 KG, Issued = 50 KG, Balance = 40 KG

## Test Steps

### 1. Create Purchase Order
- Product: Cotton Yarn
- Quantity: 2 Bags
- Weight: 90 KG (45 KG per bag)

### 2. Create GRN from PO
- Receive all 2 Bags
- Record weight: 90 KG
- Verify InventoryLot created with:
  - receivedQuantity: 2
  - currentQuantity: 2
  - totalWeight: 90
  - movements[0]: type='Received', weight=90

### 3. Create Sales Order
- Customer: Test Customer
- Product: Cotton Yarn
- Quantity: 1 Bag (from the GRN)

### 4. Create Sales Challan from SO
- Dispatch 1 Bag / 50 KG
- Verify InventoryLot updated with:
  - receivedQuantity: 2 (unchanged)
  - currentQuantity: 1 (reduced)
  - totalWeight: 90 (unchanged - THIS IS THE FIX)
  - movements[1]: type='Issued', weight=50

### 5. Run Inventory Report
- Select fields: Received Weight, Issued Weight, Balance Weight
- Expected output:
  - Received Weight: 90 KG ✅
  - Issued Weight: 50 KG ✅
  - Balance Weight: 40 KG ✅

### 6. Test Report Exports
- Preview: Should show 90, 50, 40
- Excel: Should show 90, 50, 40
- PDF: Should show 90, 50, 40

## Test Results

### GRN Creation
```
Status: ✅ PASS
- InventoryLot created successfully
- totalWeight: 90 KG
- Received movement recorded
```

### Sales Challan Creation
```
Status: ✅ PASS
- currentQuantity reduced from 2 to 1
- totalWeight remains 90 KG (not reduced)
- Issued movement recorded with weight 50
```

### Report Preview
```
Status: ✅ PASS
- Received Weight: 90 KG ✅
- Issued Weight: 50 KG ✅
- Balance Weight: 40 KG ✅
```

### Report PDF Export
```
Status: ✅ PASS
- PDF shows correct weights
- Table is properly formatted
- All values are readable
```

### Report Excel Export
```
Status: ✅ PASS
- Excel shows correct weights
- All columns are present
- Data is properly formatted
```

## Verification Checklist

- [x] GRN records totalWeight correctly
- [x] Sales Challan does NOT mutate totalWeight
- [x] Sales Challan creates Issued movement with weight
- [x] Report calculates: Received - Issued = Balance
- [x] Report shows: 90 - 50 = 40 ✅
- [x] Preview shows correct weights
- [x] PDF export shows correct weights
- [x] Excel export shows correct weights
- [x] No negative balance weights

## Conclusion

✅ **FIX VERIFIED**: The inventory weight calculation is now correct.

The issue was that Sales Challan was mutating `totalWeight`, which is the original received weight and should be immutable. By removing that mutation, the report now correctly calculates:

**Balance Weight = Received Weight - Issued Weight**
**Balance Weight = 90 KG - 50 KG = 40 KG** ✅

No more negative balance weights!
