import mongoose from 'mongoose';
import GoodsReceiptNote from './src/models/GoodsReceiptNote.js';
import InventoryLot from './src/models/InventoryLot.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/yarnflow');
    console.log('MongoDB Connected for testing GRN-Inventory integration...');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Test GRN to Inventory integration
const testGRNInventoryIntegration = async () => {
  try {
    await connectDB();
    
    console.log('🧪 Testing GRN to Inventory Integration...\n');
    
    // Get all GRNs
    const allGRNs = await GoodsReceiptNote.find({})
      .populate('supplier', 'companyName')
      .populate('items.product', 'productName productCode');
    
    console.log(`📋 Total GRNs in system: ${allGRNs.length}`);
    
    // Get all inventory lots
    const allLots = await InventoryLot.find({})
      .populate('product', 'productName productCode')
      .populate('grn', 'grnNumber');
    
    console.log(`📦 Total Inventory Lots: ${allLots.length}`);
    
    // Analyze GRN status breakdown
    const statusBreakdown = {};
    allGRNs.forEach(grn => {
      statusBreakdown[grn.status] = (statusBreakdown[grn.status] || 0) + 1;
    });
    
    console.log('\n📊 GRN Status Breakdown:');
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      console.log(`   • ${status}: ${count} GRNs`);
    });
    
    // Find approved GRNs
    const approvedGRNs = allGRNs.filter(grn => grn.approvalStatus === 'Approved');
    console.log(`\n✅ Approved GRNs: ${approvedGRNs.length}`);
    
    // Check which approved GRNs have inventory lots
    console.log('\n🔍 Checking Approved GRNs for Inventory Lots:');
    
    for (const grn of approvedGRNs) {
      const grnLots = allLots.filter(lot => 
        lot.grn && lot.grn._id.toString() === grn._id.toString()
      );
      
      console.log(`\n📋 GRN: ${grn.grnNumber}`);
      console.log(`   Supplier: ${grn.supplier?.companyName || 'Unknown'}`);
      console.log(`   Status: ${grn.status}`);
      console.log(`   Approval: ${grn.approvalStatus}`);
      console.log(`   Items in GRN: ${grn.items.length}`);
      console.log(`   Inventory Lots Created: ${grnLots.length}`);
      
      if (grnLots.length > 0) {
        console.log(`   ✅ Inventory Integration: Working`);
        grnLots.forEach(lot => {
          console.log(`      • ${lot.product?.productName || 'Unknown Product'}: ${lot.availableQuantity} units`);
        });
      } else {
        console.log(`   ❌ Inventory Integration: Missing - No lots created`);
      }
    }
    
    // Find GRNs ready for approval
    const readyForApproval = allGRNs.filter(grn => 
      grn.status === 'Under_Review' && 
      grn.qualityCheckStatus === 'Completed' &&
      grn.approvalStatus !== 'Approved'
    );
    
    console.log(`\n⏳ GRNs Ready for Approval: ${readyForApproval.length}`);
    
    if (readyForApproval.length > 0) {
      console.log('\n📋 GRNs Ready for Approval:');
      readyForApproval.forEach(grn => {
        console.log(`   • ${grn.grnNumber} - ${grn.supplier?.companyName || 'Unknown Supplier'}`);
      });
      
      console.log('\n🚀 Action Required:');
      console.log('   1. Go to GRN page in your application');
      console.log('   2. Click "View" on these GRNs');
      console.log('   3. Click "Approve GRN" button');
      console.log('   4. Inventory lots will be created automatically');
    }
    
    // Show inventory summary
    console.log('\n📦 Current Inventory Summary:');
    const inventorySummary = {};
    allLots.forEach(lot => {
      const productName = lot.product?.productName || 'Unknown Product';
      if (!inventorySummary[productName]) {
        inventorySummary[productName] = {
          totalQuantity: 0,
          availableQuantity: 0,
          lots: 0
        };
      }
      inventorySummary[productName].totalQuantity += lot.receivedQuantity;
      inventorySummary[productName].availableQuantity += lot.availableQuantity;
      inventorySummary[productName].lots += 1;
    });
    
    Object.entries(inventorySummary).forEach(([product, data]) => {
      console.log(`   • ${product}:`);
      console.log(`     - Total Received: ${data.totalQuantity} units`);
      console.log(`     - Available: ${data.availableQuantity} units`);
      console.log(`     - Lots: ${data.lots}`);
    });
    
    // Integration health check
    console.log('\n🏥 Integration Health Check:');
    
    const totalApprovedItems = approvedGRNs.reduce((sum, grn) => 
      sum + grn.items.filter(item => item.qualityStatus === 'Approved').length, 0
    );
    
    const totalInventoryLots = allLots.length;
    
    console.log(`   • Approved GRN Items: ${totalApprovedItems}`);
    console.log(`   • Inventory Lots Created: ${totalInventoryLots}`);
    
    if (totalInventoryLots >= totalApprovedItems * 0.8) {
      console.log(`   ✅ Integration Health: Good (${Math.round(totalInventoryLots/totalApprovedItems*100)}% coverage)`);
    } else {
      console.log(`   ⚠️  Integration Health: Needs Attention (${Math.round(totalInventoryLots/totalApprovedItems*100)}% coverage)`);
    }
    
    console.log('\n🎊 GRN-Inventory Integration Test Complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing GRN-Inventory integration:', error);
    process.exit(1);
  }
};

// Run the test
testGRNInventoryIntegration();
