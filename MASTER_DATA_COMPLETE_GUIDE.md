# 📚 YarnFlow Master Data - Complete API & Component Guide

## 🎯 Overview

This document provides a **complete reference** for all Master Data components, their backend API integrations, CRUD operations, pagination, search functionality, and data structures. Use this as a blueprint for implementing the same functionality in your React Native app.

**⚠️ IMPORTANT: All API examples and data models in this document are based on the EXACT backend implementation - no fake or additional fields!**

---

## 📝 Quick Reference - Exact Model Fields

### **Customer Fields**
```javascript
{
  "_id": "auto-generated",
  "companyName": "required",
  "gstNumber": "optional, uppercase",
  "panNumber": "optional, uppercase, auto-extracted from GST",
  "address": {
    "city": "optional"
  },
  "notes": "optional",
  "status": "Active | Inactive (default: Active)",
  "createdAt": "auto-generated",
  "updatedAt": "auto-generated"
}
```

### **Supplier Fields**
```javascript
{
  "_id": "auto-generated",
  "companyName": "required",
  "gstNumber": "optional, uppercase",
  "panNumber": "optional, uppercase, auto-extracted from GST",
  "city": "optional",
  "notes": "optional",
  "status": "Active | Inactive | Blocked (default: Active)",
  "createdAt": "auto-generated",
  "updatedAt": "auto-generated"
}
```

### **Category Fields**
```javascript
{
  "_id": "auto-generated",
  "categoryName": "required",
  "description": "optional",
  "status": "Active | Inactive (default: Active)",
  "createdAt": "auto-generated",
  "updatedAt": "auto-generated"
}
```

### **Product Fields**
```javascript
{
  "_id": "auto-generated",
  "productName": "required",
  "description": "optional",
  "category": "required, ref to Category",
  "status": "Active | Inactive | Discontinued (default: Active)",
  "createdAt": "auto-generated",
  "updatedAt": "auto-generated"
}
```

---

## 📋 Table of Contents

