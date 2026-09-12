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

async function checkWarehouseData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check warehouse locations
    console.log('\n📦 Checking WarehouseLocation collection...');
    const warehouses = await WarehouseLocation.find({});
    console.log(`Found ${warehouses.length} warehouses:`);
    warehouses.forEach(w => {
      console.log(`  - ${w.name} (code: ${w.code}, type: ${w.type})`);
    });

    // Check inventory lots
    console.log('\n📦 Checking InventoryLot warehouse field...');
    const lotsWithWarehouse = await InventoryLot.countDocuments({ 
      warehouse: { $exists: true, $ne: null, $ne: '' } 
    });
    const totalLots = await InventoryLot.countDocuments({});
    console.log(`Lots with warehouse: ${lotsWithWarehouse} / ${totalLots}`);

    // Check specific warehouse
    if (warehouses.length > 0) {
      const firstWarehouse = warehouses[0].name;
      console.log(`\n🔍 Checking for lots with warehouse: "${firstWarehouse}"`);
      const lotsWithFirstWarehouse = await InventoryLot.countDocuments({ 
        warehouse: firstWarehouse 
      });
      console.log(`Found ${lotsWithFirstWarehouse} lots with warehouse "${firstWarehouse}"`);

      // Show sample lot
      const sampleLot = await InventoryLot.findOne({ warehouse: firstWarehouse });
      if (sampleLot) {
        console.log(`\nSample lot:`);
        console.log(`  Lot Number: ${sampleLot.lotNumber}`);
        console.log(`  Warehouse: "${sampleLot.warehouse}"`);
        console.log(`  Product: ${sampleLot.productName}`);
      }
    }

    // Check for lots without warehouse
    console.log('\n⚠️  Checking for lots WITHOUT warehouse...');
    const lotsWithoutWarehouse = await InventoryLot.find({ 
      warehouse: { $exists: false } 
    }).limit(3);
    console.log(`Found ${lotsWithoutWarehouse.length} lots without warehouse field`);

    const lotsWithNullWarehouse = await InventoryLot.find({ 
      warehouse: null 
    }).limit(3);
    console.log(`Found ${lotsWithNullWarehouse.length} lots with null warehouse`);

    const lotsWithEmptyWarehouse = await InventoryLot.find({ 
      warehouse: '' 
    }).limit(3);
    console.log(`Found ${lotsWithEmptyWarehouse.length} lots with empty warehouse`);

    // Show all warehouse values in database
    console.log('\n📊 All warehouse values in database:');
    const distinctWarehouses = await InventoryLot.distinct('warehouse');
    if (distinctWarehouses.length === 0) {
      console.log('  ⚠️  No warehouse values found!');
    } else {
      distinctWarehouses.forEach(w => {
        console.log(`  - "${w}"`);
      });
    }

    console.log('\n✅ Check complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkWarehouseData();
