# 🛒 Sales Order Inventory Integration - Implementation Guide

## 📋 Overview
Redesign Sales Order form to integrate with inventory system, similar to Purchase Order form but adapted for sales with real-time stock availability.

---

## 🎯 Requirements Summary

### Form Changes:
1. **Customer Selection** with "+ Add Customer" button
2. **Remove Fields**: Customer PO Number, Sales Person  
3. **Add Category Selection** (like PO form)
4. **Product Selection** from inventory stock (category-based)
5. **Auto-populate**: Quantity, Unit, Weight from inventory
6. **Keep**: Only Notes field (single field)

### Backend Changes:
- Update SalesOrder model schema
- Update sales order controller
- Update sales order routes

---

## 📝 Detailed Implementation

### 1. Frontend: NewSalesOrderModal.jsx

#### New State Structure:
```javascript
const [formData, setFormData] = useState({
  customer: '',
  expectedDeliveryDate: '',
  category: '',  // NEW
  items: [{
    product: '',
    quantity: '',
    unit: '',
    weight: '',
    availableStock: 0  // NEW - from inventory
  }],
  notes: ''  // SIMPLIFIED - single notes field
});

const [customers, setCustomers] = useState([]);
const [categories, setCategories] = useState([]);  // NEW
const [inventoryProducts, setInventoryProducts] = useState([]);  // NEW
const [showCustomerModal, setShowCustomerModal] = useState(false);  // NEW
```

#### Key Functions to Add:

**1. Load Categories:**
```javascript
const loadCategories = async () => {
  try {
    const response = await masterDataAPI.categories.getAll();
    if (response.success) {
      setCategories(response.data || []);
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
};
```

**2. Load Inventory Products by Category:**
```javascript
const loadInventoryByCategory = async (categoryId) => {
  try {
    const response = await inventoryAPI.getAll({ category: categoryId });
    if (response.success) {
      // Transform inventory data to product list with stock info
      const products = [];
      response.data.forEach(category => {
        category.products.forEach(product => {
          products.push({
            _id: product.productId,
            productName: product.productName,
            productCode: product.productCode,
            unit: product.unit,
            totalStock: product.totalStock,
            totalWeight: product.totalWeight,
            suppliers: product.supplierNames
          });
        });
      });
      setInventoryProducts(products);
    }
  } catch (error) {
    console.error('Error loading inventory:', error);
  }
};
```

**3. Handle Category Change:**
```javascript
const handleCategoryChange = (e) => {
  const { value } = e.target;
  setFormData(prev => ({
    ...prev,
    category: value,
    items: [{
      product: '',
      quantity: '',
      unit: '',
      weight: '',
      availableStock: 0
    }]
  }));
  
  if (value) {
    loadInventoryByCategory(value);
  } else {
    setInventoryProducts([]);
  }
};
```

**4. Handle Product Selection (Auto-populate):**
```javascript
const handleItemChange = (index, field, value) => {
  const updatedItems = [...formData.items];
  updatedItems[index] = {
    ...updatedItems[index],
    [field]: value
  };

  // Auto-populate from inventory when product selected
  if (field === 'product') {
    const selectedProduct = inventoryProducts.find(p => p._id === value);
    if (selectedProduct) {
      updatedItems[index] = {
        ...updatedItems[index],
        unit: selectedProduct.unit,
        availableStock: selectedProduct.totalStock,
        weight: selectedProduct.totalWeight
      };
    }
  }

  setFormData(prev => ({
    ...prev,
    items: updatedItems
  }));
};
```

**5. Customer Modal Handlers:**
```javascript
const handleAddCustomer = () => {
  setShowCustomerModal(true);
};

const handleCustomerSaved = async (newCustomer) => {
  setShowCustomerModal(false);
  await loadCustomers();  // Reload customers
  setFormData(prev => ({
    ...prev,
    customer: newCustomer._id
  }));
};
```

#### JSX Structure:

