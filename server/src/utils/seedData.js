import mongoose from 'mongoose';
import connectDB from '../../db.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import logger from './logger.js';

// Sample data for seeding
const sampleCategories = [
  {
    categoryName: 'Cotton Yarn',
    description: 'Various cotton yarn types and counts',
    categoryType: 'Cotton Yarn',
    specifications: {
      unit: 'Bags',
      standardWeight: 100,
      yarnCount: ['20s', '30s', '40s', '50s'],
      color: ['Natural', 'White', 'Bleached'],
      quality: ['Premium', 'Standard', 'Economy']
    }
  },
  {
    categoryName: 'Polyester',
    description: 'Polyester threads and rolls',
    categoryType: 'Polyester',
    specifications: {
      unit: 'Rolls',
      standardWeight: 75,
      yarnCount: ['150D', '300D', '600D'],
      color: ['Natural', 'Dyed'],
      quality: ['Premium', 'Standard']
    }
  },
  {
    categoryName: 'Blended Yarn',
    description: 'Cotton-polyester blends',
    categoryType: 'Blended Yarn',
    specifications: {
      unit: 'Bags',
      standardWeight: 80,
      yarnCount: ['20s', '30s'],
      blendRatio: '60/40',
      color: ['Natural', 'White'],
      quality: ['Premium', 'Standard']
    }
  }
];

const sampleSuppliers = [
  {
    companyName: 'ABC Textiles Ltd.',
    contactPerson: 'Rajesh Kumar',
    email: 'rajesh@abctextiles.com',
    phone: '+919876543210',
    address: {
      street: '123 Industrial Area',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India'
    },
    gstNumber: '27ABCDE1234F1Z5'
  },
  {
    companyName: 'XYZ Cotton Mills',
    contactPerson: 'Suresh Patel',
    email: 'suresh@xyzmills.com',
    phone: '+919876543211',
    address: {
      street: '456 Mill Road',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380001',
      country: 'India'
    },
    gstNumber: '24XYZAB5678G2Z1'
  },
  {
    companyName: 'Polyester Mills Inc.',
    contactPerson: 'Amit Shah',
    email: 'amit@polymills.com',
    phone: '+919876543212',
    address: {
      street: '789 Factory Lane',
      city: 'Surat',
      state: 'Gujarat',
      pincode: '395001',
      country: 'India'
    },
    gstNumber: '24POLYB9012H3Z2'
  }
];

