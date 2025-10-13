import mongoose from 'mongoose';
import InventoryLot from './src/models/InventoryLot.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/yarnflow');
    console.log('MongoDB Connected for testing...');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Test inventory data
const testInventoryData = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Checking inventory lots in database...');
    
    // Get all inventory lots
    const lots = await InventoryLot.find({})
      .populate('supplier', 'companyName')
      .populate('product', 'productName productCode');
    
    console.log(`📊 Found ${lots.length} inventory lots in database`);
    
    if (lots.length === 0) {
      console.log('❌ No inventory lots found!');
      console.log('💡 This is why your frontend shows dummy data');
      console.log('\n🔧 Solutions:');
      console.log('   1. Run: node approveGRN.js (to approve your existing GRN)');
      console.log('   2. Or run: node seedInventoryData.js (to create sample data)');
    } else {
      console.log('\n📋 Inventory Lots Found:');
      lots.forEach((lot, index) => {
        console.log(`   ${index + 1}. ${lot.lotNumber}`);
        console.log(`      Product: ${lot.productName}`);
        console.log(`      Quantity: ${lot.currentQuantity} ${lot.unit}`);
        console.log(`      Supplier: ${lot.supplierName}`);
        console.log(`      Status: ${lot.status}`);
        console.log('');
      });
      
      // Calculate statistics
      const stats = {
        totalLots: lots.length,
        activeLots: lots.filter(lot => lot.status === 'Active').length,
        totalValue: lots.reduce((sum, lot) => sum + (lot.totalCost || 0), 0),
        cottonBags: lots.filter(lot => lot.unit === 'Bags' && lot.productName.includes('Cotton')).reduce((sum, lot) => sum + lot.currentQuantity, 0),
        polyesterRolls: lots.filter(lot => lot.unit === 'Rolls' && lot.productName.includes('Polyester')).reduce((sum, lot) => sum + lot.currentQuantity, 0)
      };
      
      console.log('📈 Statistics that will show on your dashboard:');
      console.log(`   Total Lots: ${stats.totalLots}`);
      console.log(`   Active Lots: ${stats.activeLots}`);
      console.log(`   Cotton Bags: ${stats.cottonBags}`);
      console.log(`   Polyester Rolls: ${stats.polyesterRolls}`);
      console.log(`   Total Value: ₹${stats.totalValue.toLocaleString()}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing inventory data:', error);
    process.exit(1);
  }
};

// Run the test
testInventoryData();
