#!/usr/bin/env node

/**
 * Clean Inventory Data Script
 * Removes corrupted inventory data and resets counters
 * Run: node scripts/cleanInventoryData.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function cleanInventoryData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Collections to clean
    const collections = [
      'purchaseorders',
      'goodsreceiptnotes',
      'inventorylots',
      'salesorders',
      'saleschallans'
    ];

    console.log('\n🗑️  Cleaning inventory collections...\n');

    for (const collection of collections) {
      try {
        const result = await db.collection(collection).deleteMany({});
        console.log(`✅ ${collection}: Deleted ${result.deletedCount} documents`);
      } catch (err) {
        console.log(`⚠️  ${collection}: ${err.message}`);
      }
    }

    // Reset counters for document numbers
    console.log('\n🔄 Resetting counters...\n');
    const counterCollections = ['PO', 'GRN', 'SO', 'SC'];
    
    for (const counter of counterCollections) {
      try {
        const result = await db.collection('counters').deleteMany({ _id: counter });
        console.log(`✅ Counter ${counter}: Reset`);
      } catch (err) {
        console.log(`⚠️  Counter ${counter}: ${err.message}`);
      }
    }

    console.log('\n✅ Inventory data cleaned successfully!');
    console.log('📝 You can now create fresh test data with the fixed code.\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning inventory data:', error.message);
    process.exit(1);
  }
}

cleanInventoryData();
