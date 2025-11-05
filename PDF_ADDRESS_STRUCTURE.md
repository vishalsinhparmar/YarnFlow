# PDF Address Structure - Delivery Challan

## How Addresses Work in the PDF

### PDF Layout Structure

```
┌─────────────────────────────────────────────────┐
│              YOUR COMPANY (Header)              │
│                  YarnFlow                       │
│        123 Business Street, Industrial Area     │
│        Mumbai, Maharashtra - 400001             │
│    Phone: +91 22 1234 5678 | Email: info@...   │
│            GSTIN: 27XXXXX1234X1Z5              │
├─────────────────────────────────────────────────┤
│           DELIVERY CHALLAN                      │
├─────────────────────────────────────────────────┤
│  Challan Details    │    Delivery To:           │
│  - Challan No       │    Customer Company Name  │
│  - Date             │    Street Address         │
│  - SO Reference     │    City, State - PIN      │
│  - Warehouse        │    Country                │
│  - Status           │    Contact: Person Name   │
│                     │    Phone: +91 XXXXXXXXXX  │
│                     │    Email: customer@...    │
├─────────────────────────────────────────────────┤
│  ITEMS TABLE                                    │
│  Products with quantities and weights           │
└─────────────────────────────────────────────────┘
```

## Address Sources

### 1. Company Address (Header - Your Company)
**Source**: Environment Variables (`.env` file)

```env
COMPANY_NAME=YarnFlow
COMPANY_ADDRESS=123 Business Street, Industrial Area
COMPANY_CITY=Mumbai, Maharashtra - 400001
COMPANY_PHONE=+91 22 1234 5678
COMPANY_EMAIL=info@yarnflow.com
COMPANY_GSTIN=27XXXXX1234X1Z5
```

**Purpose**: Shows who is sending the goods (your company)

**Displayed as**:
```
YarnFlow
123 Business Street, Industrial Area
Mumbai, Maharashtra - 400001
Phone: +91 22 1234 5678 | Email: info@yarnflow.com
GSTIN: 27XXXXX1234X1Z5
```

### 2. Customer Address (Delivery To)
**Source**: Database - Customer Record

**Database Fields Used**:
```javascript
customer: {
  companyName: "ABC Textiles Pvt Ltd",
  contactPerson: "Mr. Rajesh Kumar",
  email: "rajesh@abctextiles.com",
  phone: "+91 98765 43210",
  address: {
    street: "Plot No. 45, Sector 18",
    city: "Noida",
    state: "Uttar Pradesh",
    pincode: "201301",
    country: "India"
  },
  gstNumber: "09XXXXX1234X1Z5"
}
```

