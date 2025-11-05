/**
 * Selective Database Cleanup Script for YarnFlow
 * 
 * This script allows you to erase specific collections
 * Usage: node server/scripts/eraseSelectedData.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// YarnFlow Collections
const availableCollections = {
  1: { name: 'categories', description: 'Product Categories' },
  2: { name: 'customers', description: 'Customer Master Data' },
  3: { name: 'suppliers', description: 'Supplier Master Data' },
  4: { name: 'products', description: 'Product Master Data' },
  5: { name: 'purchaseorders', description: 'Purchase Orders' },
  6: { name: 'goodsreceiptnotes', description: 'Goods Receipt Notes (GRN)' },
  7: { name: 'inventorylots', description: 'Inventory Lots' },
  8: { name: 'salesorders', description: 'Sales Orders' },
  9: { name: 'saleschallans', description: 'Sales Challans' },
  10: { name: 'users', description: 'Users' },
  11: { name: 'counters', description: 'Auto-increment Counters' }
};

// Get MongoDB URI from environment variables
const MONGO_URI = "mongodb+srv://vishalsinh:vishalsinh@cluster0.gf66tvi.mongodb.net/yarnflow?retryWrites=true&w=majority&appName=Cluster0" || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Error: MONGODB_URI not found in environment variables');
  console.error('Please set MONGODB_URI in your .env file');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function eraseSelectedData() {
  try {
    console.log('\n🗑️  YarnFlow - Selective Data Erasure Tool\n');
    console.log('Available collections:\n');

    Object.entries(availableCollections).forEach(([key, { name, description }]) => {
      console.log(`  ${key}. ${name.padEnd(20)} - ${description}`);
    });

    console.log('\n📝 Enter collection numbers to erase (comma-separated)');
    console.log('   Example: 5,6,7 (to erase POs, GRNs, and Inventory)');
    console.log('   Or type "all" to erase everything\n');

    const answer = await question('Your selection: ');

    let collectionsToErase = [];

    if (answer.toLowerCase().trim() === 'all') {
      collectionsToErase = Object.values(availableCollections).map(c => c.name);
    } else {
      const selections = answer.split(',').map(s => s.trim());
      for (const sel of selections) {
        const num = parseInt(sel);
        if (availableCollections[num]) {
          collectionsToErase.push(availableCollections[num].name);
        }
      }
    }

    if (collectionsToErase.length === 0) {
      console.log('\n❌ No valid collections selected. Exiting...\n');
      rl.close();
      process.exit(0);
    }

    console.log('\n⚠️  WARNING: You are about to DELETE ALL DATA from:');
    collectionsToErase.forEach(col => console.log(`   - ${col}`));

    const confirm = await question('\n⚠️  Type "YES" to confirm: ');

    if (confirm.toUpperCase() !== 'YES') {
      console.log('\n❌ Operation cancelled. No data was deleted.\n');
      rl.close();
      process.exit(0);
    }

    // Connect to MongoDB
    console.log('\n🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    let totalDeleted = 0;

    // Delete data from selected collections
    for (const collectionName of collectionsToErase) {
      try {
        const collection = mongoose.connection.collection(collectionName);
        const result = await collection.deleteMany({});
        console.log(`✅ Erased ${result.deletedCount} documents from "${collectionName}"`);
        totalDeleted += result.deletedCount;
      } catch (err) {
        console.error(`❌ Error erasing "${collectionName}":`, err.message);
      }
    }

    console.log(`\n✅ Total documents erased: ${totalDeleted}`);
    console.log('✅ Data erasure completed successfully!\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
    rl.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    await mongoose.disconnect();
    rl.close();
    process.exit(1);
  }
}

// Run the script
eraseSelectedData();
