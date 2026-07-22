# Product & Sub Products — YarnFlow

## Overview

```
Category  →  Product  →  Sub Products
Plastic Roll-LD  →  500 Gaze  →  [7, 8, 9, 10, 11, 12]
```

Sub Products are **simple size/inch values** stored directly on the Product document as a string array. No separate collection, no complex schema.

---

## Data Model

```js
// Product (MongoDB)
{
  productName: "500 Gaze",
  category: ObjectId,          // ref Category
  description: "...",
  status: "Active",
  subProducts: ["7", "8", "9", "10", "11", "12"],  // ← stored here
  createdAt, updatedAt
}
```

---

## How to Use

### Create / Edit a Product
1. Go to **Master Data → Products → Add Product**
2. Fill in Product Name and Category
3. In the **Sub Products** field — type a size and press **Enter** or **comma** to add it as a chip
4. Click **×** on any chip to remove it
5. Save — sub products are stored with the product

### In Purchase Orders (future)
- Select a Product from the dropdown
- A second dropdown will show `subProducts` from the selected product
- User picks the required size → processes the order

---

## Files Changed

| File | Change |
|---|---|
| `server/src/models/Product.js` | Added `subProducts: [String]` field |
| `server/src/controller/masterDataController.js` | Removed variant logic; clean product CRUD |
| `server/src/routes/masterDataRoutes.js` | Removed variant routes |
| `server/src/validators/masterDataValidator.js` | Removed variant validators |
| `client/src/components/masterdata/Products/ProductForm.jsx` | Added chip-tag input for sub products |
| `client/src/components/masterdata/Products/ProductList.jsx` | Shows sub product pills in list |
| `client/src/services/masterDataAPI.js` | Removed variantAPI |
| `client/src/pages/ProductsPage.jsx` | Cleaned up |

## Files Removed
- `server/src/models/ProductVariant.js` — deleted (not needed)
- `client/src/components/masterdata/Products/ProductVariantManager.jsx` — deleted

---

## Backward Compatibility

- Existing products with no `subProducts` will have `subProducts: []` by default — no migration needed
- All existing product APIs work unchanged
- Purchase Order and GRN logic untouched
