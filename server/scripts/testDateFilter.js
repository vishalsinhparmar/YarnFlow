import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import models
import InventoryLot from '../src/models/InventoryLot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.developement') });

async function testDateFilter() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check inventory lot dates
    console.log('Test 1: Check inventory lot dates');
    const lots = await InventoryLot.find({}, { lotNumber: 1, receivedDate: 1, createdAt: 1 });
    lots.forEach(lot => {
      console.log(`Lot: ${lot.lotNumber}`);
      console.log(`  receivedDate: ${lot.receivedDate}`);
      console.log(`  createdAt: ${lot.createdAt}`);
    });

    // Test date range filter
    console.log('\n\nTest 2: Date range filter for 2026-09-01');
    const startDate = new Date('2026-09-01');
    const endDate = new Date('2026-09-01');
    endDate.setHours(23, 59, 59, 999);

    console.log(`Start: ${startDate}`);
    console.log(`End: ${endDate}`);

    const filtered = await InventoryLot.find({
      receivedDate: { $gte: startDate, $lte: endDate }
    });
    console.log(`Found: ${filtered.length} lots`);

    // Test with createdAt
    console.log('\n\nTest 3: Date range filter on createdAt');
    const filteredCreated = await InventoryLot.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });
    console.log(`Found: ${filteredCreated.length} lots`);

    // Test without date filter
    console.log('\n\nTest 4: No date filter');
    const all = await InventoryLot.find({});
    console.log(`Found: ${all.length} lots`);

    console.log('\n✅ Test complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

testDateFilter();
