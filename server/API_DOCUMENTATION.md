# YarnFlow Master Data API Documentation

## Base URL
```
http://localhost:3020/api/master-data
```

## Authentication
Currently, no authentication is required for Master Data endpoints. This will be added in future versions.

---

## 📊 Master Data Statistics

### GET `/stats`
Get overview statistics for all master data.

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": {
      "total": 45,
      "active": 42
    },
    "suppliers": {
      "total": 28,
      "verified": 25
    },
    "products": {
      "total": 156,
      "lowStock": 12
    },
    "categories": {
      "total": 12
    }
  }
}
```

---

## 👥 Customer Management

### GET `/customers`
Get all customers with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search in company name, contact person, or customer code
- `status` (string): Filter by status (Active, Inactive, Blocked)

**Example Request:**
```
GET /api/master-data/customers?page=1&limit=10&search=Fashion&status=Active
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6g7h8i9j0",
      "customerCode": "CUST-0001",
      "companyName": "Fashion Hub Ltd.",
      "contactPerson": "Priya Sharma",
      "email": "priya@fashionhub.com",
      "phone": "+919876543220",
      "address": {
        "street": "101 Fashion Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400002",
        "country": "India"
      },
      "gstNumber": "27FASHB1234K1Z8",
      "creditLimit": 500000,
      "paymentTerms": "Credit-30",
      "status": "Active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 45
  }
}
```

### GET `/customers/:id`
Get a specific customer by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6g7h8i9j0",
    "customerCode": "CUST-0001",
    "companyName": "Fashion Hub Ltd.",
    // ... full customer object
  }
}
```

### POST `/customers`
Create a new customer.

**Request Body:**
```json
{
  "companyName": "New Fashion Company",
  "contactPerson": "John Doe",
  "email": "john@newfashion.com",
  "phone": "+919876543230",
  "address": {
    "street": "123 New Street",
    "city": "Delhi",
    "state": "Delhi",
    "pincode": "110001",
    "country": "India"
  },
  "gstNumber": "07NEWCOM1234N1Z5",
  "creditLimit": 300000,
  "paymentTerms": "Credit-30"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6g7h8i9j1",
    "customerCode": "CUST-0046",
    // ... full customer object
  }
}
```

### PUT `/customers/:id`
Update an existing customer.

**Request Body:** (All fields optional)
```json
{
  "companyName": "Updated Company Name",
  "creditLimit": 400000,
  "status": "Active"
}
```

### DELETE `/customers/:id`
Delete a customer.

**Response:**
```json
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

---

## 🏭 Supplier Management

### GET `/suppliers`
Get all suppliers with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search in company name, contact person, or supplier code
- `supplierType` (string): Filter by type (Cotton Yarn, Polyester, Blended Yarn, Raw Cotton, Chemicals, Other)
- `verificationStatus` (string): Filter by verification (Pending, Verified, Rejected)

**Example Request:**
```
GET /api/master-data/suppliers?supplierType=Cotton Yarn&verificationStatus=Verified
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6g7h8i9j2",
      "supplierCode": "SUPP-0001",
      "companyName": "ABC Textiles Ltd.",
      "contactPerson": "Rajesh Kumar",
      "email": "rajesh@abctextiles.com",
      "phone": "+919876543210",
      "supplierType": "Cotton Yarn",
      "verificationStatus": "Verified",
      "rating": 4,
      "status": "Active",
      // ... full supplier object
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 3,
    "total": 28
  }
}
```

### POST `/suppliers`
Create a new supplier.

**Request Body:**
```json
{
  "companyName": "New Textile Mills",
  "contactPerson": "Supplier Name",
  "email": "contact@newtextile.com",
  "phone": "+919876543240",
  "supplierType": "Cotton Yarn",
  "address": {
    "street": "456 Mill Road",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "pincode": "641001",
    "country": "India"
  },
  "gstNumber": "33NEWMILL567H2Z3",
  "bankDetails": {
    "bankName": "State Bank of India",
    "accountNumber": "1234567890",
    "ifscCode": "SBIN0001234",
    "accountHolderName": "New Textile Mills"
  }
}
```

---

## 📂 Category Management

### GET `/categories`
Get all categories.

**Query Parameters:**
- `includeSubcategories` (boolean): Include subcategories (default: false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6g7h8i9j3",
      "categoryCode": "CAT-001",
      "categoryName": "Cotton Yarn",
      "description": "Various cotton yarn types and counts",
      "categoryType": "Cotton Yarn",
      "specifications": {
        "unit": "Bags",
        "standardWeight": 100,
        "yarnCount": ["20s", "30s", "40s", "50s"],
        "color": ["Natural", "White", "Bleached"],
        "quality": ["Premium", "Standard", "Economy"]
      },
      "status": "Active",
      "sortOrder": 0
    }
  ]
}
```

### POST `/categories`
Create a new category.

**Request Body:**
```json
{
  "categoryName": "Silk Yarn",
  "description": "Premium silk yarn products",
  "categoryType": "Raw Material",
  "specifications": {
    "unit": "Kg",
    "standardWeight": 25,
    "yarnCount": ["60s", "80s", "100s"],
    "color": ["Natural", "Dyed"],
    "quality": ["Premium"]
  }
}
```

