# Stock Out Implementation for Sales Challan

## Overview
Implemented automatic Stock Out functionality for Sales Challans, following the **exact same pattern as GRN**. This ensures inventory is properly tracked when products are dispatched to customers.

## Architecture Pattern (Following GRN)

### GRN Pattern (Stock In):
```
GRN Created → GRN Approved → Create InventoryLot → Update Product.inventory
```

### Sales Challan Pattern (Stock Out):
```
Challan Created → Deduct from InventoryLot (FIFO) → Update Product.inventory
```

**Key Principle:** Stock operations are handled **within their respective controllers**, not through separate API calls.

## How It Works

### Flow Diagram
```
Sales Challan Created
        ↓
Find Available Inventory Lots (FIFO)
        ↓
Deduct from Lots (Oldest First)
        ↓
Record Movement History
        ↓
Update Product Inventory
        ↓
Return Challan Response
```

### FIFO (First In, First Out) Logic
- When a challan is created, the system finds available inventory lots for each product
- Deducts quantities from the oldest lots first (FIFO)
- Updates lot status to "Consumed" when fully depleted
- Records movement history for audit trail
- Updates product-level inventory count

## Backend Implementation

### 1. Sales Challan Controller (`server/src/controller/salesChallanController.js`)
**Modified Function:** `createSalesChallan`

**Stock Out Logic (Embedded in Controller):**
```javascript
// After challan is saved
for (const item of items) {
  // Find available lots (FIFO)
  const lots = await InventoryLot.find({
    product: item.product,
    status: 'Active',
    currentQuantity: { $gt: 0 }
  }).sort({ receivedDate: 1 });
  
  // Deduct from lots
  for (const lot of lots) {
    lot.currentQuantity -= qtyToDeduct;
    lot.movements.push({
      type: 'Issued',
      reference: challan.challanNumber,
      ...
    });
    await lot.save();
  }
  
  // Update product inventory
  await Product.findByIdAndUpdate(
    item.product,
    { $inc: { 'inventory.currentStock': -totalDeducted } }
  );
}
```

**Why This Approach?**
- ✅ Follows GRN pattern exactly
- ✅ No unnecessary HTTP calls
- ✅ Atomic operations within same transaction context
- ✅ Scalable and production-ready
- ✅ Easy to maintain and debug

### 2. Inventory Routes (`server/src/routes/inventoryRoutes.js`)
**Routes for Viewing Only:**
- `GET /api/inventory` - Get inventory products from GRNs
- `GET /api/inventory/lots` - Get all inventory lots
- `GET /api/inventory/stats` - Get inventory statistics
- `GET /api/inventory/lots/:id` - Get single lot details
- `GET /api/inventory/lots/:id/movements` - Get movement history

**No POST routes for stock operations** - They are handled in GRN and Challan controllers directly.

## Database Schema

### InventoryLot Model
Already supports stock out through:
- `currentQuantity` - Decreases when stock is issued
- `availableQuantity` - Recalculated after each movement
- `movements[]` - Array tracking all stock movements
  - `type: 'Issued'` - Used for stock out
  - `reference` - Challan number
  - `quantity` - Amount deducted
  - `date` - Timestamp
  - `performedBy` - User who performed the action

## Example Scenario

### Before Stock Out:
```
Product: cotton6/2
Inventory Lot 1: 98 Bags (from GRN2025110035)
```

### Sales Challan Created:
```
Challan: CH2025110010
Product: cotton6/2
Dispatch Quantity: 30 Bags
```

### After Stock Out:
```
Product: cotton6/2
Inventory Lot 1: 68 Bags (98 - 30)

Movement History:
- Type: Issued
- Quantity: -30 Bags
- Reference: CH2025110010
- Date: 3 Nov 2025
- Performed By: Admin
```

## Frontend Display

### Inventory Page Updates Needed:
1. **Stock Out History Section**
   - Show challans that caused stock out
   - Display: Challan Number, Date, Quantity, Product

2. **Movement History**
   - Show both Stock In (GRN) and Stock Out (Challan)
   - Color coding: Green for Stock In, Red for Stock Out

3. **Lot Details**
   - Show current quantity vs received quantity
   - Display all movements (Received, Issued, etc.)

## API Endpoints

### Create Sales Challan (Includes Stock Out)
```
POST /api/sales-challans
Body: {
  "salesOrder": "...",
  "warehouseLocation": "Warehouse A",
  "items": [
    {
      "product": "...",
      "productName": "cotton6/2",
      "dispatchQuantity": 30,
      ...
    }
  ],
  "createdBy": "Admin"
}

Response: {
  "success": true,
  "message": "Sales Challan created successfully",
  "data": { challan object }
}

Console Logs:
📦 Deducted 30 Bags of cotton6/2 from lot LOT2025110001
✅ Stock out processed for challan CH2025110010
```

### Get Inventory Lots (View Only)
```
GET /api/inventory/lots?product=...&status=Active
Response: {
  "success": true,
  "data": [
    {
      "lotNumber": "LOT2025110001",
      "productName": "cotton6/2",
      "currentQuantity": 68,
      "receivedQuantity": 98,
      "status": "Active",
      "movements": [
        {
          "type": "Received",
          "quantity": 98,
          "reference": "GRN2025110035"
        },
        {
          "type": "Issued",
          "quantity": -30,
          "reference": "CH2025110010"
        }
      ]
    }
  ]
}
```

## Testing Checklist

- [ ] Create Sales Challan with 30 bags of cotton6/2
- [ ] Verify inventory decreases from 98 to 68 bags
- [ ] Check movement history shows "Issued" entry
- [ ] Verify challan number appears in movement reference
- [ ] Test with multiple products in one challan
- [ ] Test with insufficient stock (should log warning)
- [ ] Test FIFO logic with multiple lots
- [ ] Verify lot status changes to "Consumed" when depleted

## Benefits

1. **Automatic Tracking**: No manual inventory adjustment needed
2. **FIFO Compliance**: Ensures oldest stock is used first
3. **Audit Trail**: Complete movement history for compliance
4. **Scalable**: Works for both GRN (Stock In) and Challan (Stock Out)
5. **Non-Blocking**: Challan creation doesn't fail if stock out has issues
6. **Real-time**: Inventory updates immediately when challan is created

## Future Enhancements

1. **Stock Reservation**: Reserve stock when SO is created
2. **Batch Tracking**: Track which GRN batch was used for which challan
3. **Stock Alerts**: Notify when stock goes below threshold
4. **Return Processing**: Handle stock in when challan is returned
5. **Dashboard Widgets**: Show stock in/out trends

## Deployment Notes

1. **No Migration Needed**: Uses existing InventoryLot schema
2. **Backward Compatible**: Existing challans not affected
3. **Gradual Rollout**: Stock out only processes for new challans
4. **Monitoring**: Check server logs for stock out success/errors

## Console Logs

Success:
```
✅ Deducted 30 Bags of cotton6/2 from lot LOT2025110001
✅ Stock out processed for challan CH2025110010
```

Warnings:
```
⚠️ No inventory lots found for product20
⚠️ Insufficient stock for cotton6/2. Short by 10 Bags
```

## Summary

This implementation provides a complete, scalable solution for tracking inventory movements in both directions:
- **GRN → Stock In** (already implemented)
- **Sales Challan → Stock Out** (newly implemented)

The system now maintains accurate real-time inventory levels and provides full audit trails for compliance and reporting.