1. [Master Data Entities](#master-data-entities)
2. [Backend API Endpoints](#backend-api-endpoints)
3. [Frontend Components Structure](#frontend-components-structure)
4. [CRUD Operations Flow](#crud-operations-flow)
5. [Pagination Implementation](#pagination-implementation)
6. [Search & Filters](#search--filters)
7. [Data Models](#data-models)
8. [React Native Implementation Guide](#react-native-implementation-guide)

---

## 🗂️ Master Data Entities

YarnFlow has **4 main master data entities**:

| Entity | Purpose | Key Fields | Relations |
|--------|---------|------------|-----------|
| **Customers** | Manage buyers/clients | Company Name, GST, PAN, Contact | → Sales Orders, Challans |
| **Suppliers** | Manage vendors | Company Name, GST, PAN, City | → Purchase Orders |
| **Categories** | Product classification | Category Name, Description | → Products |
| **Products** | Inventory items | Product Name, Code, Category | → Orders, Inventory |

---

## 🔌 Backend API Endpoints

### **Base URL**
```
http://localhost:5000/api/master-data
```

### **1. Customers API**

#### **GET /customers** - List all customers
```javascript
// Request
GET /master-data/customers?page=1&limit=50&search=fashion&status=Active

// Response
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "companyName": "Fashion Hub Ltd.",
      "gstNumber": "22AAAAA0000A1Z5",
      "panNumber": "AAAAA0000A",
      "address": {
        "city": "Mumbai"
      },
      "notes": "Premium customer",
      "status": "Active",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 234
  }
}
```

#### **GET /customers/:id** - Get single customer
```javascript
// Request
GET /master-data/customers/507f1f77bcf86cd799439011

// Response
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "companyName": "Fashion Hub Ltd.",
    // ... full customer object
  }
}
```

#### **POST /customers** - Create customer
```javascript
// Request
POST /master-data/customers
Content-Type: application/json

{
  "companyName": "Fashion Hub Ltd.",
  "gstNumber": "22AAAAA0000A1Z5",
  "panNumber": "AAAAA0000A",
  "address": {
    "city": "Mumbai"
  },
  "notes": "Premium customer",
  "status": "Active"
}

// Response
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    // ... created customer object
  }
}
```

#### **PUT /customers/:id** - Update customer
```javascript
// Request
PUT /master-data/customers/507f1f77bcf86cd799439011
Content-Type: application/json

{
  "companyName": "Fashion Hub Ltd. (Updated)",
  "phone": "9876543211"
}

// Response
{
  "success": true,
  "message": "Customer updated successfully",
  "data": {
    // ... updated customer object
  }
}
```

#### **DELETE /customers/:id** - Delete customer
```javascript
// Request
DELETE /master-data/customers/507f1f77bcf86cd799439011

// Response
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

---

### **2. Suppliers API**

#### **GET /suppliers** - List all suppliers
```javascript
// Request
GET /master-data/suppliers?page=1&limit=50&search=textile&status=Active

// Response
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "companyName": "Textile Suppliers Co.",
      "gstNumber": "27BBBBB1111B1Z6",
      "panNumber": "BBBBB1111B",
      "city": "Surat",
      "notes": "Reliable supplier",
      "status": "Active",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 3,
    "total": 142,
    "limit": 50
  }
}
```

#### **POST /suppliers** - Create supplier
```javascript
// Request
POST /master-data/suppliers
Content-Type: application/json

{
  "companyName": "Textile Suppliers Co.",
  "gstNumber": "27BBBBB1111B1Z6",
  "panNumber": "BBBBB1111B",
  "city": "Surat",
  "notes": "Reliable supplier",
  "status": "Active"
}

// Response
{
  "success": true,
  "message": "Supplier created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    // ... created supplier object
  }
}
```

#### **PUT /suppliers/:id** - Update supplier
```javascript
// Request
PUT /master-data/suppliers/507f1f77bcf86cd799439012

{
  "city": "Ahmedabad",
  "notes": "Updated notes"
}

// Response
{
  "success": true,
  "message": "Supplier updated successfully",
  "data": {
    // ... updated supplier object
  }
}
```

#### **DELETE /suppliers/:id** - Delete supplier
```javascript
// Request
DELETE /master-data/suppliers/507f1f77bcf86cd799439012

// Response
{
  "success": true,
  "message": "Supplier deleted successfully"
}
```

---

### **3. Categories API**

#### **GET /categories** - List all categories
```javascript
// Request
GET /master-data/categories?page=1&limit=50&search=yarn&status=Active

// Response
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "categoryName": "Cotton Yarn",
      "description": "High quality cotton yarn",
      "status": "Active",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 2,
    "total": 85,
    "limit": 50
  }
}
```

#### **POST /categories** - Create category
```javascript
// Request
POST /master-data/categories

{
  "categoryName": "Cotton Yarn",
  "description": "High quality cotton yarn",
  "status": "Active"
}

// Response
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    // ... created category object
  }
}
```

#### **PUT /categories/:id** - Update category
```javascript
// Request
PUT /master-data/categories/507f1f77bcf86cd799439013

{
  "description": "Premium cotton yarn",
  "status": "Active"
}

// Response
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    // ... updated category object
  }
}
```

#### **DELETE /categories/:id** - Delete category
```javascript
// Request
DELETE /master-data/categories/507f1f77bcf86cd799439013

// Response
{
  "success": true,
  "message": "Category deleted successfully"
}
```

---

### **4. Products API**

#### **GET /products** - List all products
```javascript
// Request
GET /master-data/products?page=1&limit=50&search=cotton&category=507f1f77bcf86cd799439013&status=Active

// Response
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "productName": "Cotton Yarn 30s",
      "productCode": "CY-30S-001",
      "description": "30 count cotton yarn",
      "category": {
        "_id": "507f1f77bcf86cd799439013",
        "categoryName": "Cotton Yarn"
      },
      "status": "Active",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 10,
    "total": 487,
    "limit": 50
  }
}
```

#### **POST /products** - Create product
```javascript
// Request
POST /master-data/products

{
  "productName": "Cotton Yarn 30s",
  "productCode": "CY-30S-001",
  "description": "30 count cotton yarn",
  "category": "507f1f77bcf86cd799439013",
  "status": "Active"
}

// Response
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    // ... created product object
  }
}
```

#### **PUT /products/:id** - Update product
```javascript
// Request
PUT /master-data/products/507f1f77bcf86cd799439014

{
  "productName": "Cotton Yarn 30s (Premium)",
  "description": "Premium 30 count cotton yarn"
}

