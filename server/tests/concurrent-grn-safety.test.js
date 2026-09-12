import { expect } from 'chai';
import request from 'supertest';
import { app } from '../index.js';
import PurchaseOrder from '../src/models/PurchaseOrder.js';
import GoodsReceiptNote from '../src/models/GoodsReceiptNote.js';
import InventoryLot from '../src/models/InventoryLot.js';
import Product from '../src/models/Product.js';
import Supplier from '../src/models/Supplier.js';
import Category from '../src/models/Category.js';
import mongoose from 'mongoose';

describe('🔒 Concurrent GRN Safety Tests', () => {
  let authToken = '';
  let testPOId = '';
  let testProductId = '';
  let testSupplierId = '';
  let testCategoryId = '';
  let initialProductStock = 0;

  before(async () => {
    // Get auth token first
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@yarnflow.com',
        password: 'Admin@123'
      });
    
    if (!loginRes.body.data || !loginRes.body.data.token) {
      console.log('Login failed:', loginRes.body);
      throw new Error('Failed to get auth token');
    }
    authToken = loginRes.body.data.token;

    // Create test data
    const categoryRes = await request(app)
      .post('/api/master/category')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        categoryName: 'Test Category Concurrent',
        description: 'Test category for concurrent GRN tests'
      });
    
    if (!categoryRes.body.data || !categoryRes.body.data._id) {
      console.log('Category creation failed:', categoryRes.body);
      throw new Error('Failed to create category');
    }
    testCategoryId = categoryRes.body.data._id;

    const supplierRes = await request(app)
      .post('/api/master/supplier')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        companyName: 'Test Supplier Concurrent',
        gstNumber: 'GST123456789',
        email: 'supplier@concurrent.test',
        phone: '9999999999',
        address: 'Test Address'
      });
    
    if (!supplierRes.body.data || !supplierRes.body.data._id) {
      console.log('Supplier creation failed:', supplierRes.body);
      throw new Error('Failed to create supplier');
    }
    testSupplierId = supplierRes.body.data._id;

    const productRes = await request(app)
      .post('/api/master/product')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        productName: 'Test Product Concurrent',
        category: testCategoryId,
        unit: 'Bags',
        specifications: { weight: 50 }
      });
    
    if (!productRes.body.data || !productRes.body.data._id) {
      console.log('Product creation failed:', productRes.body);
      throw new Error('Failed to create product');
    }
    testProductId = productRes.body.data._id;

    // Get initial product stock
    const productDoc = await Product.findById(testProductId);
    initialProductStock = productDoc.inventory?.currentStock || 0;

    // Create PO with 3 units
    const poRes = await request(app)
      .post('/api/purchase-order')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        supplier: testSupplierId,
        orderDate: new Date().toISOString(),
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            product: testProductId,
            quantity: 3,
            weight: 150,
            unitPrice: 50,
            specifications: { weight: 50 }
          }
        ]
      });
    
    if (!poRes.body.data || !poRes.body.data._id) {
      console.log('PO creation failed:', poRes.body);
      throw new Error('Failed to create PO');
    }
    testPOId = poRes.body.data._id;
  });

  describe('🔄 Concurrent GRN Requests Against Same PO', () => {
    
    it('✅ Should prevent over-receipt when two GRNs are created concurrently', async function() {
      this.timeout(30000);

      // Create two concurrent GRN requests
      // GRN-A: 2 units
      // GRN-B: 2 units
      // Total: 4 units (exceeds PO quantity of 3)

      const grnAData = {
        purchaseOrder: testPOId,
        receiptDate: new Date().toISOString(),
        items: [
          {
            purchaseOrderItem: (await PurchaseOrder.findById(testPOId)).items[0]._id.toString(),
            product: testProductId,
            receivedQuantity: 2,
            receivedWeight: 100,
            receivedSubProductWeights: [50, 50],
            unitPrice: 50
          }
        ]
      };

      const grnBData = {
        purchaseOrder: testPOId,
        receiptDate: new Date().toISOString(),
        items: [
          {
            purchaseOrderItem: (await PurchaseOrder.findById(testPOId)).items[0]._id.toString(),
            product: testProductId,
            receivedQuantity: 2,
            receivedWeight: 100,
            receivedSubProductWeights: [50, 50],
            unitPrice: 50
          }
        ]
      };

      // Send both requests concurrently
      const [responseA, responseB] = await Promise.all([
        request(app)
          .post('/api/grn')
          .set('Authorization', `Bearer ${authToken}`)
          .send(grnAData),
        request(app)
          .post('/api/grn')
          .set('Authorization', `Bearer ${authToken}`)
          .send(grnBData)
      ]);

      console.log('\n🔍 Concurrent GRN Test Results:');
      console.log(`Response A Status: ${responseA.status}`);
      console.log(`Response B Status: ${responseB.status}`);

      // Check PO state
      const poAfter = await PurchaseOrder.findById(testPOId);
      console.log(`\nPO After Concurrent Requests:`);
      console.log(`  receivedQuantity: ${poAfter.items[0].receivedQuantity}`);
      console.log(`  pendingQuantity: ${poAfter.items[0].pendingQuantity}`);
      console.log(`  status: ${poAfter.status}`);

      // Check GRNs created
      const grnsCreated = await GoodsReceiptNote.find({ purchaseOrder: testPOId });
      console.log(`\nGRNs Created: ${grnsCreated.length}`);
      grnsCreated.forEach((grn, idx) => {
        console.log(`  GRN-${idx + 1}: ${grn.items[0].receivedQuantity} units`);
      });

      // Check inventory
      const inventoryLots = await InventoryLot.find({ purchaseOrder: testPOId });
      console.log(`\nInventory Lots: ${inventoryLots.length}`);
      let totalInventoryQuantity = 0;
      inventoryLots.forEach((lot, idx) => {
        console.log(`  Lot-${idx + 1}: ${lot.receivedQuantity} units`);
        totalInventoryQuantity += lot.receivedQuantity;
      });
      console.log(`  Total Inventory Quantity: ${totalInventoryQuantity}`);

      // Check product stock
      const productAfter = await Product.findById(testProductId);
      const stockIncrease = (productAfter.inventory?.currentStock || 0) - initialProductStock;
      console.log(`\nProduct Stock:`);
      console.log(`  Initial: ${initialProductStock}`);
      console.log(`  Final: ${productAfter.inventory?.currentStock || 0}`);
      console.log(`  Increase: ${stockIncrease}`);

      // CRITICAL ASSERTIONS
      console.log('\n🔒 Safety Assertions:');

      // The PO should never have more than 3 units received
      expect(poAfter.items[0].receivedQuantity).to.be.at.most(3, 
        'PO receivedQuantity should never exceed ordered quantity');
      console.log(`  ✅ PO receivedQuantity (${poAfter.items[0].receivedQuantity}) ≤ 3`);

      // Total inventory should never exceed 3 units
      expect(totalInventoryQuantity).to.be.at.most(3,
        'Total inventory quantity should never exceed ordered quantity');
      console.log(`  ✅ Total inventory (${totalInventoryQuantity}) ≤ 3`);

      // Product stock should never increase by more than 3
      expect(stockIncrease).to.be.at.most(3,
        'Product stock increase should never exceed ordered quantity');
      console.log(`  ✅ Stock increase (${stockIncrease}) ≤ 3`);

      // At least one request should succeed
      expect([responseA.status, responseB.status]).to.include.members([201, 400],
        'At least one request should succeed or one should be rejected');
      console.log(`  ✅ At least one request succeeded or one was rejected`);

      // If both succeeded, one must have been rejected for over-receipt
      if (responseA.status === 201 && responseB.status === 201) {
        // Both succeeded - this is only acceptable if total is ≤ 3
        expect(totalInventoryQuantity).to.equal(3,
          'If both GRNs succeeded, total must be exactly 3');
        console.log(`  ✅ Both GRNs succeeded with total = 3`);
      } else if (responseA.status === 201 && responseB.status === 400) {
        // A succeeded, B rejected
        expect(totalInventoryQuantity).to.equal(2,
          'If only A succeeded, inventory should be 2');
        console.log(`  ✅ GRN-A succeeded (2 units), GRN-B rejected`);
      } else if (responseA.status === 400 && responseB.status === 201) {
        // B succeeded, A rejected
        expect(totalInventoryQuantity).to.equal(2,
          'If only B succeeded, inventory should be 2');
        console.log(`  ✅ GRN-A rejected, GRN-B succeeded (2 units)`);
      } else {
        // Both rejected
        expect(totalInventoryQuantity).to.equal(0,
          'If both rejected, no inventory should be created');
        console.log(`  ✅ Both GRNs rejected`);
      }
    });

    it('✅ Should handle idempotent concurrent requests correctly', async function() {
      this.timeout(30000);

      // Create a new PO for this test
      const poRes = await request(app)
        .post('/api/purchase-order')
        .send({
          supplier: testSupplierId,
          orderDate: new Date().toISOString(),
          expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          items: [
            {
              product: testProductId,
              quantity: 5,
              weight: 250,
              unitPrice: 50,
              specifications: { weight: 50 }
            }
          ]
        });
      const testPOId2 = poRes.body.data._id;

      const grnData = {
        purchaseOrder: testPOId2,
        receiptDate: new Date().toISOString(),
        items: [
          {
            purchaseOrderItem: (await PurchaseOrder.findById(testPOId2)).items[0]._id.toString(),
            product: testProductId,
            receivedQuantity: 3,
            receivedWeight: 150,
            receivedSubProductWeights: [50, 50, 50],
            unitPrice: 50
          }
        ]
      };

      // Send the same request 3 times concurrently (simulating retries)
      const [response1, response2, response3] = await Promise.all([
        request(app)
          .post('/api/grn')
          .set('Authorization', `Bearer ${authToken}`)
          .send(grnData),
        request(app)
          .post('/api/grn')
          .set('Authorization', `Bearer ${authToken}`)
          .send(grnData),
        request(app)
          .post('/api/grn')
          .set('Authorization', `Bearer ${authToken}`)
          .send(grnData)
      ]);

      console.log('\n🔍 Idempotent Concurrent Request Test Results:');
      console.log(`Response 1 Status: ${response1.status}`);
      console.log(`Response 2 Status: ${response2.status}`);
      console.log(`Response 3 Status: ${response3.status}`);

      // Check how many GRNs were created
      const grnsCreated = await GoodsReceiptNote.find({ purchaseOrder: testPOId2 });
      console.log(`\nGRNs Created: ${grnsCreated.length}`);

      // Check inventory
      const inventoryLots = await InventoryLot.find({ purchaseOrder: testPOId2 });
      console.log(`Inventory Lots: ${inventoryLots.length}`);
      let totalInventoryQuantity = 0;
      inventoryLots.forEach((lot) => {
        totalInventoryQuantity += lot.receivedQuantity;
      });
      console.log(`Total Inventory Quantity: ${totalInventoryQuantity}`);

      // CRITICAL: Should have only 1 GRN and 1 inventory lot
      expect(grnsCreated.length).to.be.at.most(1,
        'Should create at most 1 GRN (idempotency)');
      console.log(`  ✅ GRNs created ≤ 1`);

      expect(inventoryLots.length).to.be.at.most(1,
        'Should create at most 1 inventory lot (idempotency)');
      console.log(`  ✅ Inventory lots created ≤ 1`);

      expect(totalInventoryQuantity).to.equal(3,
        'Total inventory should be exactly 3 (not 9 from 3 concurrent requests)');
      console.log(`  ✅ Total inventory = 3 (not duplicated)`);
    });
  });

  after(async () => {
    // Cleanup
    if (testPOId) {
      await PurchaseOrder.deleteMany({ _id: testPOId });
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