const sampleCustomers = [
  {
    companyName: 'Fashion Hub Ltd.',
    contactPerson: 'Priya Sharma',
    email: 'priya@fashionhub.com',
    phone: '+919876543220',
    address: {
      street: '101 Fashion Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400002',
      country: 'India'
    },
    gstNumber: '27FASHB1234K1Z8',
    creditLimit: 500000,
    paymentTerms: 'Credit-30'
  },
  {
    companyName: 'Textile World Co.',
    contactPerson: 'Vikram Singh',
    email: 'vikram@textileworld.com',
    phone: '+919876543221',
    address: {
      street: '202 Textile Plaza',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      country: 'India'
    },
    gstNumber: '07TEXTIL5678L2Z9',
    creditLimit: 750000,
    paymentTerms: 'Credit-45'
  },
  {
    companyName: 'Premium Fabrics Inc.',
    contactPerson: 'Anita Reddy',
    email: 'anita@premiumfabrics.com',
    phone: '+919876543222',
    address: {
      street: '303 Premium Complex',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      country: 'India'
    },
    gstNumber: '29PREMIM9012M3Z0',
    creditLimit: 1000000,
    paymentTerms: 'Credit-60'
  }
];

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data
    await Promise.all([
      Customer.deleteMany({}),
      Supplier.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({})
    ]);
    
    console.log('🗑️  Cleared existing data');
    
    // Seed Categories
    const categories = await Category.insertMany(sampleCategories);
    console.log(`✅ Created ${categories.length} categories`);
    
    // Seed Suppliers
    const suppliers = await Supplier.insertMany(sampleSuppliers);
    console.log(`✅ Created ${suppliers.length} suppliers`);
    
    // Seed Customers
    const customers = await Customer.insertMany(sampleCustomers);
    console.log(`✅ Created ${customers.length} customers`);
    
    // Seed Products
    const sampleProducts = [
      {
        productName: 'Cotton Yarn 20s',
        description: 'Premium quality cotton yarn 20 count',
        category: categories[0]._id, // Cotton Yarn category
        specifications: {
          yarnCount: '20s',
          material: 'Cotton',
          color: 'Natural',
          quality: 'Premium',
          packingType: 'Bags',
          standardWeight: 100
        },
        pricing: {
          basePrice: 180,
          priceUnit: 'Per Kg',
          minimumOrderQuantity: 10
        },
        inventory: {
          currentStock: 500,
          reorderLevel: 50,
          maxStockLevel: 1000
        },
        suppliers: [
          {
            supplier: suppliers[0]._id,
            supplierPrice: 175,
            leadTime: 7,
            isPreferred: true
          }
        ]
      },
      {
        productName: 'Cotton Yarn 30s',
        description: 'Standard quality cotton yarn 30 count',
        category: categories[0]._id,
        specifications: {
          yarnCount: '30s',
          material: 'Cotton',
          color: 'White',
          quality: 'Standard',
          packingType: 'Bags',
          standardWeight: 100
        },
        pricing: {
          basePrice: 195,
          priceUnit: 'Per Kg',
          minimumOrderQuantity: 10
        },
        inventory: {
          currentStock: 300,
          reorderLevel: 30,
          maxStockLevel: 800
        },
        suppliers: [
          {
            supplier: suppliers[1]._id,
            supplierPrice: 190,
            leadTime: 5,
            isPreferred: true
          }
        ]
      },
      {
        productName: 'Polyester Roll 150D',
        description: 'High quality polyester roll 150 denier',
        category: categories[1]._id, // Polyester category
        specifications: {
          yarnCount: '150D',
          material: 'Polyester',
          color: 'Natural',
          quality: 'Premium',
          packingType: 'Rolls',
          standardWeight: 75
        },
        pricing: {
          basePrice: 120,
          priceUnit: 'Per Kg',
          minimumOrderQuantity: 5
        },
        inventory: {
          currentStock: 200,
          reorderLevel: 20,
          maxStockLevel: 500
        },
        suppliers: [
          {
            supplier: suppliers[2]._id,
            supplierPrice: 115,
            leadTime: 10,
            isPreferred: true
          }
        ]
      },
      {
        productName: 'Blended Yarn 60/40',
        description: 'Cotton-Polyester blend 60/40 ratio',
        category: categories[2]._id, // Blended Yarn category
        specifications: {
          yarnCount: '20s',
          material: 'Cotton-Polyester',
          blendRatio: '60/40',
          color: 'Natural',
          quality: 'Standard',
          packingType: 'Bags',
          standardWeight: 80
        },
        pricing: {
          basePrice: 165,
          priceUnit: 'Per Kg',
          minimumOrderQuantity: 15
        },
        inventory: {
          currentStock: 150,
          reorderLevel: 25,
          maxStockLevel: 600
        },
        suppliers: [
          {
            supplier: suppliers[0]._id,
            supplierPrice: 160,
            leadTime: 8,
            isPreferred: true
          }
        ]
      }
    ];
    
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ Created ${products.length} products`);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Suppliers: ${suppliers.length}`);
    console.log(`   Customers: ${customers.length}`);
    console.log(`   Products: ${products.length}`);
    
    logger.info('Database seeding completed successfully');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    logger.error('Database seeding failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run seeding if this file is executed directly
if (process.argv[1].endsWith('seedData.js')) {
  seedDatabase();
}

export default seedDatabase;
