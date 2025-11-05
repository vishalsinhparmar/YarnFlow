# PDFKit Installation Guide

## Step 1: Install PDFKit

Navigate to your server directory and install PDFKit:

```bash
cd server
npm install pdfkit
```

## Step 2: Verify Installation

Check if PDFKit is installed correctly:

```bash
npm list pdfkit
```

You should see:
```
└── pdfkit@x.x.x
```

## Step 3: Add Environment Variables

Create or update your `.env` file in the server directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Company Information for PDF Generation (Your Company - Sender)
COMPANY_NAME=YarnFlow
COMPANY_ADDRESS=123 Business Street, Industrial Area
COMPANY_CITY=Mumbai, Maharashtra - 400001
COMPANY_PHONE=+91 22 1234 5678
COMPANY_EMAIL=info@yarnflow.com
COMPANY_GSTIN=27XXXXX1234X1Z5

# Note: Customer delivery address is automatically fetched from the database
# The PDF will show:
# - Header: Your company details (from above env variables)
# - Delivery To: Customer's address (from customer record in database)
```

## Step 4: Restart Server

After installing PDFKit and setting environment variables, restart your server:

```bash
# If using npm
npm run dev

# If using nodemon
nodemon server.js

# If using pm2
pm2 restart all
```

## Step 5: Test the Installation

### Test 1: Check Server Logs
Look for any errors related to PDFKit in your server console.

### Test 2: Test PDF Endpoint
Use curl or Postman to test the PDF generation:

```bash
# Replace {challanId} with an actual challan ID from your database
curl -X GET "http://localhost:5000/api/sales-challans/{challanId}/pdf/download" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output test_challan.pdf
```

### Test 3: Open in Browser
Navigate to:
```
http://localhost:5000/api/sales-challans/{challanId}/pdf/preview
```

## Troubleshooting

### Issue: "Cannot find module 'pdfkit'"

**Solution**:
```bash
cd server
npm install pdfkit --save
```

### Issue: "Module not found: Error: Can't resolve 'fs'"

**Solution**: This is normal for frontend. PDFKit should only be used on the backend (server).

### Issue: PDF shows "N/A" or "Unknown"

**Solution**: 
1. Check if environment variables are set correctly
2. Verify challan data has customer and salesOrder populated
3. Check database for complete data

### Issue: Server crashes when generating PDF

**Solution**:
1. Check server logs for specific error
2. Verify PDFKit is installed correctly
3. Ensure challan ID exists in database
4. Check if challan data is complete

### Issue: PDF downloads but is corrupted

**Solution**:
1. Check if response headers are set correctly
2. Verify buffer is generated properly
3. Check for any middleware interfering with response
4. Test with a simple challan first

## Dependencies

PDFKit has some peer dependencies that should be automatically installed:

```json
{
  "dependencies": {
    "pdfkit": "^0.13.0"
  }
}
```

If you encounter issues, you might need to install additional dependencies:

```bash
npm install fontkit png-js
```

## Verification Checklist

- [ ] PDFKit installed (`npm list pdfkit` shows version)
- [ ] Environment variables added to `.env`
- [ ] Server restarted
- [ ] No errors in server console
- [ ] Test PDF download works
- [ ] Test PDF preview works
- [ ] PDF contains correct data
- [ ] PDF is properly formatted

## Production Deployment

### For Production Environment

1. **Install PDFKit in production**:
```bash
npm install --production pdfkit
```

2. **Set production environment variables**:
```env
NODE_ENV=production
COMPANY_NAME=Your Company Name
COMPANY_ADDRESS=Your Company Address
COMPANY_CITY=Your City, State - PIN
COMPANY_PHONE=Your Phone
COMPANY_EMAIL=Your Email
COMPANY_GSTIN=Your GSTIN
```

3. **Build and deploy**:
```bash
npm run build
npm start
```

## Docker Setup (Optional)

If using Docker, add to your `Dockerfile`:

```dockerfile
# Install dependencies including PDFKit
RUN npm install

# Or specifically
RUN npm install pdfkit
```

And in `docker-compose.yml`:

```yaml
services:
  server:
    environment:
      - COMPANY_NAME=YarnFlow
      - COMPANY_ADDRESS=123 Business Street
      - COMPANY_CITY=Mumbai, Maharashtra - 400001
      - COMPANY_PHONE=+91 22 1234 5678
      - COMPANY_EMAIL=info@yarnflow.com
      - COMPANY_GSTIN=27XXXXX1234X1Z5
```

## Success Indicators

✅ Server starts without errors
✅ `npm list pdfkit` shows installed version
✅ Environment variables are set
✅ PDF download endpoint works
✅ PDF preview endpoint works
✅ Generated PDFs are valid and readable
✅ PDF contains correct company information
✅ PDF contains correct challan data

## Next Steps

After successful installation:

1. ✅ Test PDF generation with sample data
2. ✅ Integrate PDF buttons in frontend
3. ✅ Test with real challan data
4. ✅ Customize company information
5. ✅ Deploy to production

## Support

If you encounter any issues:

1. Check server logs for detailed errors
2. Verify all environment variables are set
3. Ensure challan data is complete in database
4. Test with a simple challan first
5. Check PDFKit documentation: https://pdfkit.org/

---

**Ready to generate professional Sales Challan PDFs! 🎉**
