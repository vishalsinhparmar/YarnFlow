# Backend Changes Reference

This document summarizes recent backend changes related to sales order / sales challan inventory handling and weight validation.

## Files Modified

### 1. `src/controller/salesOrderController.js`
- **What changed:** Inventory validation in `createSalesOrder` now groups items by `product + sub-product` before checking availability.
- **Why:** Previously each row was validated independently, so two rows for the same product/sub-product could together exceed available stock or weight.
- **Behavior:**
  - Rejects the order if total requested quantity > available quantity.
  - Rejects the order if total requested weight > available weight (proportional to remaining lot quantity).
  - Error responses include the available vs requested amounts.

### 2. `src/controller/salesChallanController.js`
- **Multi-sub-product deduction fix:** When a sales order item is completed and stock is deducted, the inventory movement reference now includes the SO item id:
  ```
  <challan numbers>|SOItem:<salesOrderItemId>
  ```
  This prevents multiple sub-products of the same product from colliding on the same `product + challan` reference and being skipped.
- **Inventory guards before deduction:** Before deducting stock via FIFO, the controller now verifies:
  - Total quantity to deduct ≤ available lot quantity.
  - Total weight to deduct ≤ available lot weight (proportional to remaining quantity).
  - If either check fails, the transaction is aborted and a `400` error is returned.
- **Movement storage:** The same scoped reference used for the duplicate check is now stored in the `InventoryLot.movements.reference` field so future checks can detect it correctly.

## Notes
- The SC reference change is forward-looking. Existing movements created before this change used the old reference format (`<challan numbers>` only). If historical data was affected by the multi-sub-product bug, it may need manual reconciliation.
- All validation errors are returned as `400` client errors so the frontend/mobile apps can display them directly.
