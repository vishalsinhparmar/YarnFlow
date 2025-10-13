import mongoose from 'mongoose';
import GoodsReceiptNote from './src/models/GoodsReceiptNote.js';
import InventoryLot from './src/models/InventoryLot.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/yarnflow');
    console.log('MongoDB Connected for GRN approval...');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Approve a specific GRN and create inventory lots
const approveSpecificGRN = async (grnNumber) => {
  try {
    await connectDB();
    
    console.log(`🔍 Looking for GRN: ${grnNumber}...`);
    
    // Find the GRN
    const grn = await GoodsReceiptNote.findOne({ grnNumber })
      .populate('supplier')
      .populate('items.product');
    
    if (!grn) {
      console.log(`❌ GRN ${grnNumber} not found`);
      process.exit(1);
    }
    
    console.log(`📋 Found GRN: ${grn.grnNumber}`);
    console.log(`   Status: ${grn.status}`);
    console.log(`   Quality Status: ${grn.qualityCheckStatus}`);
    console.log(`   Items: ${grn.items.length}`);
    
    // Update GRN to approved status
    grn.approvalStatus = 'Approved';
    grn.approvedBy = 'Admin';
    grn.approvedDate = new Date();
    grn.status = 'Completed';
    grn.qualityCheckStatus = 'Completed';
    
    // Update all items to approved
    grn.items.forEach(item => {
      if (!item.qualityStatus || item.qualityStatus === 'Pending') {
        item.qualityStatus = 'Approved';
        item.acceptedQuantity = item.receivedQuantity;
      }
    });
    
    await grn.save();
    console.log('✅ GRN approved successfully');
    
    // Create inventory lots for approved items
    const inventoryLots = [];
    let lotCounter = 1;
    
    for (const item of grn.items) {
      if (item.qualityStatus === 'Approved' && item.acceptedQuantity > 0) {
        
        // Generate lot number
        const lotNumber = `LOT-${new Date().getFullYear()}-${String(lotCounter).padStart(3, '0')}`;
        
        const lot = new InventoryLot({
          lotNumber,
          grn: grn._id,
          grnNumber: grn.grnNumber,
          purchaseOrder: grn.purchaseOrder,
          poNumber: grn.poNumber,
          product: item.product._id,
          productName: item.product.productName,
          productCode: item.product.productCode,
          supplier: grn.supplier._id,
          supplierName: grn.supplier.companyName,
          supplierBatchNumber: item.batchNumber || `BATCH-${lotCounter}`,
          receivedQuantity: item.acceptedQuantity,
          currentQuantity: item.acceptedQuantity,
          unit: item.unit,
          qualityStatus: 'Approved',
          qualityGrade: item.qualityGrade || 'A',
          qualityNotes: item.qualityNotes,
          warehouse: item.warehouseLocation || 'Main Warehouse',
          location: {
            zone: 'A',
            rack: String(lotCounter).padStart(2, '0'),
            shelf: '01',
            bin: String(lotCounter).padStart(3, '0')
          },
          receivedDate: grn.receiptDate,
          expiryDate: item.expiryDate,
          unitCost: item.unitPrice,
          totalCost: item.unitPrice * item.acceptedQuantity,
          status: 'Active',
          notes: item.notes || `Received via GRN ${grn.grnNumber}`,
          createdBy: 'Admin'
        });
        
        // Add initial movement record
        lot.movements.push({
          type: 'Received',
          quantity: item.acceptedQuantity,
          date: grn.receiptDate,
          reference: grn.grnNumber,
          notes: `Initial receipt from GRN ${grn.grnNumber}`,
          performedBy: 'Admin'
        });
        
        await lot.save();
        inventoryLots.push(lot);
        
        console.log(`📦 Created inventory lot: ${lot.lotNumber}`);
        console.log(`   Product: ${lot.productName}`);
        console.log(`   Quantity: ${lot.currentQuantity} ${lot.unit}`);
        console.log(`   Supplier: ${lot.supplierName}`);
        
        lotCounter++;
      }
    }
    
    console.log(`\n🎉 Successfully created ${inventoryLots.length} inventory lots!`);
    console.log('\n📊 Summary:');
    inventoryLots.forEach(lot => {
      console.log(`   ${lot.lotNumber}: ${lot.productName} - ${lot.currentQuantity} ${lot.unit}`);
    });
    
    console.log('\n🚀 Your inventory lots are now available!');
    console.log('   Go to: http://localhost:5173/inventory');
    console.log('   You should now see real dynamic data!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error approving GRN:', error);
    process.exit(1);
  }
};

// Run the approval for your specific GRN
const grnNumber = 'GRN20251000004'; // Your GRN number from the image
approveSpecificGRN(grnNumber);
