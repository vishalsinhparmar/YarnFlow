// Quick test script for Dashboard API
// Run this with: node test-dashboard.js

const API_BASE_URL = 'http://localhost:3050/api';

async function testDashboardAPI() {
  try {
    console.log('🧪 Testing Dashboard API...\n');
    
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Dashboard API Response:');
    console.log('📊 Workflow Metrics:', data.data.workflowMetrics);
    console.log('📈 Key Metrics:', data.data.keyMetrics);
    console.log('🕒 Recent Activity Count:', data.data.recentActivity.length);
    console.log('📋 Summary:', data.data.summary);
    
    // Show real Purchase Order data
    if (data.data.stats && data.data.stats.purchaseOrders) {
      console.log('\n🛒 Real Purchase Order Data:');
      console.log('- Total POs:', data.data.stats.purchaseOrders.total);
      console.log('- Active POs:', data.data.stats.purchaseOrders.active);
      console.log('- Pending POs:', data.data.stats.purchaseOrders.pending);
      console.log('- This Month:', data.data.stats.purchaseOrders.thisMonth);
    }
    
    console.log('\n✅ Dashboard API is working with REAL DATA! 🎉');
    
  } catch (error) {
    console.error('❌ Dashboard API Error:', error.message);
    console.log('\n🔧 Make sure:');
    console.log('1. Backend server is running on port 3050');
    console.log('2. Database is connected');
    console.log('3. Run: cd server && npm run dev:win');
  }
}

// Run the test
testDashboardAPI();
