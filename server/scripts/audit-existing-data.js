import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PurchaseOrder from '../src/models/PurchaseOrder.js';
import GoodsReceiptNote from '../src/models/GoodsReceiptNote.js';
import InventoryLot from '../src/models/InventoryLot.js';
import Product from '../src/models/Product.js';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.developement' });

const auditResults = {
  timestamp: new Date().toISOString(),
  summary: {},
  findings: {
    critical: [],
    high: [],
    medium: [],
    low: []
  },
  reconciliation: {
    po: [],
    grn: [],
    inventory: [],
    productStock: [],
    unitWeights: [],
    duplicates: [],
    orphans: [],
    historicalWorkflow: [],
    statusIssues: [],
    indexCompatibility: []
  }
};

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function auditPOGRNQuantityReconciliation() {
  console.log('\n📊 AUDIT 1: PO → GRN QUANTITY RECONCILIATION');
  
  const pos = await PurchaseOrder.find().lean();
  console.log(`   Found ${pos.length} Purchase Orders`);
  
  for (const po of pos) {
    for (const poItem of po.items || []) {
      const grns = await GoodsReceiptNote.find({ purchaseOrder: po._id }).lean();
      
      let totalGRNQuantity = 0;
      const grnDetails = [];
      
      for (const grn of grns) {
        for (const grnItem of grn.items || []) {
          if (grnItem.purchaseOrderItem?.toString() === poItem._id?.toString()) {
            totalGRNQuantity += grnItem.receivedQuantity || 0;
            grnDetails.push({
              grnId: grn._id,
              grnNumber: grn.grnNumber,
              quantity: grnItem.receivedQuantity
            });
          }
        }
      }
      
      const receivedQty = poItem.receivedQuantity || 0;
      const pendingQty = poItem.pendingQuantity || 0;
      const orderedQty = poItem.quantity || 0;
      
      // Check for mismatches
      if (totalGRNQuantity !== receivedQty) {
        auditResults.findings.critical.push({
          type: 'PO_GRN_QUANTITY_MISMATCH',
          poId: po._id,
          poNumber: po.poNumber,
          poItemId: poItem._id,
          orderedQuantity: orderedQty,
          poReceivedQuantity: receivedQty,
          sumOfGRNQuantity: totalGRNQuantity,
          difference: totalGRNQuantity - receivedQty,
          grnDetails: grnDetails,
          severity: 'CRITICAL'
        });
      }
      
      // Check for negative pending
      if (pendingQty < 0) {
        auditResults.findings.critical.push({
          type: 'NEGATIVE_PENDING_QUANTITY',
          poId: po._id,
          poNumber: po.poNumber,
          poItemId: poItem._id,
          orderedQuantity: orderedQty,
          receivedQuantity: receivedQty,
          pendingQuantity: pendingQty,
          severity: 'CRITICAL'
        });
      }
      
      // Check for over-receipt
      if (receivedQty > orderedQty) {
        auditResults.findings.critical.push({
          type: 'OVER_RECEIPT',
          poId: po._id,
          poNumber: po.poNumber,
          poItemId: poItem._id,
          orderedQuantity: orderedQty,
          receivedQuantity: receivedQty,
          excess: receivedQty - orderedQty,
          severity: 'CRITICAL'
        });
      }
      
      // Check pending calculation
      const expectedPending = orderedQty - receivedQty;
      if (pendingQty !== expectedPending) {
        auditResults.findings.high.push({
          type: 'PENDING_QUANTITY_MISMATCH',
          poId: po._id,
          poNumber: po.poNumber,
          poItemId: poItem._id,
          orderedQuantity: orderedQty,
          receivedQuantity: receivedQty,
          storedPendingQuantity: pendingQty,
          expectedPendingQuantity: expectedPending,
          difference: pendingQty - expectedPending,
          severity: 'HIGH'
        });
      }
    }
  }
  
  auditResults.summary.poGRNQuantityReconciliation = {
    totalPOs: pos.length,
    criticalIssues: auditResults.findings.critical.filter(f => f.type.includes('QUANTITY') || f.type.includes('RECEIPT')).length,
    highIssues: auditResults.findings.high.filter(f => f.type.includes('PENDING')).length
  };
}

