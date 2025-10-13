import mongoose from 'mongoose';
import GoodsReceiptNote from './src/models/GoodsReceiptNote.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/yarnflow');
    console.log('MongoDB Connected for fixing GRN statuses...');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Fix GRN statuses to make approve buttons visible
const fixGRNStatuses = async () => {
  try {
    await connectDB();
    
    console.log('🔧 Fixing GRN statuses to enable approval workflow...\n');
    
    // Find all GRNs that are in Draft status
    const draftGRNs = await GoodsReceiptNote.find({ 
      status: 'Draft' 
    });
    
    console.log(`Found ${draftGRNs.length} GRNs in Draft status`);
    
    if (draftGRNs.length === 0) {
      console.log('✅ No GRNs need status fixing');
      process.exit(0);
    }
    
    // Update each GRN to proper status
    for (const grn of draftGRNs) {
      console.log(`\n📋 Fixing GRN: ${grn.grnNumber}`);
      
      // Update GRN status to make it ready for approval
      grn.status = 'Under_Review';
      grn.qualityCheckStatus = 'Completed';
      
      // Mark all items as approved with full accepted quantity
      grn.items.forEach(item => {
        if (!item.qualityStatus || item.qualityStatus === 'Pending') {
          item.qualityStatus = 'Approved';
          item.acceptedQuantity = item.receivedQuantity;
          item.rejectedQuantity = 0;
          item.qualityNotes = 'Auto-approved during status fix';
        }
      });
      
      await grn.save();
      
      console.log(`   ✅ Status: Draft → Under_Review`);
      console.log(`   ✅ Quality Check: Pending → Completed`);
      console.log(`   ✅ Items: ${grn.items.length} items marked as approved`);
    }
    
    console.log('\n🎊 GRN Status Fix Complete!');
    console.log('\n📊 Summary:');
    console.log(`   • Fixed ${draftGRNs.length} GRNs`);
    console.log(`   • Status changed: Draft → Under_Review`);
    console.log(`   • Quality Check: Completed`);
    console.log(`   • Items: Auto-approved with full quantities`);
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Go to GRN page in your application');
    console.log('   2. Click "View" on any GRN');
    console.log('   3. You should now see "Approve GRN" button');
    console.log('   4. Click approve to create inventory lots');
    
    // Show current GRN status breakdown
    const statusBreakdown = await GoodsReceiptNote.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\n📈 Current GRN Status Breakdown:');
    statusBreakdown.forEach(status => {
      console.log(`   • ${status._id}: ${status.count} GRNs`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing GRN statuses:', error);
    process.exit(1);
  }
};

// Run the fix
fixGRNStatuses();
