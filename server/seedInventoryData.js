import mongoose from 'mongoose';
import InventoryLot from './src/models/InventoryLot.js';
import Product from './src/models/Product.js';
import Supplier from './src/models/Supplier.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/yarnflow');
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Sample inventory lots data
const sampleInventoryLots = [
  {
    lotNumber: 'LOT-2024-001',
    productName: 'Cotton Yarn 2s',
    productCode: 'PROD0001',
    supplierName: 'ABC Textiles',
    supplierBatchNumber: 'ABC-BATCH-001',
    grnNumber: 'GRN-2024-001',
    poNumber: 'PO-2024-001',
    receivedQuantity: 100,
    currentQuantity: 85,
    reservedQuantity: 15,
    unit: 'Bags',
    unitCost: 1200,
    totalCost: 120000,
    receivedDate: new Date('2024-10-01'),
    expiryDate: new Date('2025-10-01'),
    status: 'Active',
    qualityStatus: 'Approved',
    qualityGrade: 'A',
    warehouse: 'Main Warehouse',
    location: {
      zone: 'A',
      rack: '01',
      shelf: '01',
      bin: '001'
    },
    movements: [
      {
        type: 'Received',
        quantity: 100,
        date: new Date('2024-10-01'),
        reference: 'GRN-2024-001',
        notes: 'Initial receipt from supplier',
        performedBy: 'Admin'
      },
      {
        type: 'Reserved',
        quantity: 15,
        date: new Date('2024-10-05'),
        reference: 'SO-2024-001',
        notes: 'Reserved for sales order',
        performedBy: 'Sales Team'
      }
    ],
    notes: 'High quality cotton yarn from ABC Textiles'
  },
  {
    lotNumber: 'LOT-2024-002',
    productName: 'Polyester 3s',
    productCode: 'PROD0002',
    supplierName: 'XYZ Mills',
    supplierBatchNumber: 'XYZ-BATCH-002',
    grnNumber: 'GRN-2024-002',
    poNumber: 'PO-2024-002',
    receivedQuantity: 75,
    currentQuantity: 75,
    reservedQuantity: 0,
    unit: 'Rolls',
    unitCost: 1500,
    totalCost: 112500,
    receivedDate: new Date('2024-10-03'),
    expiryDate: new Date('2025-10-03'),
    status: 'Active',
    qualityStatus: 'Approved',
    qualityGrade: 'A',
    warehouse: 'Main Warehouse',
    location: {
      zone: 'B',
      rack: '02',
      shelf: '01',
      bin: '002'
    },
    movements: [
      {
        type: 'Received',
        quantity: 75,
        date: new Date('2024-10-03'),
        reference: 'GRN-2024-002',
        notes: 'Initial receipt from supplier',
        performedBy: 'Admin'
      }
    ],
    notes: 'Premium polyester rolls from XYZ Mills'
  },
  {
    lotNumber: 'LOT-2024-003',
    productName: 'Cotton Yarn 20s',
    productCode: 'PROD0003',
    supplierName: 'Premium Cotton Ltd',
    supplierBatchNumber: 'PCL-BATCH-003',
    grnNumber: 'GRN-2024-003',
    poNumber: 'PO-2024-003',
    receivedQuantity: 50,
    currentQuantity: 25,
    reservedQuantity: 10,
    unit: 'Bags',
    unitCost: 1800,
    totalCost: 90000,
    receivedDate: new Date('2024-10-05'),
    expiryDate: new Date('2025-10-05'),
    status: 'Active',
    qualityStatus: 'Approved',
    qualityGrade: 'B',
    warehouse: 'Main Warehouse',
    location: {
      zone: 'A',
      rack: '01',
      shelf: '02',
      bin: '003'
    },
    movements: [
      {
        type: 'Received',
        quantity: 50,
        date: new Date('2024-10-05'),
        reference: 'GRN-2024-003',
        notes: 'Initial receipt from supplier',
        performedBy: 'Admin'
      },
      {
        type: 'Issued',
        quantity: 25,
        date: new Date('2024-10-08'),
        reference: 'SO-2024-002',
        notes: 'Issued for production order',
        performedBy: 'Production Team'
      },
      {
        type: 'Reserved',
        quantity: 10,
        date: new Date('2024-10-09'),
        reference: 'SO-2024-003',
        notes: 'Reserved for upcoming order',
        performedBy: 'Sales Team'
      }
    ],
    notes: 'Fine cotton yarn for premium products'
  },
  {
    lotNumber: 'LOT-2024-004',
    productName: 'Silk Thread',
    productCode: 'PROD0004',
    supplierName: 'Silk Weavers Co',
    supplierBatchNumber: 'SWC-BATCH-004',
    grnNumber: 'GRN-2024-004',
    poNumber: 'PO-2024-004',
    receivedQuantity: 200,
    currentQuantity: 45,
    reservedQuantity: 5,
    unit: 'Spools',
    unitCost: 250,
    totalCost: 50000,
    receivedDate: new Date('2024-10-07'),
    expiryDate: new Date('2025-10-07'),
    status: 'Active',
    qualityStatus: 'Approved',
    qualityGrade: 'A',
    warehouse: 'Main Warehouse',
    location: {
      zone: 'C',
      rack: '03',
      shelf: '01',
      bin: '004'
    },
    movements: [
      {
        type: 'Received',
        quantity: 200,
        date: new Date('2024-10-07'),
        reference: 'GRN-2024-004',
        notes: 'Initial receipt from supplier',
        performedBy: 'Admin'
      },
      {
        type: 'Issued',
        quantity: 150,
        date: new Date('2024-10-10'),
        reference: 'SO-2024-004',
        notes: 'Issued for silk fabric production',
        performedBy: 'Production Team'
      },
      {
        type: 'Reserved',
        quantity: 5,
        date: new Date('2024-10-11'),
        reference: 'SO-2024-005',
        notes: 'Reserved for special order',
        performedBy: 'Sales Team'
      }
    ],
    notes: 'Premium silk thread for luxury products',
    alerts: [
      {
        type: 'Low_Stock',
        message: 'Stock running low - only 45 spools remaining',
        date: new Date(),
        acknowledged: false
      }
    ]
  },
  {
    lotNumber: 'LOT-2024-005',
    productName: 'Wool Blend',
    productCode: 'PROD0005',
    supplierName: 'Mountain Wool Ltd',
    supplierBatchNumber: 'MWL-BATCH-005',
    grnNumber: 'GRN-2024-005',
    poNumber: 'PO-2024-005',
    receivedQuantity: 120,
    currentQuantity: 78,
    reservedQuantity: 20,
    unit: 'Kg',
    unitCost: 800,
    totalCost: 96000,
    receivedDate: new Date('2024-10-09'),
    expiryDate: new Date('2025-10-09'),
    status: 'Active',
    qualityStatus: 'Approved',
    qualityGrade: 'B',
    warehouse: 'Main Warehouse',
    location: {
      zone: 'D',
      rack: '04',
      shelf: '01',
      bin: '005'
    },
    movements: [
      {
        type: 'Received',
        quantity: 120,
        date: new Date('2024-10-09'),
        reference: 'GRN-2024-005',
        notes: 'Initial receipt from supplier',
        performedBy: 'Admin'
      },
      {
        type: 'Issued',
        quantity: 22,
        date: new Date('2024-10-11'),
        reference: 'SO-2024-006',
        notes: 'Issued for winter collection',
        performedBy: 'Production Team'
      },
      {
        type: 'Reserved',
        quantity: 20,
        date: new Date('2024-10-11'),
        reference: 'SO-2024-007',
        notes: 'Reserved for bulk order',
        performedBy: 'Sales Team'
      }
    ],
    notes: 'High-quality wool blend for winter products',
    alerts: [
      {
        type: 'Low_Stock',
        message: 'Running low - 78 kg remaining',
        date: new Date(),
        acknowledged: false
      }
    ]
  }
];

