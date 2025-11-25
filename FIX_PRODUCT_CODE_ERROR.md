# Fix Product Code Duplicate Key Error

## Problem
Getting error: `E11000 duplicate key error collection: yarnflow.products index: productCode_1 dup key: { productCode: null }`

## Root Cause
The database has an old unique index on `productCode` field, but the Product model no longer uses this field.

## Solution
Run the migration script to drop the old index:

### Windows (PowerShell):
```powershell
cd server
node src/scripts/dropProductCodeIndex.js
```

### Linux/Mac:
```bash
cd server
node src/scripts/dropProductCodeIndex.js
```

## What the script does:
1. Connects to MongoDB
2. Drops the `productCode_1` index from products collection
3. Lists remaining indexes
4. Closes connection

## Expected Output:
```
Connected to MongoDB
✓ Successfully dropped productCode_1 index

Remaining indexes:
  - {"_id":1}
  - {"category":1}

✓ Migration completed successfully
Database connection closed
```

## After Running:
- Product creation will work without errors
- Quick Add Product in PO form will work
- Product creation in Master Data will work

## Note:
This is a one-time fix. Once the index is dropped, you won't need to run this again.
