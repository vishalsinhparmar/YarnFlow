# Inventory Weight Calculation - Audit and Fix

## Problem Statement

The inventory report shows **negative balance weights** because:
- WEIGHT IN (KG) = 0 (should be 90)
- WEIGHT OUT (KG) = 50 (correct)
- WEIGHT BALANCE (KG) = -50 (should be 40)

**Root Cause**: GRN is not properly recording the received weight in InventoryLot.totalWeight

## Audit Results

### ✅ What's Working Correctly

1. **InventoryLot Model** (Line 104-108)
   - Has `totalWeight` field to store received weight
   - Has `movements` array to track all movements
   - Correctly calculates `availableQuantity = currentQuantity - reservedQuantity`

2. **GRN Controller** (Lines 470-552)
   - Creates "Received" movements with weight ✅
   - Sets `totalWeight: item.receivedWeight || 0` ✅
   - Preserves `receivedQuantity` ✅

3. **Sales Challan Controller** (Lines 526-534)
   - Creates "Issued" movements with weight ✅
   - Updates `currentQuantity` correctly ✅
   - Does NOT overwrite `receivedQuantity` ✅

4. **Report Definition** (inventoryLot.definition.js)
   - `calculatedWeightOut` = sum of all "Issued" movements ✅
   - `calculatedWeightBalance` = totalWeight - calculatedWeightOut ✅
   - Formulas are mathematically correct ✅

### ❌ What's Broken

**GRN Weight Recording**:
- `item.receivedWeight` is 0 or missing when InventoryLot is created
- This causes `totalWeight: 0` in the InventoryLot
- Report then calculates: 0 - 50 = -50 (correct math, wrong data)

## Solution

### Step 1: Verify GRN Form Sends Weight

The GRN form must send `receivedWeight` for each item. Check:
1. GRN form captures weight per item
2. Weight is sent in the request payload
3. GRN controller receives and uses it

### Step 2: Ensure InventoryLot Records Received Weight

When GRN creates InventoryLot:
```javascript
const lot = new InventoryLot({
  // ... other fields
  totalWeight: item.receivedWeight || 0,  // ← This must be > 0
  movements: [{
    type: 'Received',
    quantity: item.receivedQuantity,
    weight: item.receivedWeight || 0,    // ← This must be > 0
    // ...
  }]
});
```

### Step 3: Fix Report Calculations

The report calculations are already correct:

**Received Weight** = `totalWeight` (from GRN)
**Issued Weight** = Sum of all "Issued" movements
**Balance Weight** = Received Weight - Issued Weight

Example with correct data:
```
GRN received = 90 KG → InventoryLot.totalWeight = 90
Sales Challan issued = 50 KG → Movement.weight = 50
Report shows:
  Received Weight = 90 KG ✅
  Issued Weight = 50 KG ✅
  Balance Weight = 40 KG ✅
```

## Implementation Plan

### 1. Audit GRN Form Data Flow

**Check**: Does GRN form send weight for each item?

Location: `client/src/components/GRN/GRNForm.jsx` or similar
- Verify form captures `receivedWeight` per item
- Verify weight is included in request payload

### 2. Verify GRN Controller Receives Weight

Location: `server/src/controller/grnController.js` (Lines 220-275)
- Check that `item.receivedWeight` is populated from request
- Verify calculation of `receivedWeight` from sub-product weights if applicable

### 3. Confirm InventoryLot Creation Uses Weight

Location: `server/src/controller/grnController.js` (Lines 508-552)
- Verify `totalWeight: item.receivedWeight || 0` is set correctly
- Verify movement record includes weight

### 4. Remove RESERVED QTY from Reports

Location: `server/src/reports/report.definitions/inventoryLot.definition.js`
- Remove line 48: `field({ key: 'reservedQuantity', label: 'Reserved Qty', ... })`
- Keep `reservedQuantity` in InventoryLot model (needed for inventory management)
- Keep `availableQuantity` in reports (calculated as currentQuantity - reservedQuantity)

### 5. Verify Report Calculations

The report formulas are correct. No changes needed if GRN sends weight properly.

## Expected Report Output (After Fix)

| Lot | Product | Received Weight | Issued Weight | Balance Weight | Current Qty |
|-----|---------|-----------------|---------------|----------------|------------|
| LOT1 | Yarn X | 90 KG | 50 KG | 40 KG | 40 Bags |
| LOT2 | Yarn Y | 120 KG | 0 KG | 120 KG | 5 Bags |
| LOT3 | Yarn Z | 200 KG | 200 KG | 0 KG | 0 Bags |

**Never negative balance weights!**

## Key Principles

1. **Received Weight** = Original weight from GRN (immutable)
2. **Issued Weight** = Sum of all Sales Challan movements
3. **Balance Weight** = Received Weight - Issued Weight
4. **Current Quantity** = Received Quantity - Issued Quantity
5. **No Math.abs()** - Never hide negative values
6. **Movement History** - Always track source of truth

## Files to Check/Modify

1. **client/src/components/GRN/GRNForm.jsx**
   - Verify weight is captured and sent

2. **server/src/controller/grnController.js** (Lines 220-275, 508-552)
   - Verify receivedWeight is used correctly
   - Verify totalWeight is set from receivedWeight

3. **server/src/reports/report.definitions/inventoryLot.definition.js**
   - Remove reservedQuantity field from report
   - Keep availableQuantity (calculated field)

4. **server/src/models/InventoryLot.js**
   - Keep reservedQuantity in model (for inventory management)
   - No changes needed

## Testing Checklist

- [ ] GRN form captures weight per item
- [ ] GRN request includes receivedWeight
- [ ] GRN controller receives and logs receivedWeight
- [ ] InventoryLot.totalWeight is set correctly
- [ ] InventoryLot.movements[0].weight is set correctly
- [ ] Report shows correct Received Weight
- [ ] Report shows correct Issued Weight
- [ ] Report shows correct Balance Weight (never negative)
- [ ] Reserved Qty removed from report
- [ ] Available Qty still shows in report

## Conclusion

The inventory system is architecturally sound. The issue is that GRN is not properly recording the received weight. Once GRN sends and records the weight correctly, the report calculations will automatically show the correct balance weights.

**Do NOT:**
- Use Math.abs() to hide negative values
- Treat currentQuantity as Received Weight
- Redesign the inventory system

**DO:**
- Ensure GRN records receivedWeight properly
- Use movement history as source of truth
- Calculate balance as: Received Weight - Issued Weight
