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

async function testLookup() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test the exact lookup that the report builder uses
    console.log('Test: Aggregation pipeline with $lookup');
    const pipeline = [
      {
        $lookup: {
          from: 'warehouselocations',
          localField: 'warehouse',
          foreignField: 'name',
          as: 'warehouse_lookup'
        }
      },
      {
        $unwind: {
          path: '$warehouse_lookup',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          warehouse: '$warehouse_lookup.name'
        }
      },
      {
        $project: {
          lotNumber: 1,
          warehouse: 1,
          warehouse_lookup: 1
        }
      }
    ];

    const result = await InventoryLot.aggregate(pipeline);
    console.log(`Found: ${result.length} lots`);
    result.forEach(lot => {
      console.log(`Lot: ${lot.lotNumber}`);
      console.log(`  warehouse: "${lot.warehouse}"`);
      console.log(`  warehouse_lookup: ${JSON.stringify(lot.warehouse_lookup)}`);
    });

    // Check WarehouseLocation data
    console.log('\n\nWarehouseLocation data:');
    const warehouses = await WarehouseLocation.find({}, { name: 1, code: 1 });
    warehouses.forEach(w => {
      console.log(`  - name: "${w.name}", code: "${w.code}"`);
    });

    // Test direct lookup
    console.log('\n\nDirect lookup test:');
    const directLookup = await InventoryLot.aggregate([
      {
        $match: { warehouse: 'Godown - Maryadpatti' }
      },
      {
        $lookup: {
          from: 'warehouselocations',
          localField: 'warehouse',
          foreignField: 'name',
          as: 'warehouse_lookup'
        }
      },
      {
        $project: {
          lotNumber: 1,
          warehouse: 1,
          warehouse_lookup: 1
        }
      }
    ]);
    console.log(`Found: ${directLookup.length} lots`);
    directLookup.forEach(lot => {
      console.log(`Lot: ${lot.lotNumber}`);
      console.log(`  warehouse: "${lot.warehouse}"`);
      console.log(`  warehouse_lookup: ${JSON.stringify(lot.warehouse_lookup)}`);
    });

    console.log('\n✅ Test complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

testLookup();
