import mongoose from 'mongoose';
import SalesOrder from './src/models/SalesOrder.js';
import Customer from './src/models/Customer.js';
import Product from './src/models/Product.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/yarnflow');
    console.log('MongoDB Connected for seeding Sales Orders...');
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
    paymentTerms: 'Net_30',
    creditLimit: 500000
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
    paymentTerms: 'Net_15',
    creditLimit: 300000
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
    paymentTerms: 'Net_45',
    creditLimit: 750000
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
    basePrice: 180
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
    basePrice: 25
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
    basePrice: 120
  }
];

// Create sample sales orders
const createSampleData = async () => {
  try {
    await connectDB();
    
    console.log('🗑️  Clearing existing data...');
    await SalesOrder.deleteMany({});
    await Customer.deleteMany({});
    await Product.deleteMany({});
    
    console.log('👥 Creating sample customers...');
    const customers = await Customer.insertMany(sampleCustomers);
    console.log(`✅ Created ${customers.length} customers`);
    
    console.log('📦 Creating sample products...');
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ Created ${products.length} products`);
    
    console.log('📋 Creating sample sales orders...');
    
    // Sample sales orders data
    const sampleSalesOrders = [
      {
        customer: customers[0]._id,
        customerDetails: {
          companyName: customers[0].companyName,
          contactPerson: customers[0].contactPerson,
          email: customers[0].email,
          phone: customers[0].phone,
          address: customers[0].address
        },
        orderDate: new Date('2024-01-15'),
        expectedDeliveryDate: new Date('2024-01-25'),
        items: [
          {
            product: products[0]._id,
            productName: products[0].productName,
            productCode: products[0].productCode,
            orderedQuantity: 500,
            unit: 'Kg',
            unitPrice: 180,
            taxRate: 18
          },
          {
            product: products[1]._id,
            productName: products[1].productName,
            productCode: products[1].productCode,
            orderedQuantity: 100,
            unit: 'Spools',
            unitPrice: 25,
            taxRate: 18
          }
        ],
        customerPONumber: 'FH-PO-2024-001',
        salesPerson: 'Vikash Singh',
        paymentTerms: 'Net_30',
        priority: 'High',
        orderType: 'Regular',
        status: 'Processing',
        paymentStatus: 'Pending',
        customerNotes: 'Urgent delivery required for fashion week',
        internalNotes: 'High priority customer - ensure quality',
        createdBy: 'Sales Team',
        workflowHistory: [
          {
            status: 'Draft',
            changedBy: 'Sales Team',
            changedDate: new Date('2024-01-15T09:00:00Z'),
            notes: 'Order created'
          },
          {
            status: 'Confirmed',
            changedBy: 'Sales Manager',
            changedDate: new Date('2024-01-15T10:30:00Z'),
            notes: 'Order confirmed after credit check'
          },
          {
            status: 'Processing',
            changedBy: 'Warehouse',
            changedDate: new Date('2024-01-16T08:00:00Z'),
            notes: 'Inventory reserved and processing started'
          }
        ]
      },
      {
        customer: customers[1]._id,
        customerDetails: {
          companyName: customers[1].companyName,
          contactPerson: customers[1].contactPerson,
          email: customers[1].email,
          phone: customers[1].phone,
          address: customers[1].address
        },
        orderDate: new Date('2024-01-14'),
        expectedDeliveryDate: new Date('2024-01-22'),
        actualDeliveryDate: new Date('2024-01-20'),
        items: [
          {
            product: products[2]._id,
            productName: products[2].productName,
            productCode: products[2].productCode,
            orderedQuantity: 1000,
            shippedQuantity: 1000,
            deliveredQuantity: 1000,
            unit: 'Meters',
            unitPrice: 120,
            taxRate: 18,
            itemStatus: 'Delivered'
          }
        ],
        customerPONumber: 'TW-PO-2024-002',
        salesPerson: 'Priya Mehta',
        paymentTerms: 'Net_15',
        priority: 'Medium',
        orderType: 'Bulk',
        status: 'Delivered',
        paymentStatus: 'Paid',
        trackingNumber: 'TRK123456789',
        courierCompany: 'BlueDart',
        customerNotes: 'Standard delivery acceptable',
        internalNotes: 'Regular customer - good payment history',
        createdBy: 'Sales Team',
        workflowHistory: [
          {
            status: 'Draft',
            changedBy: 'Sales Team',
            changedDate: new Date('2024-01-14T09:00:00Z'),
            notes: 'Order created'
          },
          {
            status: 'Confirmed',
            changedBy: 'Sales Manager',
            changedDate: new Date('2024-01-14T11:00:00Z'),
            notes: 'Order confirmed'
          },
          {
            status: 'Processing',
            changedBy: 'Warehouse',
            changedDate: new Date('2024-01-15T08:00:00Z'),
            notes: 'Processing started'
          },
          {
            status: 'Shipped',
            changedBy: 'Logistics',
            changedDate: new Date('2024-01-18T14:00:00Z'),
            notes: 'Shipped via BlueDart'
          },
          {
            status: 'Delivered',
            changedBy: 'System',
            changedDate: new Date('2024-01-20T16:30:00Z'),
            notes: 'Delivered successfully'
          }
        ]
      },
      {
        customer: customers[2]._id,
        customerDetails: {
          companyName: customers[2].companyName,
          contactPerson: customers[2].contactPerson,
          email: customers[2].email,
          phone: customers[2].phone,
          address: customers[2].address
        },
        orderDate: new Date('2024-01-12'),
        expectedDeliveryDate: new Date('2024-01-20'),
        items: [
          {
            product: products[0]._id,
            productName: products[0].productName,
            productCode: products[0].productCode,
            orderedQuantity: 200,
            shippedQuantity: 200,
            unit: 'Kg',
            unitPrice: 180,
            taxRate: 18,
            itemStatus: 'Shipped'
          }
        ],
        customerPONumber: 'PF-PO-2024-003',
        salesPerson: 'Rahul Gupta',
        paymentTerms: 'Net_45',
        priority: 'Medium',
        orderType: 'Regular',
        status: 'Shipped',
        paymentStatus: 'Pending',
        trackingNumber: 'TRK987654321',
        courierCompany: 'DTDC',
        customerNotes: 'Handle with care - premium quality required',
        internalNotes: 'Premium customer - ensure best quality',
        createdBy: 'Sales Team',
        workflowHistory: [
          {
            status: 'Draft',
            changedBy: 'Sales Team',
            changedDate: new Date('2024-01-12T10:00:00Z'),
            notes: 'Order created'
          },
          {
            status: 'Confirmed',
            changedBy: 'Sales Manager',
            changedDate: new Date('2024-01-12T15:00:00Z'),
            notes: 'Order confirmed'
          },
          {
            status: 'Processing',
            changedBy: 'Warehouse',
            changedDate: new Date('2024-01-13T09:00:00Z'),
            notes: 'Processing started'
          },
          {
            status: 'Shipped',
            changedBy: 'Logistics',
            changedDate: new Date('2024-01-18T11:00:00Z'),
            notes: 'Shipped via DTDC'
          }
        ]
      },
      // Add more orders with different statuses
      {
        customer: customers[0]._id,
        customerDetails: {
          companyName: customers[0].companyName,
          contactPerson: customers[0].contactPerson,
          email: customers[0].email,
          phone: customers[0].phone,
          address: customers[0].address
        },
        orderDate: new Date(),
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        items: [
          {
            product: products[1]._id,
            productName: products[1].productName,
            productCode: products[1].productCode,
            orderedQuantity: 50,
            unit: 'Spools',
            unitPrice: 25,
            taxRate: 18,
            itemStatus: 'Pending'
          }
        ],
        customerPONumber: 'FH-PO-2024-004',
        salesPerson: 'Vikash Singh',
        paymentTerms: 'Net_30',
        priority: 'Low',
        orderType: 'Sample',
        status: 'Pending',
        paymentStatus: 'Pending',
        customerNotes: 'Sample order for quality check',
        internalNotes: 'Sample order - ensure best quality for evaluation',
        createdBy: 'Sales Team',
        workflowHistory: [
          {
            status: 'Draft',
            changedBy: 'Sales Team',
            changedDate: new Date(),
            notes: 'Sample order created'
          }
        ]
      },
      {
        customer: customers[1]._id,
        customerDetails: {
          companyName: customers[1].companyName,
          contactPerson: customers[1].contactPerson,
          email: customers[1].email,
          phone: customers[1].phone,
          address: customers[1].address
        },
        orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        items: [
          {
            product: products[2]._id,
            productName: products[2].productName,
            productCode: products[2].productCode,
            orderedQuantity: 300,
            unit: 'Meters',
            unitPrice: 120,
            taxRate: 18,
            itemStatus: 'Pending'
          }
        ],
        customerPONumber: 'TW-PO-2024-005',
        salesPerson: 'Priya Mehta',
        paymentTerms: 'Net_15',
        priority: 'Urgent',
        orderType: 'Rush',
        status: 'Draft',
        paymentStatus: 'Pending',
        customerNotes: 'Rush order - need ASAP',
        internalNotes: 'Rush order - prioritize processing',
        createdBy: 'Sales Team',
        workflowHistory: [
          {
            status: 'Draft',
            changedBy: 'Sales Team',
            changedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            notes: 'Rush order created'
          }
        ]
      }
    ];
    
    // Generate SO numbers and create orders
    for (const orderData of sampleSalesOrders) {
      orderData.soNumber = await SalesOrder.generateSONumber();
    }
    
    const salesOrders = await SalesOrder.insertMany(sampleSalesOrders);
    console.log(`✅ Created ${salesOrders.length} sales orders`);
    
    // Calculate and display statistics
    const stats = await SalesOrder.getOrderStats();
    
    console.log('\n📊 Sales Order Statistics:');
    console.log(`   Total Orders: ${stats.overview.totalOrders}`);
    console.log(`   Total Revenue: ₹${stats.overview.totalRevenue.toLocaleString()}`);
    console.log(`   Average Order Value: ₹${Math.round(stats.overview.avgOrderValue).toLocaleString()}`);
    
    console.log('\n📈 Status Breakdown:');
    stats.statusBreakdown.forEach(status => {
      console.log(`   ${status._id}: ${status.count} orders (₹${status.totalValue.toLocaleString()})`);
    });
    
    console.log('\n🎯 Sample Sales Orders Created:');
    salesOrders.forEach(order => {
      console.log(`   ${order.soNumber}: ${order.customerDetails.companyName} - ${order.status} (₹${order.totalAmount.toLocaleString()})`);
    });
    
    console.log('\n🚀 Your Sales Order system is ready!');
    console.log('   Backend API: http://localhost:3020/api/sales-orders');
    console.log('   Frontend: Ready for implementation');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding sales order data:', error);
    process.exit(1);
  }
};

// Run the seeding
createSampleData();
