/**
 * Migration Script: Fix Old Challan Movements
 * 
 * This script removes old "Issued" movements that were created before the completion logic fix.
 * Old challans deducted stock immediately (wrong behavior).
 * New logic only deducts when SO item is complete.
 * 
 * Run this ONCE after deploying the new code to clean up old data.
 */

import mongoose from 'mongoose';
import InventoryLot from '../models/InventoryLot.js';
import SalesChallan from '../models/SalesChallan.js';
import SalesOrder from '../models/SalesOrder.js';
import dotenv from 'dotenv';

dotenv.config();

const fixOldChallanMovements = async () => {
  try {
    console.log('🔧 Starting migration: Fix Old Challan Movements');
    console.log('=====================================\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find all inventory lots with "Issued" movements
    const lots = await InventoryLot.find({
      'movements.type': 'Issued'
    });

    console.log(`📦 Found ${lots.length} lots with "Issued" movements\n`);

    let lotsFixed = 0;
    let movementsRemoved = 0;

    for (const lot of lots) {
      let lotModified = false;
      const originalMovementCount = lot.movements.length;

      // Filter out old challan movements
      // Keep only movements that:
      // 1. Are not "Issued" type, OR
      // 2. Are "Issued" but reference multiple challans (new logic)
      const newMovements = lot.movements.filter(movement => {
        if (movement.type !== 'Issued') {
          return true; // Keep non-issued movements
        }

        // Check if this is a new-style movement (references multiple challans)
        const isNewStyle = movement.reference && movement.reference.includes(',');
        
        if (isNewStyle) {
          console.log(`  ✅ Keeping new-style movement: ${movement.reference}`);
          return true;
        }

        // This is an old-style movement (single challan reference)
        console.log(`  ❌ Removing old-style movement: ${movement.reference}`);
        movementsRemoved++;
        lotModified = true;
        return false;
      });

      if (lotModified) {
        // Recalculate current quantity
        // Start with received quantity and subtract all remaining issued movements
        let recalculatedQty = lot.receivedQuantity;
        
        for (const movement of newMovements) {
          if (movement.type === 'Issued') {
            recalculatedQty -= movement.quantity;
          }
        }

        lot.movements = newMovements;
        lot.currentQuantity = recalculatedQty;
        
        // Update status
        if (recalculatedQty === 0) {
          lot.status = 'Consumed';
        } else if (recalculatedQty > 0) {
          lot.status = 'Active';
        }

        await lot.save();
        lotsFixed++;

        console.log(`  📊 Lot ${lot.lotNumber}:`);
        console.log(`     Movements: ${originalMovementCount} → ${newMovements.length}`);
        console.log(`     Current Qty: ${lot.currentQuantity} ${lot.unit}`);
        console.log(`     Status: ${lot.status}\n`);
      }
    }

    console.log('\n=====================================');
    console.log('✅ Migration completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Lots processed: ${lots.length}`);
    console.log(`   - Lots fixed: ${lotsFixed}`);
    console.log(`   - Movements removed: ${movementsRemoved}`);
    console.log('=====================================\n');

    console.log('⚠️  IMPORTANT: Now create new challans to test the new logic!');
    console.log('   The system will deduct stock only when SO items are complete.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from database');
  }
};

// Run the migration
fixOldChallanMovements()
  .then(() => {
    console.log('\n✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
