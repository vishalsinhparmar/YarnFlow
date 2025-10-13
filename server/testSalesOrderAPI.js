import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3020/api';

// Test function to check if sales order API is working
const testSalesOrderAPI = async () => {
  console.log('🧪 Testing Sales Order API...\n');

  try {
    // Test 1: Get statistics
    console.log('1. Testing GET /api/sales-orders/stats');
    const statsResponse = await fetch(`${API_BASE_URL}/sales-orders/stats`);
    const statsData = await statsResponse.json();
    console.log('✅ Stats Response:', statsData.success ? 'Success' : 'Failed');
    console.log('   Data:', JSON.stringify(statsData, null, 2));
    console.log('');

    // Test 2: Get all sales orders
    console.log('2. Testing GET /api/sales-orders');
    const ordersResponse = await fetch(`${API_BASE_URL}/sales-orders`);
    const ordersData = await ordersResponse.json();
    console.log('✅ Orders Response:', ordersData.success ? 'Success' : 'Failed');
    console.log('   Total Orders:', ordersData.data?.length || 0);
    console.log('');

    // Test 3: Test master data endpoints
    console.log('3. Testing GET /api/master-data/customers');
    const customersResponse = await fetch(`${API_BASE_URL}/master-data/customers`);
    const customersData = await customersResponse.json();
    console.log('✅ Customers Response:', customersData.success ? 'Success' : 'Failed');
    console.log('   Total Customers:', customersData.data?.length || 0);
    console.log('');

    console.log('4. Testing GET /api/master-data/products');
    const productsResponse = await fetch(`${API_BASE_URL}/master-data/products`);
    const productsData = await productsResponse.json();
    console.log('✅ Products Response:', productsData.success ? 'Success' : 'Failed');
    console.log('   Total Products:', productsData.data?.length || 0);
    console.log('');

    // Test 4: Create a test sales order
    console.log('5. Testing POST /api/sales-orders (Create Order)');
    const testOrder = {
      customer: customersData.data?.[0]?._id || '507f1f77bcf86cd799439011',
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          product: productsData.data?.[0]?._id || '507f1f77bcf86cd799439012',
          orderedQuantity: 10,
          unit: 'Kg',
          unitPrice: 100,
          taxRate: 18
        }
      ],
      customerPONumber: 'TEST-PO-001',
      salesPerson: 'Test User',
      paymentTerms: 'Net_30',
      priority: 'Medium',
      orderType: 'Regular',
      shippingMethod: 'Standard',
      discountPercentage: 0,
      discountAmount: 0,
      shippingCharges: 0,
      customerNotes: 'Test order',
      internalNotes: 'Created by test script',
      createdBy: 'Test Script'
    };

    const createResponse = await fetch(`${API_BASE_URL}/sales-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testOrder)
    });

    const createData = await createResponse.json();
    console.log('✅ Create Order Response:', createData.success ? 'Success' : 'Failed');
    if (!createData.success) {
      console.log('   Error:', createData.message);
      console.log('   Details:', createData.errors || createData.error);
    } else {
      console.log('   Order Created:', createData.data?.soNumber);
    }
    console.log('');

    console.log('🎉 Sales Order API Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('   Make sure the server is running: npm run dev');
  }
};

// Run the test
testSalesOrderAPI();