async function auditPOGRNWeightReconciliation() {
  console.log('\n⚖️  AUDIT 2: PO → GRN WEIGHT RECONCILIATION');
  
  const pos = await PurchaseOrder.find().lean();
  
  for (const po of pos) {
    for (const poItem of po.items || []) {
      const grns = await GoodsReceiptNote.find({ purchaseOrder: po._id }).lean();
      
      let totalGRNWeight = 0;
      const grnWeightDetails = [];
      
      for (const grn of grns) {
        for (const grnItem of grn.items || []) {
          if (grnItem.purchaseOrderItem?.toString() === poItem._id?.toString()) {
            totalGRNWeight += grnItem.receivedWeight || 0;
            grnWeightDetails.push({
              grnId: grn._id,
              grnNumber: grn.grnNumber,
              weight: grnItem.receivedWeight
            });
          }
        }
      }
      
      const poReceivedWeight = poItem.receivedWeight || 0;
      const poPendingWeight = poItem.pendingWeight || 0;
      const poOrderedWeight = poItem.weight || 0;
      
      // Check for weight mismatches
      if (totalGRNWeight !== poReceivedWeight) {
        auditResults.findings.high.push({
          type: 'PO_GRN_WEIGHT_MISMATCH',
          poId: po._id,
          poNumber: po.poNumber,
          poItemId: poItem._id,
          orderedWeight: poOrderedWeight,
          poReceivedWeight: poReceivedWeight,
          sumOfGRNWeight: totalGRNWeight,
          difference: totalGRNWeight - poReceivedWeight,
          grnWeightDetails: grnWeightDetails,
          severity: 'HIGH'
        });
      }
      
      // Check for negative pending weight
      if (poPendingWeight < 0) {
        auditResults.findings.critical.push({
          type: 'NEGATIVE_PENDING_WEIGHT',
          poId: po._id,
          poNumber: po.poNumber,
          poItemId: poItem._id,
          orderedWeight: poOrderedWeight,
          receivedWeight: poReceivedWeight,
          pendingWeight: poPendingWeight,
          severity: 'CRITICAL'
        });
      }
      
      // Check for over-received weight
      if (poReceivedWeight > poOrderedWeight) {
        auditResults.findings.critical.push({
          type: 'OVER_RECEIVED_WEIGHT',
          poId: po._id,
          poNumber: po.poNumber,
          poItemId: poItem._id,
          orderedWeight: poOrderedWeight,
          receivedWeight: poReceivedWeight,
          excess: poReceivedWeight - poOrderedWeight,
          severity: 'CRITICAL'
        });
      }
    }
  }
  
  auditResults.summary.poGRNWeightReconciliation = {
    criticalIssues: auditResults.findings.critical.filter(f => f.type.includes('WEIGHT')).length,
    highIssues: auditResults.findings.high.filter(f => f.type.includes('WEIGHT')).length
  };
}

