#!/usr/bin/env node

/**
 * Cleanup Script: Remove duplicate movements from inventory lots
 * 
 * This script identifies and removes duplicate "Issued" movements
 * that cause negative weight issues.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.developement') });

// Import models
import InventoryLot from '../src/models/InventoryLot.js';

async function cleanupDuplicateMovements() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all lots
    const lots = await InventoryLot.find({});
    console.log(`📦 Found ${lots.length} inventory lots\n`);

    let lotsWithDuplicates = 0;
    let duplicatesRemoved = 0;

    // Check each lot for duplicate movements
    for (const lot of lots) {
      if (!lot.movements || lot.movements.length === 0) continue;

      // Group movements by reference
      const movementsByReference = {};
      lot.movements.forEach((m, idx) => {
        if (!movementsByReference[m.reference]) {
          movementsByReference[m.reference] = [];
        }
        movementsByReference[m.reference].push({ movement: m, index: idx });
      });

      // Find duplicates
      let hasChanges = false;
      const newMovements = [];
      const seenReferences = new Set();

      for (const movement of lot.movements) {
        const ref = movement.reference;
        
        // Keep only the first occurrence of each reference
        if (!seenReferences.has(ref)) {
          seenReferences.add(ref);
          newMovements.push(movement);
        } else {
          console.log(`  ⚠️ DUPLICATE: ${ref}`);
          duplicatesRemoved++;
          hasChanges = true;
        }
      }

      // If there were duplicates, update the lot
      if (hasChanges) {
        lotsWithDuplicates++;
        lot.movements = newMovements;
        
        // Recalculate weight
        const receivedWeight = lot.movements
          .filter(m => m.type === 'Received')
          .reduce((sum, m) => sum + (m.weight || 0), 0);
        
        const issuedWeight = lot.movements
          .filter(m => m.type === 'Issued')
          .reduce((sum, m) => sum + (m.weight || 0), 0);
        
        const balanceWeight = receivedWeight - issuedWeight;

        console.log(`\n✅ LOT FIXED: ${lot.lotNumber}`);
        console.log(`   Product: ${lot.productName}`);
        console.log(`   Movements before: ${lot.movements.length + duplicatesRemoved}`);
        console.log(`   Movements after: ${lot.movements.length}`);
        console.log(`   Received Weight: ${receivedWeight} KG`);
        console.log(`   Issued Weight: ${issuedWeight} KG`);
        console.log(`   Balance Weight: ${balanceWeight} KG`);

        // Save the cleaned lot
        await lot.save();
        console.log(`   ✅ Saved to database\n`);
      }
    }

    // Summary
    console.log('\n📊 CLEANUP SUMMARY');
    console.log(`Total lots: ${lots.length}`);
    console.log(`Lots with duplicates: ${lotsWithDuplicates}`);
    console.log(`Duplicate movements removed: ${duplicatesRemoved}`);

    if (lotsWithDuplicates === 0) {
      console.log('\n✅ No duplicate movements found!');
    } else {
      console.log('\n✅ Cleanup complete! All duplicates removed.');
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run cleanup
cleanupDuplicateMovements();