// Response
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    // ... updated product object
  }
}
```

#### **DELETE /products/:id** - Delete product
```javascript
// Request
DELETE /master-data/products/507f1f77bcf86cd799439014

// Response
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

### **5. Master Data Stats API**

#### **GET /stats** - Get statistics
```javascript
// Request
GET /master-data/stats

// Response
{
  "success": true,
  "data": {
    "customers": {
      "total": 234,
      "active": 198,
      "inactive": 36
    },
    "suppliers": {
      "total": 142,
      "active": 128,
      "inactive": 14
    },
    "categories": {
      "total": 85,
      "active": 78,
      "inactive": 7
    },
    "products": {
      "total": 487,
      "active": 456,
      "inactive": 31
    }
  }
}
```

---

### **6. Import API**

#### **POST /import/:type** - Import from Excel
```javascript
// Request
POST /master-data/import/customers
Content-Type: multipart/form-data

FormData: {
  file: [Excel file]
}

// Response
{
  "success": true,
  "message": "Import completed successfully",
  "data": {
    "imported": 45,
    "failed": 2,
    "errors": [
      {
        "row": 12,
        "error": "Invalid GST number"
      }
    ]
  }
}
```

---

## 🏗️ Frontend Components Structure

### **Directory Structure**
```
client/src/components/masterdata/
├── Customers/
│   ├── CustomerList.jsx       # List view with pagination
│   ├── CustomerForm.jsx       # Create/Edit form
│   └── CustomerCard.jsx       # (Optional) Card view
├── Suppliers/
│   ├── SupplierList.jsx       # List view with pagination
│   ├── SupplierForm.jsx       # Create/Edit form
│   └── SupplierCard.jsx       # (Optional) Card view
├── Categories/
│   ├── CategoryList.jsx       # List view with pagination
│   ├── CategoryForm.jsx       # Create/Edit form
│   └── CategoryCard.jsx       # (Optional) Card view
└── Products/
    ├── ProductList.jsx        # List view with pagination
    ├── ProductForm.jsx        # Create/Edit form
    └── ProductCard.jsx        # (Optional) Card view
```

---

## 🔄 CRUD Operations Flow

### **1. List View Component Pattern**