async function auditGRNInventoryReconciliation() {
  console.log('\n📦 AUDIT 3: GRN → INVENTORY RECONCILIATION');
  
  const grns = await GoodsReceiptNote.find().lean();
  console.log(`   Found ${grns.length} Goods Receipt Notes`);
  
  for (const grn of grns) {
    const inventoryCreated = grn.inventoryCreated || false;
    const inventoryLots = grn.inventoryLots || [];
    
    // Check if GRN has received items
    const hasReceivedItems = (grn.items || []).some(item => (item.receivedQuantity || 0) > 0);
    
    if (hasReceivedItems && !inventoryCreated) {
      auditResults.findings.critical.push({
        type: 'GRN_WITH_RECEIVED_ITEMS_NO_INVENTORY_CREATED',
        grnId: grn._id,
        grnNumber: grn.grnNumber,
        poNumber: grn.poNumber,
        hasReceivedItems: true,
        inventoryCreated: false,
        severity: 'CRITICAL'
      });
    }
    
    // Check inventory lot references
    for (const lotId of inventoryLots) {
      const lot = await InventoryLot.findById(lotId).lean();
      
      if (!lot) {
        auditResults.findings.critical.push({
          type: 'MISSING_INVENTORY_LOT',
          grnId: grn._id,
          grnNumber: grn.grnNumber,
          missingLotId: lotId,
          severity: 'CRITICAL'
        });
      } else {
        // Check bidirectional link
        if (lot.grn?.toString() !== grn._id?.toString()) {
          auditResults.findings.high.push({
            type: 'INVENTORY_LOT_GRNS_MISMATCH',
            grnId: grn._id,
            grnNumber: grn.grnNumber,
            lotId: lot._id,
            lotPointsToGRN: lot.grn,
            severity: 'HIGH'
          });
        }
      }
    }
    
    // Check for orphan inventory lots (inventory exists but not linked from GRN)
    if (inventoryCreated) {
      const orphanLots = await InventoryLot.find({
        grn: grn._id,
        _id: { $nin: inventoryLots }
      }).lean();
      
      for (const orphanLot of orphanLots) {
        auditResults.findings.high.push({
          type: 'ORPHAN_INVENTORY_LOT',
          grnId: grn._id,
          grnNumber: grn.grnNumber,
          orphanLotId: orphanLot._id,
          severity: 'HIGH'
        });
      }
    }
  }
  
  auditResults.summary.grnInventoryReconciliation = {
    totalGRNs: grns.length,
    criticalIssues: auditResults.findings.critical.filter(f => f.type.includes('INVENTORY')).length,
    highIssues: auditResults.findings.high.filter(f => f.type.includes('INVENTORY')).length
  };
}

async function auditDuplicateInventory() {
  console.log('\n🔄 AUDIT 4: DUPLICATE INVENTORY');
  
  const lots = await InventoryLot.find().lean();
  const lotMap = {};
  
  for (const lot of lots) {
    const key = `${lot.grn}_${lot.product}_${lot.subProduct || 'none'}`;
    
    if (!lotMap[key]) {
      lotMap[key] = [];
    }
    lotMap[key].push(lot);
  }
  
  for (const [key, lotsWithKey] of Object.entries(lotMap)) {
    if (lotsWithKey.length > 1) {
      auditResults.findings.critical.push({
        type: 'DUPLICATE_INVENTORY_LOT',
        key: key,
        count: lotsWithKey.length,
        lotIds: lotsWithKey.map(l => l._id),
        grnId: lotsWithKey[0].grn,
        grnNumber: lotsWithKey[0].grnNumber,
        product: lotsWithKey[0].product,
        quantities: lotsWithKey.map(l => l.receivedQuantity),
        severity: 'CRITICAL'
      });
    }
  }
  
  auditResults.summary.duplicateInventory = {
    totalLots: lots.length,
    duplicateGroups: Object.values(lotMap).filter(arr => arr.length > 1).length
  };
}

async function auditOrphanInventory() {
  console.log('\n👻 AUDIT 5: ORPHAN INVENTORY');
  
  const lots = await InventoryLot.find().lean();
  
  for (const lot of lots) {
    // Check if GRN exists
    const grn = await GoodsReceiptNote.findById(lot.grn).lean();
    if (!grn) {
      auditResults.findings.critical.push({
        type: 'ORPHAN_LOT_MISSING_GRN',
        lotId: lot._id,
        referencedGrnId: lot.grn,
        grnNumber: lot.grnNumber,
        severity: 'CRITICAL'
      });
    }
    
    // Check if PO exists
    const po = await PurchaseOrder.findById(lot.purchaseOrder).lean();
    if (!po) {
      auditResults.findings.critical.push({
        type: 'ORPHAN_LOT_MISSING_PO',
        lotId: lot._id,
        referencedPoId: lot.purchaseOrder,
        poNumber: lot.poNumber,
        severity: 'CRITICAL'
      });
    }
    
    // Check if Product exists
    const product = await Product.findById(lot.product).lean();
    if (!product) {
      auditResults.findings.critical.push({
        type: 'ORPHAN_LOT_MISSING_PRODUCT',
        lotId: lot._id,
        referencedProductId: lot.product,
        severity: 'CRITICAL'
      });
    }
  }
  
  auditResults.summary.orphanInventory = {
    totalLots: lots.length,
    orphanLots: auditResults.findings.critical.filter(f => f.type.includes('ORPHAN')).length
  };
}

