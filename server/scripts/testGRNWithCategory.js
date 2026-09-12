import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import models and report functions
import GoodsReceiptNote from '../src/models/GoodsReceiptNote.js';
import { previewReport } from '../src/reports/report.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.developement') });

async function testGRNWithCategory() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test GRN report with category field
    console.log('Test: GRN Report with Category Field');
    const payload = {
      selectedFields: [
        'grnNumber',
        'poNumber',
        'receiptDate',
        'status',
        'supplierName',
        'itemProductName',
        'itemCategory',
        'itemSubProductName',
        'itemReceivedQuantity'
      ],
      filters: { condition: 'and', groups: [] },
      sort: [],
      dateRange: { period: 'today', startDate: '2026-09-01', endDate: '2026-09-01' }
    };

    const result = await previewReport('grn', payload, { page: 1, limit: 50 });
    
    console.log(`\nResult: ${result.total} GRNs found`);
    console.log('\nGRN Data:');
    if (result.data.length > 0) {
      result.data.forEach((grn, idx) => {
        console.log(`\nGRN ${idx + 1}:`);
        console.log(`  GRN Number: ${grn.grnNumber}`);
        console.log(`  PO Number: ${grn.poNumber}`);
        console.log(`  Supplier: ${grn.supplierName}`);
        console.log(`  Product: ${grn.itemProductName}`);
        console.log(`  Category: ${grn.itemCategory}`);
        console.log(`  Category Type: ${typeof grn.itemCategory}`);
        console.log(`  Sub Product: ${grn.itemSubProductName}`);
        console.log(`  Received Qty: ${grn.itemReceivedQuantity}`);
      });
    } else {
      console.log('No GRNs found');
    }

    console.log('\n✅ Test complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

testGRNWithCategory();
