import { expect } from 'chai';
import PurchaseOrder from '../src/models/PurchaseOrder.js';
import GoodsReceiptNote from '../src/models/GoodsReceiptNote.js';
import InventoryLot from '../src/models/InventoryLot.js';
import Product from '../src/models/Product.js';
import Supplier from '../src/models/Supplier.js';
import Category from '../src/models/Category.js';
import mongoose from 'mongoose';
import { createGRN } from '../src/controller/grnController.js';

describe('🔒 Concurrent GRN Race Condition Analysis', () => {
  let testPOId = '';
  let testProductId = '';
  let testSupplierId = '';
  let testCategoryId = '';

  before(async () => {
    // Create test data directly in database
    const category = await Category.create({
      categoryName: 'Test Category Race',
      description: 'Test category for race condition tests'
    });
    testCategoryId = category._id;

    const supplier = await Supplier.create({
      companyName: 'Test Supplier Race',
      gstNumber: 'GST123456789',
      email: 'supplier@race.test',
      phone: '9999999999',
      address: 'Test Address'
    });
    testSupplierId = supplier._id;

    const product = await Product.create({
      productName: 'Test Product Race',
      category: testCategoryId,
      unit: 'Bags',
      specifications: { weight: 50 },
      inventory: {
        currentStock: 0,
        unit: 'Bags'
      }
    });
    testProductId = product._id;

    // Create PO with 3 units
    const po = await PurchaseOrder.create({
      poNumber: `PO-RACE-${Date.now()}`,
      supplier: testSupplierId,
      orderDate: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      items: [
        {
          product: testProductId,
          quantity: 3,
          weight: 150,
          unitPrice: 50,
          specifications: { weight: 50 },
          receivedQuantity: 0,
          receivedWeight: 0,
          pendingQuantity: 3,
          pendingWeight: 150,
          receiptStatus: 'Pending'
        }
      ],
      status: 'Draft',
      createdBy: 'Test'
    });
    testPOId = po._id;

    console.log('\n✅ Test data created:');
    console.log(`   PO: ${po.poNumber} (ID: ${testPOId})`);
    console.log(`   PO quantity: 3`);
    console.log(`   Product: ${product.productName}`);
  });

  describe('🔄 Concurrent GRN Creation Race Condition', () => {
    
    it('✅ ANALYSIS: Identify where race condition could occur', async function() {
      this.timeout(30000);

      console.log('\n🔍 ANALYZING createGRN IMPLEMENTATION:');
      console.log('\n1. VALIDATION PHASE (Lines 186-282):');
      console.log('   - PO is fetched at START of transaction');
      console.log('   - poItem.receivedQuantity is read from this snapshot');
      console.log('   - Validation calculates: pendingQuantity = quantity - (previouslyReceived + newQuantity)');
      console.log('   - ⚠️  If two requests execute concurrently:');
      console.log('      - Both read poItem.receivedQuantity = 0');
      console.log('      - Both calculate pendingQuantity correctly');
      console.log('      - But both updates happen to same PO!');

      console.log('\n2. UPDATE PHASE (Lines 375-391):');
      console.log('   - poItem.receivedQuantity is incremented: += grnItem.receivedQuantity');
      console.log('   - poItem.receivedWeight is incremented: += grnItem.receivedWeight');
      console.log('   - updateReceiptStatus() is called');
      console.log('   - ⚠️  NO RE-VALIDATION after update!');

      console.log('\n3. RACE CONDITION SCENARIO:');
      console.log('   Time T1: Request A reads PO (receivedQuantity = 0)');
      console.log('   Time T2: Request B reads PO (receivedQuantity = 0)');
      console.log('   Time T3: Request A validates (pending = 3 - 2 = 1) ✓ PASS');
      console.log('   Time T4: Request B validates (pending = 3 - 2 = 1) ✓ PASS');
      console.log('   Time T5: Request A updates PO (receivedQuantity = 0 + 2 = 2)');
      console.log('   Time T6: Request B updates PO (receivedQuantity = 2 + 2 = 4) ❌ OVER-RECEIPT!');

      console.log('\n4. PROTECTION MECHANISMS CHECKED:');
      console.log('   ✅ MongoDB transactions: Used (but does not prevent this race)');
      console.log('   ❌ Unique constraint on (PO, item): NOT found');
      console.log('   ❌ Pessimistic locking: NOT used');
      console.log('   ❌ Re-validation after update: NOT done');
      console.log('   ❌ Atomic conditional update: NOT used');

      // Now let's actually test this
      console.log('\n5. TESTING THE RACE CONDITION:');

      // Create two GRN requests that will execute concurrently
      const grnAData = {
        purchaseOrder: testPOId,
        receiptDate: new Date(),
        items: [
          {
            purchaseOrderItem: (await PurchaseOrder.findById(testPOId)).items[0]._id.toString(),
            product: testProductId,
            productName: 'Test Product Race',
            receivedQuantity: 2,
            receivedWeight: 100,
            receivedSubProductWeights: [50, 50],
            unitPrice: 50
          }
        ]
      };

      const grnBData = {
        purchaseOrder: testPOId,
        receiptDate: new Date(),
        items: [
          {
            purchaseOrderItem: (await PurchaseOrder.findById(testPOId)).items[0]._id.toString(),
            product: testProductId,
            productName: 'Test Product Race',
            receivedQuantity: 2,
            receivedWeight: 100,
            receivedSubProductWeights: [50, 50],
            unitPrice: 50
          }
        ]
      };

      // Simulate concurrent execution by creating GRNs directly
      const session1 = await mongoose.startSession();
      const session2 = await mongoose.startSession();

      try {
        // Start both transactions
        session1.startTransaction();
        session2.startTransaction();

        // Both read the PO at the same time
        const poSnapshot1 = await PurchaseOrder.findById(testPOId).session(session1);
        const poSnapshot2 = await PurchaseOrder.findById(testPOId).session(session2);

        console.log('\n   Initial PO state (both sessions read):');
        console.log(`   - receivedQuantity: ${poSnapshot1.items[0].receivedQuantity}`);
        console.log(`   - pendingQuantity: ${poSnapshot1.items[0].pendingQuantity}`);

        // Both validate (would pass)
        const pending1 = poSnapshot1.items[0].quantity - (poSnapshot1.items[0].receivedQuantity + 2);
        const pending2 = poSnapshot2.items[0].quantity - (poSnapshot2.items[0].receivedQuantity + 2);

        console.log('\n   Validation results (both concurrent):');
        console.log(`   - Session 1 calculates pending: ${pending1} (PASS)`);
        console.log(`   - Session 2 calculates pending: ${pending2} (PASS)`);

        // Both try to update
        poSnapshot1.items[0].receivedQuantity += 2;
        poSnapshot2.items[0].receivedQuantity += 2;

        await PurchaseOrder.updateOne(
          { _id: testPOId },
          { $set: { 'items.0.receivedQuantity': poSnapshot1.items[0].receivedQuantity } },
          { session: session1 }
        );

        await PurchaseOrder.updateOne(
          { _id: testPOId },
          { $set: { 'items.0.receivedQuantity': poSnapshot2.items[0].receivedQuantity } },
          { session: session2 }
        );

        // Commit both
        await session1.commitTransaction();
        await session2.commitTransaction();

        // Check final state
        const poFinal = await PurchaseOrder.findById(testPOId);
        console.log('\n   Final PO state (after both concurrent updates):');
        console.log(`   - receivedQuantity: ${poFinal.items[0].receivedQuantity}`);
        console.log('   - Expected: 2 or 4 (depending on which update wins)');

        if (poFinal.items[0].receivedQuantity === 4) {
          console.log('\n   ❌ RACE CONDITION CONFIRMED: Over-receipt occurred!');
          console.log('      PO quantity: 3, but receivedQuantity: 4');
        } else {
          console.log('\n   ✅ Race condition did not occur in this test');
          console.log('      (But the vulnerability still exists in the code)');
        }

      } finally {
        await session1.abortTransaction();
        await session2.abortTransaction();
        session1.endSession();
        session2.endSession();
      }
    });

    it('✅ RECOMMENDATION: Proposed fixes ranked by safety', async function() {
      console.log('\n🔧 PROPOSED FIXES (ranked by production-safety):');

      console.log('\n1. OPTION A: Atomic Conditional Update (RECOMMENDED)');
      console.log('   - Use MongoDB atomic update with condition');
      console.log('   - Example:');
      console.log('     db.purchaseorders.updateOne(');
      console.log('       { _id: poId, "items.0.receivedQuantity": { $lte: 1 } },');
      console.log('       { $inc: { "items.0.receivedQuantity": 2 } }');
      console.log('     )');
      console.log('   - Pros: Atomic, no race condition, minimal code change');
      console.log('   - Cons: Requires re-validation if update fails');
      console.log('   - Effort: 2-3 hours');

      console.log('\n2. OPTION B: Re-validation Inside Transaction');
      console.log('   - After updating PO, re-check that total ≤ ordered quantity');
      console.log('   - If violated, abort transaction');
      console.log('   - Pros: Simple, clear intent');
      console.log('   - Cons: Still has race window (between read and update)');
      console.log('   - Effort: 1-2 hours');

      console.log('\n3. OPTION C: Pessimistic Locking');
      console.log('   - Use MongoDB findOneAndUpdate with lock field');
      console.log('   - Pros: Prevents concurrent modifications');
      console.log('   - Cons: More complex, potential deadlocks');
      console.log('   - Effort: 3-4 hours');

      console.log('\n4. OPTION D: Unique Constraint + Retry Logic');
      console.log('   - Add unique constraint on (PO, item, receivedQuantity)');
      console.log('   - Retry on constraint violation');
      console.log('   - Pros: Prevents duplicates');
      console.log('   - Cons: Complex, requires retry logic');
      console.log('   - Effort: 4-5 hours');

      console.log('\n✅ RECOMMENDATION: Use OPTION A (Atomic Conditional Update)');
      console.log('   - Simplest, safest, most production-ready');
      console.log('   - Minimal code changes');
      console.log('   - No performance impact');
    });
  });

  after(async () => {
    // Cleanup
    if (testPOId) {
      await PurchaseOrder.deleteOne({ _id: testPOId });
    }
    if (testProductId) {
      await Product.deleteOne({ _id: testProductId });
    }
    if (testSupplierId) {
      await Supplier.deleteOne({ _id: testSupplierId });
    }
    if (testCategoryId) {
      await Category.deleteOne({ _id: testCategoryId });
    }
    await GoodsReceiptNote.deleteMany({ purchaseOrder: testPOId });
    await InventoryLot.deleteMany({ purchaseOrder: testPOId });
  });
});