```javascript
// Example: SupplierList.jsx
import { useState, useEffect } from 'react';
import { supplierAPI } from '../../../services/masterDataAPI';
import Pagination from '../../common/Pagination';

const SupplierList = ({ onEdit, onRefresh, refreshTrigger }) => {
  // State management
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  // Fetch data function
  const fetchSuppliers = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = {
        page,
        limit: itemsPerPage
      };
      
      if (searchTerm) queryParams.search = searchTerm;
      
      const response = await supplierAPI.getAll(queryParams);
      
      if (response.success) {
        setSuppliers(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchSuppliers(newPage);
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
    fetchSuppliers(1);
  }, [searchTerm]);

  // Refresh when trigger changes
  useEffect(() => {
    fetchSuppliers(currentPage);
  }, [refreshTrigger]);

  // Handle delete
  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete "${name}"?`)) {
      try {
        const response = await supplierAPI.delete(id);
        if (response.success) {
          fetchSuppliers(); // Refresh list
          onRefresh?.(); // Notify parent
        }
      } catch (err) {
        setError(err.message || 'Failed to delete');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="text"
        placeholder="Search suppliers..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border rounded-md"
      />

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && <div>Loading...</div>}

      {/* Table */}
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th>Sr. No.</th>
            <th>Company Name</th>
            <th>GST Number</th>
            <th>City</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier, index) => (
            <tr key={supplier._id}>
              <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
              <td>{supplier.companyName}</td>
              <td>{supplier.gstNumber || '-'}</td>
              <td>{supplier.city || '-'}</td>
              <td>
                <button onClick={() => onEdit(supplier)}>Edit</button>
                <button onClick={() => handleDelete(supplier._id, supplier.companyName)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={pagination.pages}
        totalItems={pagination.total}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default SupplierList;
```

---

### **2. Form Component Pattern**

```javascript
// Example: SupplierForm.jsx
import { useState, useEffect } from 'react';

const SupplierForm = ({ supplier, onSubmit, onCancel, loading }) => {
  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    gstNumber: '',
    panNumber: '',
    city: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Populate form if editing
  useEffect(() => {
    if (supplier) {
      setFormData({
        companyName: supplier.companyName || '',
        gstNumber: supplier.gstNumber || '',
        panNumber: supplier.panNumber || '',
        city: supplier.city || '',
        notes: supplier.notes || ''
      });
    }
  }, [supplier]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-extract PAN from GST
    if (name === 'gstNumber' && value.length >= 10) {
      const extractedPAN = value.substring(2, 12).toUpperCase();
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase(),
        panNumber: extractedPAN
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'gstNumber' || name === 'panNumber' 
          ? value.toUpperCase() 
          : value
      }));
    }
    
    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (formData.gstNumber && formData.gstNumber.length !== 15) {
      newErrors.gstNumber = 'GST must be 15 characters';
    }

    if (formData.panNumber && formData.panNumber.length !== 10) {
      newErrors.panNumber = 'PAN must be 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Name */}
      <div>
        <label>Company Name *</label>
        <input
          type="text"
          name="companyName"
          value={formData.companyName}
          onChange={handleChange}
          className={errors.companyName ? 'border-red-500' : ''}
          required
        />
        {errors.companyName && (
          <p className="text-red-500 text-xs">{errors.companyName}</p>
        )}
      </div>

      {/* GST Number */}
      <div>
        <label>GST Number</label>
        <input
          type="text"
          name="gstNumber"
          value={formData.gstNumber}
          onChange={handleChange}
          maxLength="15"
          placeholder="22AAAAA0000A1Z5"
        />
        {errors.gstNumber && (
          <p className="text-red-500 text-xs">{errors.gstNumber}</p>
        )}
      </div>

      {/* PAN Number */}
      <div>
        <label>PAN Number (Auto-filled from GST)</label>
        <input
          type="text"
          name="panNumber"
          value={formData.panNumber}
          onChange={handleChange}
          maxLength="10"
        />
      </div>

      {/* City */}
      <div>
        <label>City</label>
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
        />
      </div>

      {/* Notes */}
      <div>
        <label>Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="4"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <button type="button" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : supplier ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};

export default SupplierForm;
```

---

### **3. Parent Page Pattern**

```javascript
// Example: SuppliersPage.jsx
import { useState } from 'react';
import { supplierAPI } from '../../services/masterDataAPI';
import SupplierList from './SupplierList';
import SupplierForm from './SupplierForm';

const SuppliersPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handle create
  const handleCreate = () => {
    setEditingSupplier(null);
    setShowForm(true);
  };

  // Handle edit
  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  // Handle submit (create or update)
  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      
      if (editingSupplier) {
        // Update
        await supplierAPI.update(editingSupplier._id, formData);
      } else {
        // Create
        await supplierAPI.create(formData);
      }
      
      setShowForm(false);
      setEditingSupplier(null);
      setRefreshTrigger(prev => prev + 1); // Trigger refresh
    } catch (err) {
      alert(err.message || 'Failed to save supplier');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingSupplier(null);
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1>Suppliers</h1>
        <button onClick={handleCreate}>Add Supplier</button>
      </div>

      {showForm ? (
        <SupplierForm
          supplier={editingSupplier}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      ) : (
        <SupplierList
          onEdit={handleEdit}
          onRefresh={() => setRefreshTrigger(prev => prev + 1)}
          refreshTrigger={refreshTrigger}
        />
      )}
    </div>
  );
};

export default SuppliersPage;
```

---

## 📄 Pagination Implementation

### **Pagination Component**

```javascript
// Pagination.jsx
const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between">
      {/* Info */}
      <div className="text-sm text-gray-700">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>

        {/* Page numbers */}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={currentPage === page ? 'active' : ''}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
```

### **Usage in List Component**

```javascript
// In your list component
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage] = useState(50);
const [pagination, setPagination] = useState({
  current: 1,
  pages: 1,
  total: 0
});

// Fetch with pagination
const fetchData = async (page = currentPage) => {
  const response = await supplierAPI.getAll({
    page,
    limit: itemsPerPage
  });
  
  setSuppliers(response.data);
  setPagination(response.pagination);
};

// Handle page change
const handlePageChange = (newPage) => {
  setCurrentPage(newPage);
  fetchData(newPage);
};

