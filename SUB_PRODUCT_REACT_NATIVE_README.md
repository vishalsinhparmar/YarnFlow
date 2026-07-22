# Sub-Product Enhancements – React Native Implementation Guide

This document summarizes the sub-product related changes made to YarnFlow (web) and provides the exact context needed to implement the same features in your React Native app.

---

## 1. Architecture Overview

### Data Model
- **Category** → **Product** → **SubProduct** (separate collection)
- SubProducts are standalone documents linked via `product: ObjectId ref 'Product'`
- Only created when `category.hasSubProducts === true`
- `Product.subProducts` is a virtual populate (not stored on product doc)

### Backend Models
- `SubProduct.js`: `{ name: String required, product: ObjectId ref Product required, description: String }`
- Unique index on `{product, name}`

---

## 2. New/Updated Backend Endpoints

### Sub-Product CRUD
- `GET /api/products/:productId/sub-products` – list sub-products for a product
- `POST /api/products/:productId/sub-products/bulk` – create multiple sub-products (body: `{ names: string[] }`)
- `PUT /api/sub-products/:id` – update sub-product
- `DELETE /api/sub-products/:id` – delete sub-product

### Inventory Enhancements
- `GET /api/inventory/product/:productId` – product inventory detail with sub-product breakdown and per-unit weights
- Inventory lot movements now include `weight` field
- Sub-product weights are recorded in GRN movements

---

## 3. Key UI/UX Changes Implemented (Web)

### Consistent Naming
- Display format: **Product X Sub-product** (e.g., “900 Gaze X 23”)
- Applied across PO, SO, GRN, Inventory, Sales Challan list and detail views
- No “No sub-product” fallback text; show “-” instead

### Forms (PO/GRN/SO)
- **Purchase Order Form**:
  - Grouped sub-products under each product
  - Single inline “Add Sub-product” input per product header
  - SubProductSelector with `compact` and `allowAddNew={false}` for rows
- **Goods Receipt Form**:
  - Vertical stack for Quantity and Weight inputs
  - Auto-calculated total weight for sub-products
  - Per-unit weights via SubProductSelector in compact mode
- **Sales Order Modal**:
  - Sub-product list correctly filtered by selected product
  - Consistent product X sub-product display

### Detail Views
- **GRN Detail**: Shows product X sub-product and per-unit weights
- **PO Detail**: Product X sub-product with per-unit weights
- **SO Detail**: Product X sub-product with per-unit weights
- **Challan Detail**: Product X sub-product with per-unit weights
- **Inventory ProductDetail**: Sub-product breakdown with per-unit weights and movement history

---

## 4. React Native Implementation Checklist

### 4.1 Master Data
- [ ] Add SubProduct CRUD screens (list, add, edit, delete)
- [ ] ProductForm: allow inline sub-product management (chips with add/edit/delete)
- [ ] CategoryForm: `hasSubProducts` toggle
- [ ] API integration: implement the 4 sub-product endpoints

### 4.2 Purchase Order
- [ ] PO Form: group items by product; show sub-rows per sub-product
- [ ] Add “Add Sub-product” input per product (calls bulk-add endpoint)
- [ ] SubProductSelector component (compact mode) for per-unit weights
- [ ] PO Detail: display “Product X Sub-product” and per-unit weights

### 4.3 Sales Order
- [ ] SO Modal: filter sub-products by selected product
- [ ] SO Detail: display “Product X Sub-product” and per-unit weights

### 4.4 Goods Receipt (GRN)
- [ ] GRN Form: vertical quantity/weight inputs; auto-calc weight for sub-products
- [ ] SubProductSelector in compact mode for per-unit weights
- [ ] GRN Detail: display “Product X Sub-product” and per-unit weights

### 4.5 Sales Challan
- [ ] Challan Detail: display “Product X Sub-product” and per-unit weights
- [ ] Create Challan: show product X sub-product in dispatch rows

### 4.6 Inventory
- [ ] Inventory List: show aggregated stock by product X sub-product with `X` separator
- [ ] Product Detail: implement breakdown by sub-product with per-unit weights and movement history
- [ ] Use the new `/api/inventory/product/:productId` endpoint

---

## 5. Component Patterns (Web Reference)

### SubProductSelector Props
```js
{
  productId,
  selectedSubProduct,
  selectedSubProductName,
  quantity,
  weights, // array of per-unit weights
  categoryHasSubProducts,
  onSelectSubProduct,
  onWeightsChange,
  disableSelection, // for GRN receiving
  allowAddNew, // set false for rows; true for inline add
  compact // minimal UI for per-unit weights
}
```

### Display Name Helper
```js
const displayName = item.subProductName
  ? `${item.productName} X ${item.subProductName}`
  : item.productName;
```

---

## 6. API Payload Examples

### Bulk Add Sub-products
```json
POST /api/products/:productId/sub-products/bulk
{ "names": ["5", "6", "7"] }
```

### Product Inventory Detail Response
```json
{
  "success": true,
  "data": {
    "product": { "_id": "...", "productName": "900 Gaze" },
    "totals": { "currentStock": 120, "currentWeight": 600.5 },
    "subProductBreakdown": [
      {
        "subProductId": "...",
        "subProductName": "23",
        "displayName": "900 Gaze X 23",
        "currentStock": 50,
        "currentWeight": 250.0,
        "movements": [...]
      }
    ]
  }
}
```

---

## 7. Migration Notes

- Existing documents without sub-products remain unchanged
- New sub-products are created only when `category.hasSubProducts` is true
- Inventory movements now include `weight` field for both receipt and issue

---

## 8. Validation Rules

- Sub-product names must be unique within a product
- Sub-product can only be linked to one product
- When category has sub-products, PO/SO items must select a sub-product

---

## 9. Files Modified (Web – for reference)

### Backend
- `server/src/models/SubProduct.js` (new)
- `server/src/models/Product.js` (virtual populate)
- `server/src/controller/masterDataController.js` (sub-product CRUD)
- `server/src/routes/masterDataRoutes.js` (routes)
- `server/src/controller/inventoryController.js` (product detail endpoint, displayName X separator)
- `server/src/controller/grnController.js` (record weight in movements)

### Frontend
- `client/src/services/masterDataAPI.js` (subProductAPI)
- `client/src/components/common/SubProductSelector.jsx` (compact/allowAddNew modes)
- `client/src/components/PurchaseOrders/PurchaseOrderForm.jsx` (grouped UI, inline add)
- `client/src/components/GRN/GRNForm.jsx` (vertical inputs)
- `client/src/components/SalesOrders/NewSalesOrderModal.jsx` (filter by product)
- All detail/list views for consistent “Product X Sub-product” display

---

**Implement the above patterns and endpoints in your React Native app to achieve parity with the web enhancements.**