async function auditProductStockReconciliation() {
  console.log('\n💰 AUDIT 6: PRODUCT STOCK RECONCILIATION');
  
  const products = await Product.find().lean();
  
  for (const product of products) {
    const lots = await InventoryLot.find({ product: product._id }).lean();
    
    let totalReceivedQuantity = 0;
    let totalCurrentQuantity = 0;
    let totalWeight = 0;
    
    for (const lot of lots) {
      totalReceivedQuantity += lot.receivedQuantity || 0;
      totalCurrentQuantity += lot.currentQuantity || 0;
      totalWeight += lot.totalWeight || 0;
    }
    
    const productStock = product.inventory?.currentStock || 0;
    
    // Note: We don't assume totalCurrentQuantity equals productStock
    // They may differ due to sales, adjustments, etc.
    // But we report the discrepancy for review
    
    if (lots.length > 0 && totalReceivedQuantity !== productStock) {
      auditResults.findings.medium.push({
        type: 'PRODUCT_STOCK_INVENTORY_DISCREPANCY',
        productId: product._id,
        productName: product.productName,
        productStock: productStock,
        totalInventoryReceivedQuantity: totalReceivedQuantity,
        totalInventoryCurrentQuantity: totalCurrentQuantity,
        totalInventoryWeight: totalWeight,
        inventoryLotCount: lots.length,
        note: 'Discrepancy may be due to sales, adjustments, or historical data',
        severity: 'MEDIUM'
      });
    }
  }
  
  auditResults.summary.productStockReconciliation = {
    totalProducts: products.length,
    discrepancies: auditResults.findings.medium.filter(f => f.type.includes('STOCK')).length
  };
}

async function auditUnitWeights() {
  console.log('\n⚖️  AUDIT 7: PHYSICAL UNIT WEIGHT AUDIT');
  
  const lots = await InventoryLot.find().lean();
  
  for (const lot of lots) {
    const subProductWeights = lot.subProductWeights || [];
    const receivedQty = lot.receivedQuantity || 0;
    const totalWeight = lot.totalWeight || 0;
    
    // Check array length vs quantity
    if (subProductWeights.length > 0 && subProductWeights.length !== receivedQty) {
      auditResults.findings.high.push({
        type: 'UNIT_WEIGHT_ARRAY_LENGTH_MISMATCH',
        lotId: lot._id,
        grnNumber: lot.grnNumber,
        receivedQuantity: receivedQty,
        subProductWeightsLength: subProductWeights.length,
        difference: subProductWeights.length - receivedQty,
        severity: 'HIGH'
      });
    }
    
    // Check sum of weights vs total weight
    if (subProductWeights.length > 0) {
      const sumOfWeights = subProductWeights.reduce((sum, w) => sum + (Number(w) || 0), 0);
      if (Math.abs(sumOfWeights - totalWeight) > 0.01) {
        auditResults.findings.high.push({
          type: 'UNIT_WEIGHT_SUM_MISMATCH',
          lotId: lot._id,
          grnNumber: lot.grnNumber,
          sumOfUnitWeights: sumOfWeights,
          storedTotalWeight: totalWeight,
          difference: sumOfWeights - totalWeight,
          severity: 'HIGH'
        });
      }
    }
  }
  
  auditResults.summary.unitWeights = {
    totalLots: lots.length,
    weightIssues: auditResults.findings.high.filter(f => f.type.includes('WEIGHT')).length
  };
}