// Render
<Pagination
  currentPage={currentPage}
  totalPages={pagination.pages}
  totalItems={pagination.total}
  itemsPerPage={itemsPerPage}
  onPageChange={handlePageChange}
/>
```

---

## 🔍 Search & Filters

### **Search Implementation**

```javascript
const [searchTerm, setSearchTerm] = useState('');
const [currentPage, setCurrentPage] = useState(1);

// Reset to page 1 when search changes
useEffect(() => {
  setCurrentPage(1);
  fetchData(1);
}, [searchTerm]);

// Fetch with search
const fetchData = async (page = currentPage) => {
  const params = {
    page,
    limit: itemsPerPage
  };
  
  if (searchTerm) {
    params.search = searchTerm;
  }
  
  const response = await supplierAPI.getAll(params);
  // ... handle response
};

// Search input
<input
  type="text"
  placeholder="Search..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
```

### **Filter Implementation**

```javascript
const [statusFilter, setStatusFilter] = useState('');
const [categoryFilter, setCategoryFilter] = useState('');

// Reset to page 1 when filters change
useEffect(() => {
  setCurrentPage(1);
  fetchData(1);
}, [searchTerm, statusFilter, categoryFilter]);

// Fetch with filters
const fetchData = async (page = currentPage) => {
  const params = {
    page,
    limit: itemsPerPage
  };
  
  if (searchTerm) params.search = searchTerm;
  if (statusFilter) params.status = statusFilter;
  if (categoryFilter) params.category = categoryFilter;
  
  const response = await productAPI.getAll(params);
  // ... handle response
};

// Filter dropdowns
<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
  <option value="">All Status</option>
  <option value="Active">Active</option>
  <option value="Inactive">Inactive</option>
</select>

<select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
  <option value="">All Categories</option>
  {categories.map(cat => (
    <option key={cat._id} value={cat._id}>{cat.categoryName}</option>
  ))}
</select>
```

---

## � Backend Implementation Details

### **Pagination Configuration**
```javascript
// Default pagination settings
const page = parseInt(req.query.page) || 1;
const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Default 50, max 100

// Response format
{
  "success": true,
  "data": [...],
  "pagination": {
    "current": 1,      // Current page number
    "pages": 5,        // Total pages
    "total": 234       // Total items count
  }
}
```

### **Search Implementation**
```javascript
// Search works on multiple fields
if (search) {
  query.$or = [
    { companyName: { $regex: search, $options: 'i' } },
    { gstNumber: { $regex: search, $options: 'i' } },
    { panNumber: { $regex: search, $options: 'i' } }
  ];
}
```

### **Auto-Extract PAN from GST**
```javascript
// Mongoose pre-save hook
// If GST is provided and PAN is not, auto-extract PAN from GST
// PAN is characters 3-12 of GST number (index 2-11)
if (this.gstNumber && this.gstNumber.length >= 10 && !this.panNumber) {
  this.panNumber = this.gstNumber.substring(2, 12).toUpperCase();
}
```

### **Status Enums**
- **Customer**: `Active`, `Inactive`
- **Supplier**: `Active`, `Inactive`, `Blocked`
- **Category**: `Active`, `Inactive`
- **Product**: `Active`, `Inactive`, `Discontinued`

---

## �� Data Models

### **1. Customer Model**

```typescript
interface Customer {
  _id: string;
  companyName: string;          // Required
  gstNumber?: string;            // Optional, uppercase
  panNumber?: string;            // Optional, uppercase, auto-extracted from GST
  address?: {
    city?: string;               // Only city field
  };
  notes?: string;
  status: 'Active' | 'Inactive'; // Default: Active
  createdAt: Date;               // Auto-generated
  updatedAt: Date;               // Auto-generated
}
```

### **2. Supplier Model**

```typescript
interface Supplier {
  _id: string;
  companyName: string;                      // Required
  gstNumber?: string;                        // Optional, uppercase
  panNumber?: string;                        // Optional, uppercase, auto-extracted from GST
  city?: string;                             // Optional
  notes?: string;
  status: 'Active' | 'Inactive' | 'Blocked'; // Default: Active
  createdAt: Date;                           // Auto-generated
  updatedAt: Date;                           // Auto-generated
}
```

### **3. Category Model**

```typescript
interface Category {
  _id: string;
  categoryName: string;          // Required
  description?: string;
  status: 'Active' | 'Inactive'; // Default: Active
  createdAt: Date;               // Auto-generated
  updatedAt: Date;               // Auto-generated
}
```

### **4. Product Model**

```typescript
interface Product {
  _id: string;
  productName: string;                                // Required
  description?: string;
  category: string | Category;                        // Required, ref to Category
  status: 'Active' | 'Inactive' | 'Discontinued';    // Default: Active
  createdAt: Date;                                    // Auto-generated
  updatedAt: Date;                                    // Auto-generated
}
```

---

## 📱 React Native Implementation Guide

### **1. API Service Setup**

```javascript
// services/masterDataAPI.js
import axios from 'axios';

