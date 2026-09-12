import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import models
import GoodsReceiptNote from '../src/models/GoodsReceiptNote.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.developement') });

async function checkGRNWarehouse() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check GRNs
    console.log('Checking GRN warehouseLocation values:');
    const grns = await GoodsReceiptNote.find({});
    console.log(`Found ${grns.length} GRNs\n`);
    
    grns.forEach((grn, idx) => {
      console.log(`GRN ${idx + 1}: ${grn.grnNumber}`);
      console.log(`  warehouseLocation: ${grn.warehouseLocation}`);
      console.log(`  Type: ${typeof grn.warehouseLocation}`);
      console.log(`  Is ObjectId: ${mongoose.Types.ObjectId.isValid(grn.warehouseLocation)}`);
    });

    console.log('\n✅ Check complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

checkGRNWarehouse();
