import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import models and report functions
import InventoryLot from '../src/models/InventoryLot.js';
import { buildPreviewPipeline } from '../src/reports/report.queryBuilder.js';
import { getReportDefinition } from '../src/reports/report.registry.js';
import { validatePayload } from '../src/reports/report.validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.developement') });

async function testFullPipeline() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const definition = getReportDefinition('inventory_lots');
    
    // Test payload with warehouse filter
    const payload = {
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

    const validated = validatePayload(definition, payload);
    console.log('Validated payload:');
    console.log(JSON.stringify(validated, null, 2));

    const pagination = { page: 1, limit: 50, skip: 0 };
    const pipeline = buildPreviewPipeline(definition, validated, pagination);

    console.log('\n\nGenerated pipeline:');
    console.log(JSON.stringify(pipeline, null, 2));

    console.log('\n\nExecuting pipeline...');
    const result = await InventoryLot.aggregate(pipeline).allowDiskUse(true);
    console.log(`Result: ${result.length} documents`);
    if (result.length > 0) {
      console.log('First result:');
      console.log(JSON.stringify(result[0], null, 2));
    }

    console.log('\n✅ Test complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

testFullPipeline();