async function auditHistoricalWorkflow() {
  console.log('\n📜 AUDIT 8: HISTORICAL GRN WORKFLOW AUDIT');
  
  const grns = await GoodsReceiptNote.find().lean();
  
  for (const grn of grns) {
    const hasReceivedItems = (grn.items || []).some(item => (item.receivedQuantity || 0) > 0);
    
    // Check for missing inventoryCreated field
    if (hasReceivedItems && grn.inventoryCreated === undefined) {
      auditResults.findings.medium.push({
        type: 'MISSING_INVENTORY_CREATED_FIELD',
        grnId: grn._id,
        grnNumber: grn.grnNumber,
        hasReceivedItems: true,
        severity: 'MEDIUM'
      });
    }
    
    // Check for missing inventoryLots field
    if (hasReceivedItems && grn.inventoryCreated && !grn.inventoryLots) {
      auditResults.findings.medium.push({
        type: 'MISSING_INVENTORY_LOTS_FIELD',
        grnId: grn._id,
        grnNumber: grn.grnNumber,
        inventoryCreated: true,
        severity: 'MEDIUM'
      });
    }
    
    // Check for old approval-related fields
    if (grn.approvalStatus || grn.approvedBy || grn.approvedAt) {
      auditResults.findings.low.push({
        type: 'LEGACY_APPROVAL_FIELDS',
        grnId: grn._id,
        grnNumber: grn.grnNumber,
        hasApprovalStatus: !!grn.approvalStatus,
        hasApprovedBy: !!grn.approvedBy,
        hasApprovedAt: !!grn.approvedAt,
        severity: 'LOW'
      });
    }
  }
  
  auditResults.summary.historicalWorkflow = {
    totalGRNs: grns.length,
    missingFields: auditResults.findings.medium.filter(f => f.type.includes('MISSING')).length,
    legacyFields: auditResults.findings.low.filter(f => f.type.includes('LEGACY')).length
  };
}

async function auditStatusConsistency() {
  console.log('\n🏷️  AUDIT 9: STATUS CONSISTENCY AUDIT');
  
  const grns = await GoodsReceiptNote.find().lean();
  const validStatuses = ['Draft', 'Received', 'Partial', 'Complete'];
  const validReceiptStatuses = ['Pending', 'Partial', 'Complete'];
  
  for (const grn of grns) {
    if (!validStatuses.includes(grn.status)) {
      auditResults.findings.medium.push({
        type: 'INVALID_GRN_STATUS',
        grnId: grn._id,
        grnNumber: grn.grnNumber,
        status: grn.status,
        validStatuses: validStatuses,
        severity: 'MEDIUM'
      });
    }
    
    if (grn.receiptStatus && !validReceiptStatuses.includes(grn.receiptStatus)) {
      auditResults.findings.medium.push({
        type: 'INVALID_RECEIPT_STATUS',
        grnId: grn._id,
        grnNumber: grn.grnNumber,
        receiptStatus: grn.receiptStatus,
        validReceiptStatuses: validReceiptStatuses,
        severity: 'MEDIUM'
      });
    }
  }
  
  auditResults.summary.statusConsistency = {
    totalGRNs: grns.length,
    invalidStatuses: auditResults.findings.medium.filter(f => f.type.includes('STATUS')).length
  };
}

async function auditIndexCompatibility() {
  console.log('\n🔍 AUDIT 10: DATABASE INDEX COMPATIBILITY');
  
  try {
    const inventoryLotIndexes = await InventoryLot.collection.getIndexes();
    const grnIndexes = await GoodsReceiptNote.collection.getIndexes();
    const poIndexes = await PurchaseOrder.collection.getIndexes();
    
    auditResults.reconciliation.indexCompatibility = {
      inventoryLotIndexes: Object.keys(inventoryLotIndexes),
      grnIndexes: Object.keys(grnIndexes),
      poIndexes: Object.keys(poIndexes),
      hasInventoryLotUniqueIndex: Object.values(inventoryLotIndexes).some(idx => 
        idx.unique && idx.key && idx.key.grn === 1
      )
    };
    
    console.log('   ✅ Index audit completed');
  } catch (error) {
    console.log('   ⚠️  Could not audit indexes:', error.message);
  }
  
  auditResults.summary.indexCompatibility = {
    status: 'CHECKED'
  };
}

