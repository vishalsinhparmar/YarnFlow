import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import models
import InventoryLot from '../src/models/InventoryLot.js';
import WarehouseLocation from '../src/models/WarehouseLocation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.developement') });

async function testWarehouseQuery() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Simple query
    console.log('Test 1: Simple query - warehouse = "Godown - Maryadpatti"');
    const result1 = await InventoryLot.find({ warehouse: 'Godown - Maryadpatti' });
    console.log(`Found: ${result1.length} lots`);
    if (result1.length > 0) {
      console.log(`Sample lot: ${result1[0].lotNumber}, warehouse: "${result1[0].warehouse}"`);
    }

    // Test 2: Using $eq operator
    console.log('\nTest 2: Using $eq operator');
    const result2 = await InventoryLot.find({ warehouse: { $eq: 'Godown - Maryadpatti' } });
    console.log(`Found: ${result2.length} lots`);

    // Test 3: Check all warehouse values
    console.log('\nTest 3: All warehouse values in database');
    const allLots = await InventoryLot.find({}, { warehouse: 1, lotNumber: 1 });
    console.log(`Total lots: ${allLots.length}`);
    allLots.forEach(lot => {
      console.log(`  - ${lot.lotNumber}: warehouse="${lot.warehouse}"`);
    });

    // Test 4: Aggregation pipeline (like the report builder uses)
    console.log('\nTest 4: Aggregation pipeline with $match');
    const pipeline = [
      {
        $match: {
          warehouse: { $eq: 'Godown - Maryadpatti' }
        }
      },
      {
        $project: {
          lotNumber: 1,
          warehouse: 1,
          productName: 1
        }
      }
    ];
    const result4 = await InventoryLot.aggregate(pipeline);
    console.log(`Found: ${result4.length} lots`);
    result4.forEach(lot => {
      console.log(`  - ${lot.lotNumber}: warehouse="${lot.warehouse}"`);
    });

    // Test 5: Check warehouse field type
    console.log('\nTest 5: Warehouse field type check');
    const sample = await InventoryLot.findOne({});
    if (sample) {
      console.log(`Sample lot warehouse value: "${sample.warehouse}"`);
      console.log(`Type: ${typeof sample.warehouse}`);
      console.log(`Length: ${sample.warehouse?.length}`);
      console.log(`Hex dump: ${Buffer.from(sample.warehouse || '').toString('hex')}`);
    }

    console.log('\n✅ Test complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

testWarehouseQuery();
