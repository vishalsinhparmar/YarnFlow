import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import models and report functions
import InventoryLot from '../src/models/InventoryLot.js';
import WarehouseLocation from '../src/models/WarehouseLocation.js';
import { previewReport } from '../src/reports/report.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.developement') });

async function testReportPreview() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: No filters
    console.log('Test 1: Report preview WITHOUT filters');
    const payload1 = {
      selectedFields: ['lotNumber', 'warehouse', 'productName'],
      filters: { condition: 'and', groups: [] },
      sort: [],
      dateRange: { period: 'today', startDate: '2026-09-01', endDate: '2026-09-01' }
    };
    const result1 = await previewReport('inventory_lots', payload1, { page: 1, limit: 50 });
    console.log(`Result: ${result1.total} lots found`);
    if (result1.data.length > 0) {
      console.log(`Sample: ${result1.data[0].lotNumber}, warehouse: ${result1.data[0].warehouse}`);
    }

    // Test 2: With warehouse filter
    console.log('\nTest 2: Report preview WITH warehouse filter');
    const payload2 = {
      selectedFields: ['lotNumber', 'warehouse', 'productName'],
      filters: {
        condition: 'and',
        groups: [{
          condition: 'and',
          filters: [{
            field: 'warehouse',
            operator: 'eq',
            value: 'Godown - Maryadpatti',
            valueTo: ''
          }]
        }]
      },
      sort: [],
      dateRange: { period: 'today', startDate: '2026-09-01', endDate: '2026-09-01' }
    };
    const result2 = await previewReport('inventory_lots', payload2, { page: 1, limit: 50 });
    console.log(`Result: ${result2.total} lots found`);
    if (result2.data.length > 0) {
      console.log(`Sample: ${result2.data[0].lotNumber}, warehouse: ${result2.data[0].warehouse}`);
    } else {
      console.log('⚠️  No results found!');
    }

    // Test 3: Check what the filter looks like after validation
    console.log('\nTest 3: Checking filter validation');
    const { validatePayload } = await import('../src/reports/report.validator.js');
    const { getReportDefinition } = await import('../src/reports/report.registry.js');
    
    const definition = getReportDefinition('inventory_lots');
    const validated = validatePayload(definition, payload2);
    console.log('Validated filters:');
    console.log(JSON.stringify(validated.filters, null, 2));

    console.log('\n✅ Test complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

testReportPreview();
