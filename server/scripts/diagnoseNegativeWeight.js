#!/usr/bin/env node

/**
 * Diagnostic Script: Check for negative weight issues
 * 
 * This script identifies:
 * 1. Lots with negative balance weight
 * 2. Duplicate movements
 * 3. Incorrect weight calculations
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
import InventoryLot from '../models/InventoryLot.js';

async function diagnoseNegativeWeight() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all lots
    const lots = await InventoryLot.find({}).lean();
    console.log(`📦 Found ${lots.length} inventory lots\n`);

    let problemLotsCount = 0;
    const problemLots = [];

    // Check each lot
    for (const lot of lots) {
      const receivedWeight = (lot.movements || [])
        .filter(m => m.type === 'Received')
        .reduce((sum, m) => sum + (m.weight || 0), 0);

      const issuedWeight = (lot.movements || [])
        .filter(m => m.type === 'Issued')
        .reduce((sum, m) => sum + (m.weight || 0), 0);

      const balanceWeight = receivedWeight - issuedWeight;

      // Check for negative balance
      if (balanceWeight < 0) {
        problemLotsCount++;
        problemLots.push({
          lotNumber: lot.lotNumber,
          productName: lot.productName || 'Unknown',
          receivedWeight,
          issuedWeight,
          balanceWeight,
          movementCount: lot.movements?.length || 0,
          movements: lot.movements || []
        });

        console.log(`❌ PROBLEM LOT: ${lot.lotNumber}`);
        console.log(`   Product: ${lot.productName}`);
        console.log(`   Received Weight: ${receivedWeight} KG`);
        console.log(`   Issued Weight: ${issuedWeight} KG`);
        console.log(`   Balance Weight: ${balanceWeight} KG ❌ NEGATIVE!`);
        console.log(`   Total Movements: ${lot.movements?.length || 0}`);
        
        // Show all movements
        if (lot.movements && lot.movements.length > 0) {
          console.log(`   Movements:`);
          lot.movements.forEach((m, idx) => {
            console.log(`     ${idx + 1}. Type: ${m.type}, Qty: ${m.quantity}, Weight: ${m.weight}, Ref: ${m.reference}`);
          });
        }
        console.log('');
      }
    }

    // Summary
    console.log('\n📊 SUMMARY');
    console.log(`Total lots: ${lots.length}`);
    console.log(`Lots with negative weight: ${problemLotsCount}`);

    if (problemLotsCount > 0) {
      console.log('\n⚠️ PROBLEM LOTS FOUND:');
      problemLots.forEach(lot => {
        console.log(`\n${lot.lotNumber} (${lot.productName})`);
        console.log(`  Received: ${lot.receivedWeight} KG`);
        console.log(`  Issued: ${lot.issuedWeight} KG`);
        console.log(`  Balance: ${lot.balanceWeight} KG ❌`);
        
        // Check for duplicate movements
        const issuedMovements = lot.movements.filter(m => m.type === 'Issued');
        const referenceMap = {};
        let duplicateCount = 0;
        
        issuedMovements.forEach(m => {
          if (referenceMap[m.reference]) {
            duplicateCount++;
            console.log(`  ⚠️ DUPLICATE: ${m.reference}`);
          }
          referenceMap[m.reference] = true;
        });
        
        if (duplicateCount === 0) {
          console.log(`  ℹ️ No duplicate movements found`);
          console.log(`  ℹ️ Issue might be: incorrect weight recorded or old data`);
        }
      });
    } else {
      console.log('\n✅ No lots with negative weight found!');
    }

    await mongoose.connection.close();
    console.log('\n✅ Diagnostic complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run diagnostic
diagnoseNegativeWeight();
