# Excel Import Templates for YarnFlow

This document provides the expected format for importing data into YarnFlow using Excel files.

## Supported File Formats
- `.xlsx` (Excel 2007+)
- `.xls` (Excel 97-2003)
- `.csv` (Comma Separated Values)

## Import Templates

### 1. Customers Import Template

**Required Columns:**
- `companyName` (Required) - Name of the customer company

**Optional Columns:**
- `gstNumber` - GST registration number
- `panNumber` - PAN number (auto-extracted from GST if not provided)
- `city` - City name
- `notes` - Additional notes
- `status` - Active or Inactive (default: Active)

**Example:**
```
companyName       | gstNumber        | panNumber    | city      | notes              | status
ABC Textiles Ltd  | 24ABCDE1234F1Z5  | ABCDE1234F   | Mumbai    | Premium customer   | Active
XYZ Fabrics       | 27XYZAB5678G2Y4  | XYZAB5678G   | Delhi     | Regular orders     | Active
```

---

### 2. Suppliers Import Template

**Required Columns:**
- `companyName` (Required) - Name of the supplier company

**Optional Columns:**
- `gstNumber` - GST registration number
- `panNumber` - PAN number (auto-extracted from GST if not provided)
- `city` - City name
- `notes` - Additional notes
- `status` - Active, Inactive, or Blocked (default: Active)

**Example:**
```
companyName          | gstNumber        | panNumber    | city        | notes                | status
Cotton Suppliers Inc | 24COTTN1234F1Z5  | COTTN1234F   | Ahmedabad   | Quality supplier     | Active
Yarn Distributors    | 27YARND5678G2Y4  | YARND5678G   | Surat       | Fast delivery        | Active
```

---

### 3. Categories Import Template

**Required Columns:**
- `categoryName` (Required) - Name of the category

**Optional Columns:**
- `description` - Description of the category
- `status` - Active or Inactive (default: Active)

**Example:**
```
categoryName    | description                      | status
Cotton Yarn     | High quality cotton yarn         | Active
Polyester       | Synthetic polyester material     | Active
Blended Yarn    | Cotton-polyester blend           | Active
```

---

### 4. Products Import Template

**Required Columns:**
- `productName` (Required) - Name of the product
- `category` (Required) - Category name (must exist in the system)

**Optional Columns:**
- `description` - Product description
- `status` - Active, Inactive, or Discontinued (default: Active)

**Example:**
```
productName           | category      | description                    | status
30s Combed Cotton     | Cotton Yarn   | Premium combed cotton yarn     | Active
40s Ring Spun Cotton  | Cotton Yarn   | Ring spun cotton for fabrics   | Active
Polyester 150D        | Polyester     | 150 denier polyester yarn      | Active
```

---

## Import Behavior

### Duplicate Handling
The system automatically detects and handles duplicates:

**Customers & Suppliers:**
- Matched by GST Number (if provided)
- If no GST match, matched by Company Name (case-insensitive)
- Existing records are **updated** with new data
- New records are **inserted**

**Categories:**
- Matched by Category Name (case-insensitive)
- Existing records are **updated**
- New records are **inserted**

**Products:**
- Matched by Product Name (case-insensitive)
- Existing records are **updated**
- New records are **inserted**
- **Note:** Category must exist before importing products

### Import Results
After import, you'll see:
- ✓ **Inserted**: Number of new records created
- ↻ **Updated**: Number of existing records updated
- ⊘ **Skipped**: Number of rows skipped due to errors
- **Errors**: List of specific errors (if any)

---

## Tips for Successful Import

1. **Column Names**: Use exact column names as specified (case-sensitive)
2. **Required Fields**: Ensure all required columns have values
3. **Data Validation**: 
   - GST numbers should be 15 characters
   - Status values must match exactly (Active/Inactive/Blocked)
4. **Products**: Import categories before importing products
5. **File Size**: Keep files under 5MB
6. **Encoding**: Use UTF-8 encoding for CSV files
7. **First Row**: First row should contain column headers

---

## Common Errors and Solutions

| Error | Solution |
|-------|----------|
| "Missing company name" | Ensure companyName column has a value |
| "Category not found" | Import the category first, or check spelling |
| "Invalid file type" | Use .xlsx, .xls, or .csv files only |
| "Excel file is empty" | Ensure file has data rows (not just headers) |

---

## Example Workflow

1. **Prepare Your Data**: Create Excel file with proper columns
2. **Open Import Modal**: Click "Import Excel" button on Master Data page
3. **Select Type**: Choose data type (Customers/Suppliers/Products/Categories)
4. **Upload File**: Select your Excel file
5. **Review Results**: Check import summary for any errors
6. **Verify Data**: Navigate to respective management pages to verify

---

## Need Help?

If you encounter issues:
1. Check column names match exactly
2. Verify required fields are filled
3. Ensure file format is supported
4. Check error messages for specific row issues
5. For products, ensure categories exist first