const API_BASE_URL = 'http://your-backend-url/api/master-data';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token interceptor
api.interceptors.request.use(config => {
  const token = getToken(); // Get from AsyncStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Supplier API
export const supplierAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/suppliers', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/suppliers', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
  }
};

// Similar for customerAPI, categoryAPI, productAPI
```

---

### **2. List Screen Component**

```javascript
// screens/SupplierListScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert
} from 'react-native';
import { supplierAPI } from '../services/masterDataAPI';

const SupplierListScreen = ({ navigation }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch suppliers
  const fetchSuppliers = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      }
      
      const params = {
        page,
        limit: 50
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await supplierAPI.getAll(params);
      
      if (response.success) {
        if (append) {
          setSuppliers(prev => [...prev, ...response.data]);
        } else {
          setSuppliers(response.data);
        }
        
        setCurrentPage(page);
        setTotalPages(response.pagination.pages);
        setHasMore(page < response.pagination.pages);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSuppliers(1);
  }, [searchTerm]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchSuppliers(1);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchSuppliers(currentPage + 1, true);
    }
  };

  // Handle delete
  const handleDelete = (id, name) => {
    Alert.alert(
      'Delete Supplier',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await supplierAPI.delete(id);
              fetchSuppliers(1); // Refresh list
            } catch (error) {
              Alert.alert('Error', 'Failed to delete supplier');
            }
          }
        }
      ]
    );
  };

  // Render item
  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.srNo}>
          {(currentPage - 1) * 50 + index + 1}
        </Text>
        <Text style={styles.companyName}>{item.companyName}</Text>
      </View>
      
      <View style={styles.cardBody}>
        <Text>GST: {item.gstNumber || '-'}</Text>
        <Text>City: {item.city || '-'}</Text>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={() => navigation.navigate('SupplierForm', { supplier: item })}
        >
          <Text style={styles.editButton}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => handleDelete(item._id, item.companyName)}
        >
          <Text style={styles.deleteButton}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search suppliers..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      {/* List */}
      <FlatList
        data={suppliers}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && <ActivityIndicator size="large" />
        }
        ListEmptyComponent={
          !loading && <Text style={styles.emptyText}>No suppliers found</Text>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('SupplierForm')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SupplierListScreen;
```

---

### **3. Form Screen Component**

```javascript
// screens/SupplierFormScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { supplierAPI } from '../services/masterDataAPI';

const SupplierFormScreen = ({ route, navigation }) => {
  const { supplier } = route.params || {};
  const isEditing = !!supplier;

  const [formData, setFormData] = useState({
    companyName: '',
    gstNumber: '',
    panNumber: '',
    city: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Populate form if editing
  useEffect(() => {
    if (supplier) {
      setFormData({
        companyName: supplier.companyName || '',
        gstNumber: supplier.gstNumber || '',
        panNumber: supplier.panNumber || '',
        city: supplier.city || '',
        notes: supplier.notes || ''
      });
    }
  }, [supplier]);

  // Handle change
  const handleChange = (name, value) => {
    // Auto-extract PAN from GST
    if (name === 'gstNumber' && value.length >= 10) {
      const extractedPAN = value.substring(2, 12).toUpperCase();
      setFormData(prev => ({
        ...prev,
        gstNumber: value.toUpperCase(),
        panNumber: extractedPAN
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: ['gstNumber', 'panNumber'].includes(name)
          ? value.toUpperCase()
          : value
      }));
    }

    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate
  const validate = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (formData.gstNumber && formData.gstNumber.length !== 15) {
      newErrors.gstNumber = 'GST must be 15 characters';
    }

    if (formData.panNumber && formData.panNumber.length !== 10) {
      newErrors.panNumber = 'PAN must be 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      if (isEditing) {
        await supplierAPI.update(supplier._id, formData);
        Alert.alert('Success', 'Supplier updated successfully');
      } else {
        await supplierAPI.create(formData);
        Alert.alert('Success', 'Supplier created successfully');
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Company Name */}
      <View style={styles.field}>
        <Text style={styles.label}>Company Name *</Text>
        <TextInput
          style={[styles.input, errors.companyName && styles.inputError]}
          value={formData.companyName}
          onChangeText={(value) => handleChange('companyName', value)}
          placeholder="Enter company name"
        />
        {errors.companyName && (
          <Text style={styles.errorText}>{errors.companyName}</Text>
        )}
      </View>

      {/* GST Number */}
      <View style={styles.field}>
        <Text style={styles.label}>GST Number</Text>
        <TextInput
          style={[styles.input, errors.gstNumber && styles.inputError]}
          value={formData.gstNumber}
          onChangeText={(value) => handleChange('gstNumber', value)}
          placeholder="22AAAAA0000A1Z5"
          maxLength={15}
          autoCapitalize="characters"
        />
        {errors.gstNumber && (
          <Text style={styles.errorText}>{errors.gstNumber}</Text>
        )}
      </View>

      {/* PAN Number */}
      <View style={styles.field}>
        <Text style={styles.label}>PAN Number (Auto-filled)</Text>
        <TextInput
          style={styles.input}
          value={formData.panNumber}
          onChangeText={(value) => handleChange('panNumber', value)}
          placeholder="Auto-filled from GST"
          maxLength={10}
          autoCapitalize="characters"
        />
      </View>

      {/* City */}
      <View style={styles.field}>
        <Text style={styles.label}>City</Text>
        <TextInput
          style={styles.input}
          value={formData.city}
          onChangeText={(value) => handleChange('city', value)}
          placeholder="Enter city"
        />
      </View>

      {/* Notes */}
      <View style={styles.field}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.notes}
          onChangeText={(value) => handleChange('notes', value)}
          placeholder="Additional notes"
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditing ? 'Update' : 'Create'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default SupplierFormScreen;
```

---

## ✅ Implementation Checklist

### **Backend**
- ✅ All CRUD endpoints working
- ✅ Pagination implemented (default: 50, max: 100)
- ✅ Search functionality working
- ✅ Filter functionality working
- ✅ Validation in place
- ✅ Error handling consistent
- ✅ Authentication/Authorization working

### **Frontend (Web)**
- ✅ List components with pagination
- ✅ Form components with validation
- ✅ Search functionality
- ✅ Filter functionality
- ✅ Delete confirmation
- ✅ Error handling
- ✅ Loading states
- ✅ Responsive design

### **Frontend (React Native)**
- ⬜ API service setup
- ⬜ List screens with FlatList
- ⬜ Form screens with validation
- ⬜ Search functionality
- ⬜ Pull-to-refresh
- ⬜ Infinite scroll
- ⬜ Delete confirmation
- ⬜ Error handling
- ⬜ Loading states
- ⬜ Navigation setup

---

## 🎯 Key Takeaways

### **1. Consistent Patterns**
- All entities follow the same CRUD pattern
- All list components have pagination
- All forms have validation
- All API calls have error handling

### **2. Scalability**
- Pagination prevents performance issues
- Search/filters reduce data load
- Lazy loading for large lists
- Optimized re-renders

### **3. User Experience**
- Loading states for all async operations
- Error messages for failed operations
- Confirmation dialogs for destructive actions
- Search debouncing to reduce API calls

### **4. Data Integrity**
- Form validation on frontend
- Server-side validation on backend
- Unique constraints on critical fields
- Proper error messages

---

## 📞 Support

For issues or questions:
1. Check backend logs for API errors
2. Check browser console for frontend errors
3. Verify network requests in DevTools
4. Check data models match between frontend/backend

---

**This guide provides everything needed to implement the same Master Data functionality in your React Native app with consistent patterns, proper pagination, search, and CRUD operations.** 🚀