// Seed the database
const seedInventoryData = async () => {
  try {
    await connectDB();
    
    console.log('🗑️  Clearing existing inventory lots...');
    await InventoryLot.deleteMany({});
    
    console.log('📦 Creating sample inventory lots...');
    await InventoryLot.insertMany(sampleInventoryLots);
    
    console.log('✅ Successfully created sample inventory data!');
    console.log(`📊 Created ${sampleInventoryLots.length} inventory lots`);
    
    // Display summary
    const stats = {
      totalLots: sampleInventoryLots.length,
      totalValue: sampleInventoryLots.reduce((sum, lot) => sum + lot.totalCost, 0),
      cottonBags: sampleInventoryLots.filter(lot => lot.unit === 'Bags').reduce((sum, lot) => sum + lot.currentQuantity, 0),
      polyesterRolls: sampleInventoryLots.filter(lot => lot.unit === 'Rolls').reduce((sum, lot) => sum + lot.currentQuantity, 0),
      activeLots: sampleInventoryLots.filter(lot => lot.status === 'Active').length
    };
    
    console.log('\n📈 Inventory Statistics:');
    console.log(`   Total Lots: ${stats.totalLots}`);
    console.log(`   Active Lots: ${stats.activeLots}`);
    console.log(`   Cotton Bags: ${stats.cottonBags}`);
    console.log(`   Polyester Rolls: ${stats.polyesterRolls}`);
    console.log(`   Total Value: ₹${stats.totalValue.toLocaleString()}`);
    
    console.log('\n🚀 Your inventory system is now ready with real data!');
    console.log('   Go to: http://localhost:5173/inventory');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding inventory data:', error);
    process.exit(1);
  }
};

// Run the seeding
seedInventoryData();