---

## 🧶 Product Management

### GET `/products`
Get all products with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search in product name or code
- `category` (string): Filter by category ID
- `material` (string): Filter by material type
- `status` (string): Filter by status

**Example Request:**
```
GET /api/master-data/products?material=Cotton&status=Active&page=1&limit=5
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6g7h8i9j4",
      "productCode": "PRD-0001",
      "productName": "Cotton Yarn 20s",
      "description": "Premium quality cotton yarn 20 count",
      "category": {
        "_id": "64f8a1b2c3d4e5f6g7h8i9j3",
        "categoryName": "Cotton Yarn",
        "categoryType": "Cotton Yarn"
      },
      "specifications": {
        "yarnCount": "20s",
        "material": "Cotton",
        "color": "Natural",
        "quality": "Premium",
        "packingType": "Bags",
        "standardWeight": 100
      },
      "pricing": {
        "basePrice": 180,
        "currency": "INR",
        "priceUnit": "Per Kg",
        "minimumOrderQuantity": 10
      },
      "inventory": {
        "currentStock": 500,
        "reservedStock": 0,
        "availableStock": 500,
        "reorderLevel": 50,
        "maxStockLevel": 1000
      },
      "suppliers": [
        {
          "supplier": {
            "_id": "64f8a1b2c3d4e5f6g7h8i9j2",
            "companyName": "ABC Textiles Ltd.",
            "supplierCode": "SUPP-0001"
          },
          "supplierPrice": 175,
          "leadTime": 7,
          "isPreferred": true
        }
      ],
      "status": "Active",
      "isLowStock": false
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 32,
    "total": 156
  }
}
```

### POST `/products`
Create a new product.

**Request Body:**
```json
{
  "productName": "Cotton Yarn 40s Premium",
  "description": "High quality cotton yarn 40 count",
  "category": "64f8a1b2c3d4e5f6g7h8i9j3",
  "specifications": {
    "yarnCount": "40s",
    "material": "Cotton",
    "color": "White",
    "quality": "Premium",
    "packingType": "Bags",
    "standardWeight": 100
  },
  "pricing": {
    "basePrice": 220,
    "priceUnit": "Per Kg",
    "minimumOrderQuantity": 5
  },
  "inventory": {
    "reorderLevel": 30,
    "maxStockLevel": 800
  },
  "suppliers": [
    {
      "supplier": "64f8a1b2c3d4e5f6g7h8i9j2",
      "supplierPrice": 215,
      "leadTime": 5,
      "isPreferred": true
    }
  ]
}
```

---

## 🚨 Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Customer not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Database connection failed"
}
```

---

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
cd server
npm install express-validator
```

### 2. Start Server
```bash
npm run dev
```

### 3. Seed Sample Data
```bash
npm run seed
```

### 4. Test API
```bash
# Health check
curl http://localhost:3020/

# Get master data stats
curl http://localhost:3020/api/master-data/stats

# Get customers
curl http://localhost:3020/api/master-data/customers
```

---

## 📱 Frontend Integration Examples

### React/JavaScript Integration

```javascript
// API service file
const API_BASE_URL = 'http://localhost:3020/api/master-data';

export const masterDataAPI = {
  // Get all customers
  getCustomers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/customers?${queryString}`);
    return response.json();
  },

  // Create customer
  createCustomer: async (customerData) => {
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData),
    });
    return response.json();
  },

  // Get suppliers
  getSuppliers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/suppliers?${queryString}`);
    return response.json();
  },

  // Get products
  getProducts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/products?${queryString}`);
    return response.json();
  },

  // Get categories
  getCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/categories`);
    return response.json();
  },

  // Get stats
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/stats`);
    return response.json();
  }
};
```

### Usage in React Component

```javascript
import { useEffect, useState } from 'react';
import { masterDataAPI } from './api/masterDataAPI';

const MasterDataPage = () => {
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, customersData] = await Promise.all([
          masterDataAPI.getStats(),
          masterDataAPI.getCustomers({ page: 1, limit: 10 })
        ]);
        
        setStats(statsData.data);
        setCustomers(customersData.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Master Data Management</h1>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Customers</h3>
          <p>{stats?.customers?.total || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Suppliers</h3>
          <p>{stats?.suppliers?.total || 0}</p>
        </div>
        {/* More stats... */}
      </div>

      {/* Customers Table */}
      <div className="customers-section">
        <h2>Recent Customers</h2>
        <table>
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Contact Person</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer._id}>
                <td>{customer.companyName}</td>
                <td>{customer.contactPerson}</td>
                <td>{customer.email}</td>
                <td>{customer.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

---

## 🎯 Next Steps

1. **Authentication**: Add JWT authentication to secure endpoints
2. **File Upload**: Add image upload for products
3. **Advanced Filtering**: Add more complex filtering options
4. **Bulk Operations**: Add bulk import/export functionality
5. **Audit Trail**: Track changes to master data
6. **Real-time Updates**: Add WebSocket support for live updates
