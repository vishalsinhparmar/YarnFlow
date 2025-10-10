# YarnFlow Setup Guide

## 🚀 Quick Start Guide

This guide will help you set up and run the YarnFlow Master Data module with full backend and frontend integration.

---

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **Git** (for version control)

---

## 🛠️ Installation Steps

### 1. Clone and Setup Server

```bash
# Navigate to server directory
cd YarnFlow/server

# Install dependencies
npm install

# Install additional required dependency
npm install express-validator

# Verify package.json includes all dependencies:
# - express-validator (for validation)
# - cors (for cross-origin requests)
# - mongoose (for MongoDB)
# - winston (for logging)
```

### 2. Database Setup

**Option A: Local MongoDB**
```bash
# Make sure MongoDB is running locally
# Default connection: mongodb://localhost:27017/
```

**Option B: Update Database Connection**
```javascript
// Edit server/db.js if needed
const dbURI = "mongodb://localhost:27017/yarnflow"; // Add database name
```

### 3. Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

**Expected Output:**
```
db connectes successfully
server is running on http://localhost:3020
```

### 4. Seed Sample Data

```bash
# Run the seed script to populate sample data
npm run seed
```

**Expected Output:**
```
🌱 Starting database seeding...
🗑️  Cleared existing data
✅ Created 3 categories
✅ Created 3 suppliers
✅ Created 3 customers
✅ Created 4 products
🎉 Database seeding completed successfully!
```

### 5. Test API Endpoints

```bash
# Health check
curl http://localhost:3020/

# Get master data statistics
curl http://localhost:3020/api/master-data/stats

# Get customers
curl http://localhost:3020/api/master-data/customers

# Get suppliers
curl http://localhost:3020/api/master-data/suppliers
```

### 6. Setup Frontend

```bash
# Navigate to client directory
cd ../client

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

**Expected Output:**
```
Local:   http://localhost:5173/
Network: use --host to expose
```

---

## 🔗 API Integration

### Available Endpoints

**Base URL:** `http://localhost:3020/api/master-data`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Get master data statistics |
| GET | `/customers` | Get all customers |
| POST | `/customers` | Create new customer |
| GET | `/customers/:id` | Get customer by ID |
| PUT | `/customers/:id` | Update customer |
| DELETE | `/customers/:id` | Delete customer |
| GET | `/suppliers` | Get all suppliers |
| POST | `/suppliers` | Create new supplier |
| GET | `/categories` | Get all categories |
| POST | `/categories` | Create new category |
| GET | `/products` | Get all products |
| POST | `/products` | Create new product |

### Frontend Integration

The Master Data page (`/master-data`) now connects to the backend API and displays:

- **Real-time Statistics** from the database
- **Live Customer Data** with proper formatting
- **Supplier Information** with verification status
- **Product Categories** with specifications
- **Error Handling** and loading states

---

## 🧪 Testing the Integration

### 1. Verify Backend is Running
```bash
# Should return server status
curl http://localhost:3020/
```

### 2. Check Master Data Stats
```bash
# Should return statistics
curl http://localhost:3020/api/master-data/stats
```

### 3. Test Frontend Connection
1. Open browser to `http://localhost:5173/master-data`
2. You should see:
   - Statistics cards with real numbers
   - Recent customers from database
   - Recent suppliers with verification status
   - Product categories with specifications

### 4. Verify Data Flow
- Click "Manage Customers" - should load more customers
- Click "Manage Suppliers" - should load more suppliers
- Check browser console for any API errors

---

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running locally

**2. CORS Error in Frontend**
```
Access to fetch at 'http://localhost:3020' from origin 'http://localhost:5173' has been blocked
```
**Solution:** CORS is already configured in server/index.js

**3. API Not Found (404)**
```
Route not found
```
**Solution:** Verify server is running on port 3020

**4. Validation Errors**
```
Validation failed
```
**Solution:** Check API documentation for required fields

### Debug Steps

1. **Check Server Logs**
   ```bash
   # Server logs show in terminal where you ran npm run dev
   ```

2. **Check Database Connection**
   ```bash
   # Look for "db connectes successfully" message
   ```

3. **Verify API Response**
   ```bash
   # Test with curl or Postman
   curl -v http://localhost:3020/api/master-data/stats
   ```

4. **Check Browser Console**
   ```javascript
   // Open browser dev tools and check for errors
   ```

---

## 📊 Sample Data Overview

After running the seed script, you'll have:

### Categories (3)
- **Cotton Yarn** - Bags, 100kg, counts: 20s, 30s, 40s, 50s
- **Polyester** - Rolls, 75kg, counts: 150D, 300D, 600D
- **Blended Yarn** - Bags, 80kg, 60/40 blend ratio

### Suppliers (3)
- **ABC Textiles Ltd.** - Cotton Yarn (Verified)
- **XYZ Cotton Mills** - Cotton Yarn (Verified)
- **Polyester Mills Inc.** - Polyester (Pending)

### Customers (3)
- **Fashion Hub Ltd.** - Mumbai (Active)
- **Textile World Co.** - Delhi (Active)
- **Premium Fabrics Inc.** - Bangalore (Active)

### Products (4)
- **Cotton Yarn 20s** - ₹180/kg, 500 in stock
- **Cotton Yarn 30s** - ₹195/kg, 300 in stock
- **Polyester Roll 150D** - ₹120/kg, 200 in stock
- **Blended Yarn 60/40** - ₹165/kg, 150 in stock

---

## 🔄 Next Steps

### Immediate Tasks
1. **Test All API Endpoints** - Use Postman or curl
2. **Verify Frontend Integration** - Check all data displays correctly
3. **Add Error Handling** - Test with invalid data
4. **Performance Testing** - Test with larger datasets

### Future Enhancements
1. **Authentication** - Add JWT token authentication
2. **File Upload** - Add product image uploads
3. **Advanced Filtering** - Add more search and filter options
4. **Real-time Updates** - Add WebSocket support
5. **Bulk Operations** - Add import/export functionality

---

## 📞 Support

If you encounter any issues:

1. **Check the logs** in both server and client terminals
2. **Verify all dependencies** are installed correctly
3. **Ensure MongoDB** is running and accessible
4. **Check API documentation** in `server/API_DOCUMENTATION.md`
5. **Review the code** - all files are well-commented

---

## 🎉 Success Indicators

You'll know everything is working when:

✅ Server starts without errors on port 3020  
✅ Database connection is successful  
✅ Seed data is created successfully  
✅ API endpoints return proper JSON responses  
✅ Frontend loads Master Data page without errors  
✅ Real data appears in the UI (not placeholder data)  
✅ Statistics show actual numbers from database  
✅ Customer and supplier lists show real entries  

**Congratulations! Your YarnFlow Master Data module is now fully integrated with backend and frontend! 🎊**