```jsx
<form onSubmit={handleSubmit} className="p-6 space-y-6">
  {/* Basic Information */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Customer with Add Button */}
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Customer *
        </label>
        <button
          type="button"
          onClick={handleAddCustomer}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          + Add Customer
        </button>
      </div>
      <select
        name="customer"
        value={formData.customer}
        onChange={handleInputChange}
        required
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      >
        <option value="">Select Customer</option>
        {customers.map(customer => (
          <option key={customer._id} value={customer._id}>
            {customer.companyName}
          </option>
        ))}
      </select>
    </div>

    {/* Expected Delivery Date */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Expected Delivery Date *
      </label>
      <input
        type="date"
        name="expectedDeliveryDate"
        value={formData.expectedDeliveryDate}
        onChange={handleInputChange}
        required
        min={new Date().toISOString().split('T')[0]}
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
      />
    </div>
  </div>

  {/* Category Selection */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Category *
    </label>
    <select
      name="category"
      value={formData.category}
      onChange={handleCategoryChange}
      required
      className="w-full px-3 py-2 border border-gray-300 rounded-md"
    >
      <option value="">Select Category</option>
      {categories.map(category => (
        <option key={category._id} value={category._id}>
          {category.categoryName}
        </option>
      ))}
    </select>
    {!formData.category && (
      <p className="text-xs text-blue-600 mt-1">
        ℹ️ Select a category first to filter available products from inventory
      </p>
    )}
  </div>

  {/* Order Items */}
  <div>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
      <button
        type="button"
        onClick={addItem}
        disabled={!formData.category}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm disabled:opacity-50"
      >
        + Add Item
      </button>
    </div>

    <div className="space-y-4">
      {formData.items.map((item, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Product */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product *
              </label>
              <select
                value={item.product}
                onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                required
                disabled={!formData.category}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">
                  {formData.category ? 'Select Product' : 'Select Category First'}
                </option>
                {inventoryProducts.map(product => (
                  <option key={product._id} value={product._id}>
                    {product.productName} (Stock: {product.totalStock} {product.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                required
                min="0.01"
                max={item.availableStock}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {item.availableStock > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Available: {item.availableStock} {item.unit}
                </p>
              )}
            </div>

            {/* Unit (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <input
                type="text"
                value={item.unit}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>

            {/* Remove Button */}
            <div className="flex items-end">
              {formData.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Weight Display */}
          {item.weight > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              Total Weight: {item.weight} Kg
            </div>
          )}
        </div>
      ))}
    </div>
  </div>

  {/* Notes (Single Field) */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Notes
    </label>
    <textarea
      name="notes"
      value={formData.notes}
      onChange={handleInputChange}
      rows="3"
      placeholder="Order notes..."
      className="w-full px-3 py-2 border border-gray-300 rounded-md"
    />
  </div>

  {/* Form Actions */}
  <div className="flex items-center justify-end space-x-4 pt-6 border-t">
    <button
      type="button"
      onClick={onClose}
      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={loading}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
    >
      {loading ? 'Creating...' : 'Create Order'}
    </button>
  </div>
</form>

{/* Customer Modal */}
{showCustomerModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <CustomerForm
        onClose={() => setShowCustomerModal(false)}
        onSave={handleCustomerSaved}
      />
    </div>
  </div>
)}
```

---

### 2. Backend: SalesOrder Model

#### Update Schema (`server/src/models/SalesOrder.js`):

```javascript
const salesOrderSchema = new mongoose.Schema({
  // ... existing fields ...
  
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true  // NEW - Required field
  },
  
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: String,
    productCode: String,
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true
    },
    weight: {
      type: Number,
      default: 0
    },
    // Remove: unitPrice, taxRate, lineTotal, taxAmount, totalAmount
  }],
  
  notes: {
    type: String,
    default: ''  // SIMPLIFIED - single notes field
  },
  
  // REMOVE these fields:
  // customerPONumber
  // salesPerson
  // customerNotes
  // internalNotes
  
  // ... rest of schema ...
}, {
  timestamps: true
});
```

---

### 3. Backend: Sales Order Controller

#### Update Create Function (`server/src/controller/salesOrderController.js`):

```javascript
exports.createSalesOrder = async (req, res) => {
  try {
    const {
      customer,
      expectedDeliveryDate,
      category,  // NEW
      items,
      notes
    } = req.body;

    // Validate inventory availability
    for (const item of items) {
      const inventoryCheck = await checkInventoryAvailability(
        item.product,
        item.quantity
      );
      
      if (!inventoryCheck.available) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${inventoryCheck.productName}. Available: ${inventoryCheck.availableStock}`
        });
      }
    }

    // Create sales order
    const salesOrder = new SalesOrder({
      customer,
      expectedDeliveryDate,
      category,
      items: items.map(item => ({
        product: item.product,
        productName: item.productName,
        productCode: item.productCode,
        quantity: item.quantity,
        unit: item.unit,
        weight: item.weight || 0
      })),
      notes: notes || '',
      status: 'Pending',
      createdBy: req.user?.name || 'Admin'
    });

    await salesOrder.save();

    // Populate references
    await salesOrder.populate('customer category items.product');

    res.status(201).json({
      success: true,
      message: 'Sales order created successfully',
      data: salesOrder
    });
  } catch (error) {
    console.error('Error creating sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sales order',
      error: error.message
    });
  }
};

