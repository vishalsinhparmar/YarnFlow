import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import models to register schemas
import InventoryLot from '../src/models/InventoryLot.js';
import WarehouseLocation from '../src/models/WarehouseLocation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.developement') });

async function populateWarehouseData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all warehouses
    const warehouses = await WarehouseLocation.find({});
    console.log(`\n📦 Found ${warehouses.length} warehouses`);

    if (warehouses.length === 0) {
      console.log('⚠️  No warehouses found! Creating default warehouse...');
      const defaultWarehouse = await WarehouseLocation.create({
        name: 'Godown - Maryadpatti',
        code: 'GDN-MAR',
        type: 'Godown',
        address: 'Maryadpatti',
        isActive: true
      });
      console.log(`✅ Created warehouse: ${defaultWarehouse.name}`);
      warehouses.push(defaultWarehouse);
    }

    // Check lots without warehouse
    const lotsWithoutWarehouse = await InventoryLot.countDocuments({ 
      warehouse: { $exists: false } 
    });
    const lotsWithNullWarehouse = await InventoryLot.countDocuments({ 
      warehouse: null 
    });
    const lotsWithEmptyWarehouse = await InventoryLot.countDocuments({ 
      warehouse: '' 
    });

    const totalEmpty = lotsWithoutWarehouse + lotsWithNullWarehouse + lotsWithEmptyWarehouse;
    console.log(`\n⚠️  Found ${totalEmpty} lots without warehouse data`);

    if (totalEmpty > 0) {
      console.log(`\n🔄 Populating warehouse data for empty lots...`);
      
      // Use the first warehouse for all empty lots
      const warehouseName = warehouses[0].name;
      console.log(`Using warehouse: "${warehouseName}"`);

      const result1 = await InventoryLot.updateMany(
        { warehouse: { $exists: false } },
        { $set: { warehouse: warehouseName } }
      );
      console.log(`✅ Updated ${result1.modifiedCount} lots without warehouse field`);

      const result2 = await InventoryLot.updateMany(
        { warehouse: null },
        { $set: { warehouse: warehouseName } }
      );
      console.log(`✅ Updated ${result2.modifiedCount} lots with null warehouse`);

      const result3 = await InventoryLot.updateMany(
        { warehouse: '' },
        { $set: { warehouse: warehouseName } }
      );
      console.log(`✅ Updated ${result3.modifiedCount} lots with empty warehouse`);
    }

    // Verify
    console.log('\n✅ Verification:');
    const lotsWithWarehouse = await InventoryLot.countDocuments({ 
      warehouse: { $exists: true, $ne: null, $ne: '' } 
    });
    const totalLots = await InventoryLot.countDocuments({});
    console.log(`Lots with warehouse: ${lotsWithWarehouse} / ${totalLots}`);

    const distinctWarehouses = await InventoryLot.distinct('warehouse');
    console.log(`\nWarehouse values in inventory lots:`);
    distinctWarehouses.forEach(w => {
      console.log(`  - "${w}"`);
    });

    console.log('\n✅ Population complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

populateWarehouseData();
