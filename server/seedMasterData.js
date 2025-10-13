import mongoose from 'mongoose';
import Customer from './src/models/Customer.js';
import Product from './src/models/Product.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/yarnflow');
    console.log('MongoDB Connected for seeding master data...');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Sample customers data
const sampleCustomers = [
  {
    companyName: 'Fashion Hub Ltd.',
    contactPerson: 'Rajesh Kumar',
    email: 'rajesh@fashionhub.com',
    phone: '9876543210',
    address: {
      street: '123 Fashion Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India'
    },
    gstNumber: '27ABCDE1234F1Z5',
    paymentTerms: 'Credit-30',
    creditLimit: 500000,
    status: 'Active'
  },
  {
    companyName: 'Textile World Co.',
    contactPerson: 'Priya Sharma',
    email: 'priya@textileworld.com',
    phone: '9876543211',
    address: {
      street: '456 Textile Avenue',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      country: 'India'
    },
    gstNumber: '07FGHIJ5678K2L6',
    paymentTerms: 'Credit-15',
    creditLimit: 300000,
    status: 'Active'
  },
  {
    companyName: 'Premium Fabrics Inc.',
    contactPerson: 'Amit Patel',
    email: 'amit@premiumfabrics.com',
    phone: '9876543212',
    address: {
      street: '789 Premium Plaza',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380001',
      country: 'India'
    },
    gstNumber: '24MNOPQ9012R3S7',
    paymentTerms: 'Credit-45',
    creditLimit: 750000,
    status: 'Active'
  }
];

// Sample products data
const sampleProducts = [
  {
    productName: 'Cotton Yarn 20s',
    productCode: 'CY20S',
    category: 'Yarn',
    specifications: {
      count: '20s',
      material: 'Cotton',
      color: 'Natural'
    },
    unit: 'Kg',
    basePrice: 180,
    description: 'High quality cotton yarn suitable for textile manufacturing',
    status: 'Active'
  },
  {
    productName: 'Polyester Thread',
    productCode: 'PT150',
    category: 'Thread',
    specifications: {
      denier: '150D',
      material: 'Polyester',
      color: 'White'
    },
    unit: 'Spools',
    basePrice: 25,
    description: 'Durable polyester thread for industrial sewing',
    status: 'Active'
  },
  {
    productName: 'Cotton Fabric',
    productCode: 'CF100',
    category: 'Fabric',
    specifications: {
      gsm: '100',
      material: 'Cotton',
      width: '60 inches'
    },
    unit: 'Meters',
    basePrice: 120,
    description: 'Premium cotton fabric for garment manufacturing',
    status: 'Active'
  },
  {
    productName: 'Silk Thread',
    productCode: 'ST200',
    category: 'Thread',
    specifications: {
      denier: '200D',
      material: 'Silk',
      color: 'Natural'
    },
    unit: 'Spools',
    basePrice: 45,
    description: 'Premium silk thread for luxury textiles',
    status: 'Active'
  },
  {
    productName: 'Wool Yarn',
    productCode: 'WY30S',
    category: 'Yarn',
    specifications: {
      count: '30s',
      material: 'Wool',
      color: 'Natural'
    },
    unit: 'Kg',
    basePrice: 250,
    description: 'High quality wool yarn for winter garments',
    status: 'Active'
  }
];

// Create sample master data
const seedMasterData = async () => {
  try {
    await connectDB();
    
    console.log('🗑️  Clearing existing master data...');
    await Customer.deleteMany({});
    await Product.deleteMany({});
    
    console.log('👥 Creating sample customers...');
    const customers = await Customer.insertMany(sampleCustomers);
    console.log(`✅ Created ${customers.length} customers`);
    
    console.log('📦 Creating sample products...');
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ Created ${products.length} products`);
    
    console.log('\n📊 Master Data Summary:');
    console.log(`   Customers: ${customers.length}`);
    console.log(`   Products: ${products.length}`);
    
    console.log('\n👥 Customers Created:');
    customers.forEach(customer => {
      console.log(`   ${customer.customerCode}: ${customer.companyName} - ${customer.contactPerson}`);
    });
    
    console.log('\n📦 Products Created:');
    products.forEach(product => {
      console.log(`   ${product.productCode}: ${product.productName} (${product.unit}) - ₹${product.basePrice}`);
    });
    
    console.log('\n🚀 Master data is ready for Sales Order system!');
    console.log('   Now you can create sales orders with real customer and product data.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding master data:', error);
    process.exit(1);
  }
};

// Run the seeding
seedMasterData();
