/**
 * Database Cleanup Script for YarnFlow
 * 
 * WARNING: This script will DELETE ALL DATA from the database!
 * Use with extreme caution - only for development/testing purposes.
 * 
 * Usage: node server/scripts/eraseAllData.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// YarnFlow Collections
const collections = [
  'categories',
  'customers',
  'suppliers',
  'products',
  'purchaseorders',
  'goodsreceiptnotes',
  'inventorylots',
  'salesorders',
  'saleschallans',
  'users',
  'counters'
];

// Get MongoDB URI from environment variables
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Error: MONGODB_URI not found in environment variables');
  console.error('Please set MONGODB_URI in your .env file');
  process.exit(1);
}

console.log('🔗 MongoDB URI:', MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')); // Hide password

async function eraseAllData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('⚠️  WARNING: This will DELETE ALL DATA from the following collections:');
    collections.forEach(col => console.log(`   - ${col}`));
    console.log('\n⏳ Starting data erasure in 3 seconds...\n');

    // Wait 3 seconds to give user time to cancel (Ctrl+C)
    await new Promise(resolve => setTimeout(resolve, 3000));

    let totalDeleted = 0;

    // Delete data from each collection
    for (const collectionName of collections) {
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
    console.log('✅ All data erased successfully!');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
eraseAllData();
