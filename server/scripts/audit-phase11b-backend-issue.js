/**
 * PHASE 11B: Backend Audit Script
 * 
 * Diagnoses why getPurchaseOrderById is not returning remainingExpectedUnitWeights
 * for products like Flit Pati × 9
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PurchaseOrder from '../src/models/PurchaseOrder.js';
import { getRemainingExpectedUnitWeights } from '../src/utils/grnValidation.js';

dotenv.config({ path: '.env.developement' });

async function auditBackendIssue() {
  try {
    console.log('🔍 PHASE 11B: Backend Audit Starting...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find POs with sub-product weights
    const pos = await PurchaseOrder.find({
      'items.subProductWeights': { $exists: true, $ne: [] }
    }).limit(5);

    console.log(`📊 Found ${pos.length} POs with sub-product weights\n`);

    for (const po of pos) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📦 PO: ${po.poNumber}`);
      console.log(`${'='.repeat(80)}`);

      for (const item of po.items) {
        if (!item.subProductWeights || item.subProductWeights.length === 0) {
          continue;
        }

        const receivedQty = item.receivedQuantity || 0;
        const pendingQty = item.quantity - receivedQty;

        console.log(`\n  Product: ${item.productName}`);
        console.log(`  Ordered quantity: ${item.quantity}`);
        console.log(`  Received quantity: ${receivedQty}`);
        console.log(`  Pending quantity: ${pendingQty}`);
        console.log(`  Sub-product weights: [${item.subProductWeights.join(', ')}]`);

        // Test the helper function
        const remainingWeights = getRemainingExpectedUnitWeights(item, pendingQty);
        console.log(`  Remaining expected weights (from helper): [${remainingWeights.join(', ')}]`);

        // Manual calculation
        const startIdx = receivedQty;
        const endIdx = receivedQty + pendingQty;
        const manualRemaining = item.subProductWeights.slice(startIdx, endIdx);
        console.log(`  Remaining expected weights (manual calc): [${manualRemaining.join(', ')}]`);

        // Check if they match
        const match = JSON.stringify(remainingWeights) === JSON.stringify(manualRemaining);
        console.log(`  ✅ Helper function matches manual calc: ${match}`);

        // Check if the item has the field
        const hasField = 'remainingExpectedUnitWeights' in item;
        console.log(`  ⚠️  Item has remainingExpectedUnitWeights field: ${hasField}`);
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ Audit Complete\n');

    // Now test the actual API response
    if (pos.length > 0) {
      const testPO = pos[0];
      console.log(`\n🧪 Testing API response for PO: ${testPO.poNumber}`);
      console.log(`${'='.repeat(80)}\n`);

      // Simulate what getPurchaseOrderById does
      const enrichedItems = testPO.items.map(item => {
        const pendingQuantity = Math.max(0, item.quantity - (item.receivedQuantity || 0));
        const remainingExpectedUnitWeights = getRemainingExpectedUnitWeights(item, pendingQuantity);
        
        return {
          ...item.toObject(),
          remainingExpectedUnitWeights,
          pendingQuantity
        };
      });

      const enrichedPO = testPO.toObject();
      enrichedPO.items = enrichedItems;

      // Check the first item
      if (enrichedPO.items.length > 0) {
        const firstItem = enrichedPO.items[0];
        console.log(`First item in enriched response:`);
        console.log(`  Product: ${firstItem.productName}`);
        console.log(`  Remaining expected weights: [${(firstItem.remainingExpectedUnitWeights || []).join(', ')}]`);
        console.log(`  Pending quantity: ${firstItem.pendingQuantity}`);
        
        if (firstItem.remainingExpectedUnitWeights && firstItem.remainingExpectedUnitWeights.length > 0) {
          console.log(`  ✅ Backend enrichment would work correctly`);
        } else {
          console.log(`  ❌ Backend enrichment returns empty array`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

auditBackendIssue();
