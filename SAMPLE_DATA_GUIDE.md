# Sample Excel Data Guide

## Quick Start: Create Your Import Files

### 1. Customers Sample Data

Create an Excel file named `customers_import.xlsx` with these columns and sample data:

| companyName | gstNumber | panNumber | city | notes | status |
|-------------|-----------|-----------|------|-------|--------|
| ABC Textiles Ltd | 24ABCDE1234F1Z5 | ABCDE1234F | Mumbai | Premium customer | Active |
| XYZ Fabrics | 27XYZAB5678G2Y4 | XYZAB5678G | Delhi | Regular orders | Active |
| PQR Industries | 29PQRST9012H3X6 | PQRST9012H | Bangalore | New customer | Active |
| LMN Garments | 24LMNOP3456I4W7 | LMNOP3456I | Pune | Wholesale buyer | Active |
| RST Exports | 27RSTUV7890J5V8 | RSTUV7890J | Chennai | Export orders | Active |

---

### 2. Suppliers Sample Data

Create an Excel file named `suppliers_import.xlsx`:

| companyName | gstNumber | panNumber | city | notes | status |
|-------------|-----------|-----------|------|-------|--------|
| Cotton Suppliers Inc | 24COTTN1234F1Z5 | COTTN1234F | Ahmedabad | Quality supplier | Active |
| Yarn Distributors | 27YARND5678G2Y4 | YARND5678G | Surat | Fast delivery | Active |
| Polyester Mills | 29POLYE9012H3X6 | POLYE9012H | Coimbatore | Bulk supplier | Active |
| Thread Manufacturers | 24THRED3456I4W7 | THRED3456I | Ludhiana | Reliable partner | Active |
| Fabric Wholesalers | 27FABRC7890J5V8 | FABRC7890J | Kolkata | Competitive pricing | Active |

---

### 3. Categories Sample Data

Create an Excel file named `categories_import.xlsx`:

| categoryName | description | status |
|--------------|-------------|--------|
| Cotton Yarn | High quality cotton yarn products | Active |
| Polyester | Synthetic polyester materials | Active |
| Blended Yarn | Cotton-polyester blend products | Active |
| Raw Cotton | Unprocessed raw cotton | Active |
| Finished Goods | Ready-to-use finished products | Active |
| Accessories | Thread, buttons, and accessories | Active |
| Dyed Yarn | Pre-dyed yarn products | Active |

---

### 4. Products Sample Data

**IMPORTANT**: Import categories first before importing products!

Create an Excel file named `products_import.xlsx`:

| productName | category | description | status |
|-------------|----------|-------------|--------|
| 30s Combed Cotton | Cotton Yarn | Premium combed cotton yarn | Active |
| 40s Ring Spun Cotton | Cotton Yarn | Ring spun cotton for fabrics | Active |
| 20s Carded Cotton | Cotton Yarn | Standard carded cotton yarn | Active |
| Polyester 150D | Polyester | 150 denier polyester yarn | Active |
| Polyester 75D | Polyester | 75 denier polyester yarn | Active |
| 60/40 Cotton Poly Blend | Blended Yarn | 60% cotton 40% polyester | Active |
| 50/50 Cotton Poly Blend | Blended Yarn | Equal blend cotton polyester | Active |
| Raw Cotton Bales | Raw Cotton | Unprocessed cotton bales | Active |
| Finished Fabric Rolls | Finished Goods | Ready-to-use fabric rolls | Active |
| Sewing Thread | Accessories | Multi-purpose sewing thread | Active |

---

## Step-by-Step Import Process

### Step 1: Prepare Excel Files
1. Open Microsoft Excel or Google Sheets
2. Create a new spreadsheet
3. Add column headers in the first row (exact names as shown above)
4. Add your data in subsequent rows
5. Save as `.xlsx` file

### Step 2: Import Categories (Do This First!)
1. Login to YarnFlow
2. Go to Master Data page
3. Click "Import Excel" button
4. Select "Categories" from dropdown
5. Upload `categories_import.xlsx`
6. Click "Import"
7. Wait for success message

### Step 3: Import Customers
1. Click "Import Excel" button again
2. Select "Customers" from dropdown
3. Upload `customers_import.xlsx`
4. Click "Import"
5. Verify import results

### Step 4: Import Suppliers
1. Click "Import Excel" button
2. Select "Suppliers" from dropdown
3. Upload `suppliers_import.xlsx`
4. Click "Import"
5. Verify import results

### Step 5: Import Products (Do This Last!)
1. Click "Import Excel" button
2. Select "Products" from dropdown
3. Upload `products_import.xlsx`
4. Click "Import"
5. Verify import results

---

## Tips for Creating Excel Files

### Using Microsoft Excel
1. File → New → Blank Workbook
2. Add headers in Row 1
3. Add data starting from Row 2
4. File → Save As → Excel Workbook (.xlsx)

### Using Google Sheets
1. Create new spreadsheet
2. Add headers and data
3. File → Download → Microsoft Excel (.xlsx)

### Using CSV
1. Create file in any text editor
2. Use comma-separated values
3. Save with `.csv` extension
4. Example:
   ```
   companyName,gstNumber,panNumber,city,notes,status
   ABC Textiles,24ABCDE1234F1Z5,ABCDE1234F,Mumbai,Premium,Active
   ```

---

## Common Mistakes to Avoid

❌ **Don't:**
- Skip required columns (companyName, categoryName, productName)
- Use different column names
- Import products before categories
- Include special characters in GST numbers
- Leave status field with invalid values

✅ **Do:**
- Use exact column names (case-sensitive)
- Fill all required fields
- Import categories before products
- Use valid status values (Active/Inactive)
- Keep file size under 5MB

---

## Validation Rules

### GST Number Format
- Should be 15 characters
- Format: 24ABCDE1234F1Z5
- First 2 digits: State code
- Next 10 characters: PAN
- Next 1 character: Entity number
- Last 2 characters: Checksum

### PAN Number Format
- Should be 10 characters
- Format: ABCDE1234F
- Auto-extracted from GST if not provided

### Status Values
- **Customers**: Active, Inactive
- **Suppliers**: Active, Inactive, Blocked
- **Categories**: Active, Inactive
- **Products**: Active, Inactive, Discontinued

---

## Testing Your Import

### Small Test First
1. Create Excel with just 2-3 rows
2. Import and verify
3. If successful, import full dataset

### Verify After Import
1. Go to respective management pages
2. Check if all records are visible
3. Verify data accuracy
4. Check for any missing records

### Handle Errors
1. Read error messages carefully
2. Fix errors in Excel file
3. Re-import (existing records will be updated)

---

## Example: Complete Workflow

```
Day 1: Setup Master Data
├── 1. Import Categories (7 categories)
├── 2. Import Suppliers (5 suppliers)
├── 3. Import Customers (5 customers)
└── 4. Import Products (10 products)

Day 2: Add More Data
├── 1. Create new Excel with additional data
├── 2. Import (system will update existing, add new)
└── 3. Verify all data is correct
```

---

## Need More Help?

Refer to:
- `IMPORT_TEMPLATES_README.md` - Detailed template specifications
- `EXCEL_IMPORT_FEATURE.md` - Technical implementation details

Or check the in-app guide when you click "Import Excel" button!
