# YarnFlow Database Cleanup Scripts

This folder contains utility scripts for managing and cleaning your YarnFlow database.

## ⚠️ WARNING

**These scripts will DELETE DATA from your database!**
- Only use in development/testing environments
- Never run on production database
- Always backup your data before running these scripts

---

## Scripts Available

### 1. `eraseAllData.js` - Complete Database Wipe

Deletes ALL data from ALL collections in the database.

**Usage:**
```bash
cd server
node scripts/eraseAllData.js
```

**What it does:**
- Connects to MongoDB
- Deletes all documents from all YarnFlow collections
- Gives you 3 seconds to cancel (Ctrl+C)

**Collections affected:**
- categories
- customers
- suppliers
- products
- purchaseorders
- goodsreceiptnotes
- inventorylots
- salesorders
- saleschallans
- users
- counters

---

### 2. `eraseSelectedData.js` - Selective Data Cleanup

Interactive script that lets you choose which collections to erase.

**Usage:**
```bash
cd server
node scripts/eraseSelectedData.js
```

**What it does:**
- Shows you a menu of all collections
- Lets you select which ones to erase
- Asks for confirmation before deleting
- Safer than erasing everything

**Example:**
```
Available collections:

  1. categories          - Product Categories
  2. customers           - Customer Master Data
  3. suppliers           - Supplier Master Data
  4. products            - Product Master Data
  5. purchaseorders      - Purchase Orders
  6. goodsreceiptnotes   - Goods Receipt Notes (GRN)
  7. inventorylots       - Inventory Lots
  8. salesorders         - Sales Orders
  9. saleschallans       - Sales Challans
  10. users              - Users
  11. counters           - Auto-increment Counters

Enter collection numbers to erase (comma-separated)
Example: 5,6,7 (to erase POs, GRNs, and Inventory)
Or type "all" to erase everything

Your selection: 5,6,7
```

---

## Prerequisites

1. **MongoDB Connection**
   - Make sure your `.env` file has `MONGODB_URI` set
   - Example: `MONGODB_URI=mongodb://localhost:27017/yarnflow`

2. **Dependencies**
   - Run `npm install` in the server folder first
   - Requires: mongoose, dotenv

---

## Common Use Cases

### Reset Test Data
```bash
# Erase only transactional data, keep master data
node scripts/eraseSelectedData.js
# Select: 5,6,7,8,9 (POs, GRNs, Inventory, SOs, Challans)
```

### Fresh Start
```bash
# Erase everything
node scripts/eraseAllData.js
```

### Reset Counters
```bash
# Erase only counters (resets auto-increment numbers)
node scripts/eraseSelectedData.js
# Select: 11
```

---

## Safety Tips

1. **Always Backup First**
   ```bash
   mongodump --uri="your-mongodb-uri" --out=backup-$(date +%Y%m%d)
   ```

2. **Test on Development First**
   - Never run on production
   - Test with a copy of your database

3. **Use Selective Cleanup**
   - Prefer `eraseSelectedData.js` over `eraseAllData.js`
   - Only delete what you need

4. **Check Environment**
   ```bash
   # Make sure you're connected to the right database
   echo $MONGODB_URI
   ```

---

## Troubleshooting

### Error: MONGODB_URI not found
```bash
# Make sure .env file exists in server folder
cd server
cat .env | grep MONGODB_URI
```

### Error: Cannot connect to MongoDB
```bash
# Check if MongoDB is running
# For local: mongosh
# For Atlas: Check connection string
```

### Error: Collection not found
```bash
# Normal - means collection doesn't exist yet
# Script will skip it automatically
```

---

## Adding New Collections

To add new collections to the cleanup scripts:

1. Open `eraseAllData.js`
2. Add collection name to the `collections` array:
   ```javascript
   const collections = [
     'categories',
     'customers',
     // ... existing collections
     'yournewcollection'  // Add here
   ];
   ```

3. Open `eraseSelectedData.js`
4. Add to `availableCollections` object:
   ```javascript
   const availableCollections = {
     // ... existing collections
     12: { name: 'yournewcollection', description: 'Your Description' }
   };
   ```

---

## Support

If you encounter any issues:
1. Check MongoDB connection
2. Verify .env file
3. Check script permissions
4. Review error messages

---

**Remember: These scripts are powerful tools. Use them responsibly!** 🚨