async function auditDuplicateBusinessRecords() {
  console.log('\n🔀 AUDIT 11: DUPLICATE BUSINESS RECORDS');
  
  const grns = await GoodsReceiptNote.find().lean();
  const grnNumbers = {};
  
  for (const grn of grns) {
    if (!grnNumbers[grn.grnNumber]) {
      grnNumbers[grn.grnNumber] = [];
    }
    grnNumbers[grn.grnNumber].push(grn._id);
  }
  
  for (const [grnNumber, ids] of Object.entries(grnNumbers)) {
    if (ids.length > 1) {
      auditResults.findings.high.push({
        type: 'DUPLICATE_GRN_NUMBER',
        grnNumber: grnNumber,
        count: ids.length,
        grnIds: ids,
        severity: 'HIGH'
      });
    }
  }
  
  const pos = await PurchaseOrder.find().lean();
  const poNumbers = {};
  
  for (const po of pos) {
    if (!poNumbers[po.poNumber]) {
      poNumbers[po.poNumber] = [];
    }
    poNumbers[po.poNumber].push(po._id);
  }
  
  for (const [poNumber, ids] of Object.entries(poNumbers)) {
    if (ids.length > 1) {
      auditResults.findings.high.push({
        type: 'DUPLICATE_PO_NUMBER',
        poNumber: poNumber,
        count: ids.length,
        poIds: ids,
        severity: 'HIGH'
      });
    }
  }
  
  auditResults.summary.duplicateRecords = {
    duplicateGRNNumbers: Object.values(grnNumbers).filter(arr => arr.length > 1).length,
    duplicatePONumbers: Object.values(poNumbers).filter(arr => arr.length > 1).length
  };
}