// Helper function
async function checkInventoryAvailability(productId, requestedQuantity) {
  // Get inventory for this product
  const inventory = await inventoryAPI.getAll({ product: productId });
  
  if (!inventory.success || !inventory.data.length) {
    return {
      available: false,
      availableStock: 0,
      productName: 'Unknown'
    };
  }

  // Calculate total available stock
  let totalStock = 0;
  let productName = '';
  
  inventory.data.forEach(category => {
    category.products.forEach(product => {
      if (product.productId.toString() === productId.toString()) {
        totalStock += product.totalStock;
        productName = product.productName;
      }
    });
  });

  return {
    available: totalStock >= requestedQuantity,
    availableStock: totalStock,
    productName
  };
}
```

---

### 4. Backend: Routes

#### Update Routes (`server/src/routes/salesOrderRoutes.js`):

No changes needed - routes remain the same, only controller logic changes.

---

## 🔄 Migration Steps

### Database Migration (Optional):
If you have existing sales orders, run this migration:

```javascript
// migration-sales-orders.js
const mongoose = require('mongoose');
const SalesOrder = require('./models/SalesOrder');

async function migrateSalesOrders() {
  const orders = await SalesOrder.find({});
  
  for (const order of orders) {
    // Set default category from first item's product category
    if (!order.category && order.items.length > 0) {
      const firstProduct = await Product.findById(order.items[0].product);
      if (firstProduct && firstProduct.category) {
        order.category = firstProduct.category;
      }
    }
    
    // Merge notes
    const allNotes = [
      order.customerNotes,
      order.internalNotes
    ].filter(Boolean).join('\n\n');
    
    order.notes = allNotes;
    
    // Remove old fields
    order.customerPONumber = undefined;
    order.salesPerson = undefined;
    order.customerNotes = undefined;
    order.internalNotes = undefined;
    
    await order.save();
  }
  
  console.log(`Migrated ${orders.length} sales orders`);
}
```

---

## ✅ Testing Checklist

### Frontend Testing:
- [ ] Customer dropdown loads correctly
- [ ] "+ Add Customer" button opens CustomerForm modal
- [ ] New customer appears in dropdown after creation
- [ ] Category dropdown loads from master data
- [ ] Product dropdown filters by selected category
- [ ] Product dropdown shows inventory stock
- [ ] Selecting product auto-populates unit and weight
- [ ] Quantity validation against available stock
- [ ] Cannot exceed available stock
- [ ] Single notes field works
- [ ] Form submission successful

### Backend Testing:
- [ ] Sales order creation with category
- [ ] Inventory availability check works
- [ ] Error when insufficient stock
- [ ] Sales order saved with correct schema
- [ ] Category reference populated
- [ ] Product references populated

---

## 🚀 Deployment Steps

### 1. Backend First:
```bash
cd server
# Update model, controller
npm install
pm2 restart yarnflow-server
```

### 2. Frontend:
```bash
cd client
# Update NewSalesOrderModal.jsx
npm install
npm run build
```

### 3. Test:
- Create new sales order
- Verify inventory integration
- Check database records

---

## 📊 Benefits

### User Experience:
- ✅ Simplified form (fewer fields)
- ✅ Real-time stock visibility
- ✅ Prevents overselling
- ✅ Quick customer creation
- ✅ Category-based filtering

### System Benefits:
- ✅ Inventory-driven sales
- ✅ Accurate stock management
- ✅ Better data consistency
- ✅ Future-proof for Sales Challan
- ✅ Scalable architecture

---

## 🔗 Related Files

### Frontend:
- `client/src/components/SalesOrders/NewSalesOrderModal.jsx` - Main form
- `client/src/components/masterdata/Customers/CustomerForm.jsx` - Customer modal
- `client/src/services/inventoryAPI.js` - Inventory data
- `client/src/services/masterDataAPI.js` - Master data

### Backend:
- `server/src/models/SalesOrder.js` - Schema
- `server/src/controller/salesOrderController.js` - Logic
- `server/src/routes/salesOrderRoutes.js` - Routes

---

**End of Implementation Guide**