**Purpose**: Shows where the goods are being delivered (customer's location)

**Displayed as**:
```
Delivery To:
ABC Textiles Pvt Ltd
Plot No. 45, Sector 18
Noida, Uttar Pradesh - 201301
India
Contact: Mr. Rajesh Kumar
Phone: +91 98765 43210
Email: rajesh@abctextiles.com
```

## How It Works

### Backend Process

1. **Controller fetches challan data**:
```javascript
const challan = await SalesChallan.findById(id)
  .populate('customer', 'companyName contactPerson email phone address gstNumber')
  .populate('salesOrder', 'soNumber orderDate totalAmount')
  .populate('items.product', 'productName productCode');
```

2. **Company info from environment**:
```javascript
const companyInfo = {
  name: process.env.COMPANY_NAME || 'YarnFlow',
  address: process.env.COMPANY_ADDRESS || 'Business Address',
  city: process.env.COMPANY_CITY || 'City, State - PIN',
  phone: process.env.COMPANY_PHONE || '+91 XXXXXXXXXX',
  email: process.env.COMPANY_EMAIL || 'info@company.com',
  gstin: process.env.COMPANY_GSTIN || 'GSTIN Number'
};
```

3. **PDF generator uses both**:
```javascript
// Header: Your company info
doc.text(company.name, { align: 'center' });
doc.text(company.address, { align: 'center' });

// Delivery section: Customer address
doc.text('Delivery To:', rightColumnX);
doc.text(challan.customer.companyName, rightColumnX);
doc.text(challan.customer.address.street, rightColumnX);
doc.text(`${city}, ${state} - ${pincode}`, rightColumnX);
```

## Example PDF Output

### Real Example

**Header (Your Company)**:
```
YarnFlow
123 Business Street, Industrial Area
Mumbai, Maharashtra - 400001
Phone: +91 22 1234 5678 | Email: info@yarnflow.com
GSTIN: 27XXXXX1234X1Z5
```

**Delivery To (Customer)**:
```
Delivery To:
ABC Textiles Pvt Ltd
Plot No. 45, Sector 18
Noida, Uttar Pradesh - 201301
India
Contact: Mr. Rajesh Kumar
Phone: +91 98765 43210
Email: rajesh@abctextiles.com
```

## Data Flow Diagram

```
┌─────────────────┐
│  Environment    │
│  Variables      │ ──────┐
│  (.env file)    │       │
└─────────────────┘       │
                          ▼
                    ┌──────────────┐
                    │   Company    │
                    │   Info       │
                    │  (Header)    │
                    └──────────────┘
                          │
                          ▼
┌─────────────────┐  ┌──────────────┐  ┌─────────────┐
│   Database      │  │   PDF        │  │   Final     │
│   Customer      │─▶│   Generator  │─▶│   PDF       │
│   Record        │  │              │  │   Document  │
└─────────────────┘  └──────────────┘  └─────────────┘
      │                     ▲
      │                     │
      ▼                     │
┌─────────────────┐        │
│   Customer      │        │
│   Address       │────────┘
│  (Delivery To)  │
└─────────────────┘
```

## Important Notes

### ✅ What You Need to Set

**Only set your company details in `.env`**:
- Your company name
- Your company address
- Your company phone
- Your company email
- Your company GSTIN

### ✅ What is Automatic

**Customer address is automatically fetched**:
- From the customer record in database
- Based on the challan's customer reference
- No manual configuration needed
- Updates automatically when customer data changes

### ✅ Benefits of This Approach

1. **Dynamic**: Each challan shows the correct customer address
2. **No Duplication**: Customer address stored once in database
3. **Easy Updates**: Change customer address in one place
4. **Accurate**: Always shows current customer information
5. **Scalable**: Works for unlimited customers

## Customer Address Requirements

### Ensure Customer Records Have Complete Address

When creating/updating customers, ensure address fields are filled:

```javascript
// Customer creation/update
{
  companyName: "ABC Textiles Pvt Ltd",
  contactPerson: "Mr. Rajesh Kumar",
  email: "rajesh@abctextiles.com",
  phone: "+91 98765 43210",
  address: {
    street: "Plot No. 45, Sector 18",      // Required
    city: "Noida",                          // Required
    state: "Uttar Pradesh",                 // Required
    pincode: "201301",                      // Required
    country: "India"                        // Optional (defaults to India)
  },
  gstNumber: "09XXXXX1234X1Z5"             // Optional
}
```

### If Customer Address is Missing

The PDF will show:
- Company name (if available)
- "N/A" for missing address fields
- Contact details (if available)

**Recommendation**: Ensure all customers have complete address information for professional-looking PDFs.

## Testing

### Test with Complete Customer Data

1. Create a customer with full address
2. Create a sales order for that customer
3. Create a challan from that sales order
4. Generate PDF
5. Verify both addresses appear correctly

### Test with Incomplete Customer Data

1. Create a customer with minimal data
2. Generate PDF
3. Verify graceful handling of missing fields

## Summary

✅ **Header**: Your company (from `.env`)
✅ **Delivery To**: Customer address (from database)
✅ **Dynamic**: Each PDF shows correct customer address
✅ **Automatic**: No manual configuration per challan
✅ **Professional**: Clean, clear address display

This structure ensures every delivery challan shows:
- Who is sending (your company)
- Where it's going (customer's address)
- All relevant contact information

Perfect for logistics, delivery tracking, and customer records!