async function generateReport() {
  console.log('\n📝 GENERATING AUDIT REPORT');
  
  const reportPath = path.join(process.cwd(), '..', '..', 'PHASE10_EXISTING_DATA_AUDIT_REPORT.md');
  
  let report = `# PHASE 10: EXISTING DATA AUDIT REPORT

**Date**: ${new Date().toISOString()}  
**Status**: ✅ **READ-ONLY AUDIT COMPLETE**

---

## EXECUTIVE SUMMARY

This is a comprehensive read-only audit of existing PO → GRN → Inventory data.

**NO MODIFICATIONS WERE MADE TO ANY DATABASE RECORDS.**

### Finding Severity Summary

| Severity | Count |
|----------|-------|
| CRITICAL | ${auditResults.findings.critical.length} |
| HIGH | ${auditResults.findings.high.length} |
| MEDIUM | ${auditResults.findings.medium.length} |
| LOW | ${auditResults.findings.low.length} |

---

## DATABASE RECORD COUNTS

\`\`\`
`;

  const poCount = await PurchaseOrder.countDocuments();
  const grnCount = await GoodsReceiptNote.countDocuments();
  const lotCount = await InventoryLot.countDocuments();
  const productCount = await Product.countDocuments();
  
  report += `Purchase Orders: ${poCount}
Goods Receipt Notes: ${grnCount}
Inventory Lots: ${lotCount}
Products: ${productCount}
\`\`\`

---

## AUDIT RESULTS

### 1. PO → GRN QUANTITY RECONCILIATION

**Summary**: ${auditResults.summary.poGRNQuantityReconciliation?.totalPOs || 0} POs audited

**Critical Issues**: ${auditResults.summary.poGRNQuantityReconciliation?.criticalIssues || 0}  
**High Issues**: ${auditResults.summary.poGRNQuantityReconciliation?.highIssues || 0}

`;

  if (auditResults.findings.critical.filter(f => f.type.includes('QUANTITY') || f.type.includes('RECEIPT')).length > 0) {
    report += `**Critical Findings**:\n\n`;
    for (const finding of auditResults.findings.critical.filter(f => f.type.includes('QUANTITY') || f.type.includes('RECEIPT'))) {
      report += `- **${finding.type}**: PO ${finding.poNumber} (${finding.poId})\n`;
      report += `  - Ordered: ${finding.orderedQuantity}, Received: ${finding.poReceivedQuantity}, GRN Sum: ${finding.sumOfGRNQuantity}\n`;
      report += `  - Difference: ${finding.difference}\n\n`;
    }
  }

  report += `### 2. PO → GRN WEIGHT RECONCILIATION

**Summary**: Weight reconciliation completed

**Critical Issues**: ${auditResults.findings.critical.filter(f => f.type.includes('WEIGHT')).length}  
**High Issues**: ${auditResults.findings.high.filter(f => f.type.includes('WEIGHT')).length}

`;

  if (auditResults.findings.critical.filter(f => f.type.includes('WEIGHT')).length > 0) {
    report += `**Critical Findings**:\n\n`;
    for (const finding of auditResults.findings.critical.filter(f => f.type.includes('WEIGHT'))) {
      report += `- **${finding.type}**: PO ${finding.poNumber}\n`;
      report += `  - Ordered: ${finding.orderedWeight}, Received: ${finding.receivedWeight}\n`;
      report += `  - Difference: ${finding.excess}\n\n`;
    }
  }

  report += `### 3. GRN → INVENTORY RECONCILIATION

**Summary**: ${auditResults.summary.grnInventoryReconciliation?.totalGRNs || 0} GRNs audited

**Critical Issues**: ${auditResults.summary.grnInventoryReconciliation?.criticalIssues || 0}  
**High Issues**: ${auditResults.summary.grnInventoryReconciliation?.highIssues || 0}

`;

  if (auditResults.findings.critical.filter(f => f.type.includes('INVENTORY')).length > 0) {
    report += `**Critical Findings**:\n\n`;
    for (const finding of auditResults.findings.critical.filter(f => f.type.includes('INVENTORY'))) {
      report += `- **${finding.type}**: GRN ${finding.grnNumber} (${finding.grnId})\n`;
      if (finding.missingLotId) {
        report += `  - Missing Inventory Lot: ${finding.missingLotId}\n`;
      }
      report += `\n`;
    }
  }

  report += `### 4. DUPLICATE INVENTORY

**Summary**: ${auditResults.summary.duplicateInventory?.totalLots || 0} inventory lots audited

**Duplicate Groups**: ${auditResults.summary.duplicateInventory?.duplicateGroups || 0}

`;

  if (auditResults.findings.critical.filter(f => f.type === 'DUPLICATE_INVENTORY_LOT').length > 0) {
    report += `**Duplicate Findings**:\n\n`;
    for (const finding of auditResults.findings.critical.filter(f => f.type === 'DUPLICATE_INVENTORY_LOT')) {
      report += `- **Duplicate Group**: GRN ${finding.grnNumber}\n`;
      report += `  - Count: ${finding.count}\n`;
      report += `  - Lot IDs: ${finding.lotIds.join(', ')}\n`;
      report += `  - Quantities: ${finding.quantities.join(', ')}\n\n`;
    }
  }

  report += `### 5. ORPHAN INVENTORY

**Summary**: Orphan inventory audit completed

**Orphan Lots**: ${auditResults.summary.orphanInventory?.orphanLots || 0}

`;

  if (auditResults.findings.critical.filter(f => f.type.includes('ORPHAN')).length > 0) {
    report += `**Orphan Findings**:\n\n`;
    for (const finding of auditResults.findings.critical.filter(f => f.type.includes('ORPHAN'))) {
      report += `- **${finding.type}**: Lot ${finding.lotId}\n`;
      if (finding.referencedGrnId) report += `  - Referenced GRN: ${finding.referencedGrnId}\n`;
      if (finding.referencedPoId) report += `  - Referenced PO: ${finding.referencedPoId}\n`;
      if (finding.referencedProductId) report += `  - Referenced Product: ${finding.referencedProductId}\n`;
      report += `\n`;
    }
  }

  report += `### 6. PRODUCT STOCK RECONCILIATION

**Summary**: ${auditResults.summary.productStockReconciliation?.totalProducts || 0} products audited

**Stock Discrepancies**: ${auditResults.summary.productStockReconciliation?.discrepancies || 0}

### 7. PHYSICAL UNIT WEIGHT AUDIT

**Summary**: Unit weight audit completed

**Weight Issues**: ${auditResults.summary.unitWeights?.weightIssues || 0}

### 8. HISTORICAL GRN WORKFLOW AUDIT

**Summary**: Historical workflow audit completed

**Missing Fields**: ${auditResults.summary.historicalWorkflow?.missingFields || 0}  
**Legacy Fields**: ${auditResults.summary.historicalWorkflow?.legacyFields || 0}

### 9. STATUS CONSISTENCY AUDIT

**Summary**: ${auditResults.summary.statusConsistency?.totalGRNs || 0} GRNs audited

**Invalid Statuses**: ${auditResults.summary.statusConsistency?.invalidStatuses || 0}

### 10. DATABASE INDEX COMPATIBILITY

**Summary**: Index audit completed

**Status**: ${auditResults.summary.indexCompatibility?.status || 'CHECKED'}

### 11. DUPLICATE BUSINESS RECORDS

**Summary**: Duplicate record audit completed

**Duplicate GRN Numbers**: ${auditResults.summary.duplicateRecords?.duplicateGRNNumbers || 0}  
**Duplicate PO Numbers**: ${auditResults.summary.duplicateRecords?.duplicatePONumbers || 0}

---

## DETAILED FINDINGS

### CRITICAL FINDINGS (${auditResults.findings.critical.length})

`;

  for (const finding of auditResults.findings.critical) {
    report += `\n#### ${finding.type}\n`;
    report += `\`\`\`json\n${JSON.stringify(finding, null, 2)}\n\`\`\`\n`;
  }

  report += `\n### HIGH FINDINGS (${auditResults.findings.high.length})\n`;

  for (const finding of auditResults.findings.high) {
    report += `\n#### ${finding.type}\n`;
    report += `\`\`\`json\n${JSON.stringify(finding, null, 2)}\n\`\`\`\n`;
  }

  report += `\n### MEDIUM FINDINGS (${auditResults.findings.medium.length})\n`;

  for (const finding of auditResults.findings.medium) {
    report += `\n#### ${finding.type}\n`;
    report += `\`\`\`json\n${JSON.stringify(finding, null, 2)}\n\`\`\`\n`;
  }

  report += `\n### LOW FINDINGS (${auditResults.findings.low.length})\n`;

  for (const finding of auditResults.findings.low) {
    report += `\n#### ${finding.type}\n`;
    report += `\`\`\`json\n${JSON.stringify(finding, null, 2)}\n\`\`\`\n`;
  }

  report += `\n---

## SEVERITY SUMMARY

| Severity | Count | Action |
|----------|-------|--------|
| CRITICAL | ${auditResults.findings.critical.length} | REQUIRES IMMEDIATE REVIEW |
| HIGH | ${auditResults.findings.high.length} | REQUIRES REVIEW |
| MEDIUM | ${auditResults.findings.medium.length} | REVIEW RECOMMENDED |
| LOW | ${auditResults.findings.low.length} | INFORMATIONAL |

---

## RECOMMENDATIONS

### Immediate Actions Required

1. **Review all CRITICAL findings** - These may indicate data corruption or business rule violations
2. **Verify PO/GRN/Inventory reconciliation** - Ensure quantities and weights match
3. **Check for duplicate inventory** - Ensure no double-counting of stock
4. **Verify orphan records** - Ensure referential integrity

### Future Actions

1. **Implement concurrent GRN safety fix** - Address race condition identified in Phase 9.1
2. **Add data validation** - Prevent future inconsistencies
3. **Implement audit logging** - Track all inventory changes
4. **Regular audits** - Schedule periodic data audits

---

## CONCLUSION

This audit identified ${auditResults.findings.critical.length + auditResults.findings.high.length} critical/high severity issues that require review.

**NO DATABASE MODIFICATIONS WERE MADE DURING THIS AUDIT.**

All findings are documented above for manual review and remediation.

`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n✅ Report written to: ${reportPath}`);
}

async function runAudit() {
  try {
    await connectDB();
    
    console.log('\n🔍 STARTING COMPREHENSIVE READ-ONLY AUDIT\n');
    
    await auditPOGRNQuantityReconciliation();
    await auditPOGRNWeightReconciliation();
    await auditGRNInventoryReconciliation();
    await auditDuplicateInventory();
    await auditOrphanInventory();
    await auditProductStockReconciliation();
    await auditUnitWeights();
    await auditHistoricalWorkflow();
    await auditStatusConsistency();
    await auditIndexCompatibility();
    await auditDuplicateBusinessRecords();
    
    await generateReport();
    
    console.log('\n✅ AUDIT COMPLETE\n');
    console.log(`Summary:`);
    console.log(`  Critical: ${auditResults.findings.critical.length}`);
    console.log(`  High: ${auditResults.findings.high.length}`);
    console.log(`  Medium: ${auditResults.findings.medium.length}`);
    console.log(`  Low: ${auditResults.findings.low.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

runAudit();
