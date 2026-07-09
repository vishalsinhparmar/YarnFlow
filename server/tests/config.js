// Test configuration for production-level testing
export const TEST_CONFIG = {
    // Database configuration
    database: {
        testURI: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/yarnflow_test',
        cleanupAfterTest: true,
        seedTestData: true
    },
    
    // API configuration
    api: {
        baseURL: process.env.API_BASE_URL || 'http://localhost:3020',
        timeout: 30000,
        retries: 3
    },
    
    // Performance thresholds
    performance: {
        maxResponseTime: 2000, // ms
        maxMemoryUsage: 512 * 1024 * 1024, // 512MB
        concurrentRequests: 50,
        loadTestDuration: 10000 // ms
    },
    
    // Test data
    testData: {
        user: {
            username: 'testuser',
            email: 'test@yarnflow.com',
            password: 'Test@123456',
            role: 'admin',
            fullName: 'Test User'
        },
        company: {
            companyName: 'Test Yarn Company',
            address: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country',
            pincode: '123456',
            phone: '+911234567890',
            email: 'company@yarnflow.com',
            gstin: 'TESTGST123456789',
            pan: 'TESTPAN1234'
        },
        category: {
            categoryName: 'Test Yarn Category',
            description: 'Test category for production testing'
        },
        supplier: {
            supplierName: 'Test Supplier',
            contactPerson: 'Test Contact',
            email: 'supplier@yarnflow.com',
            phone: '+911234567890',
            address: '123 Supplier Street',
            gstin: 'SUPPLIERGST123456789'
        },
        customer: {
            customerName: 'Test Customer',
            contactPerson: 'Customer Contact',
            email: 'customer@yarnflow.com',
            phone: '+911234567891',
            address: '123 Customer Street',
            gstin: 'CUSTOMERGST123456789'
        },
        product: {
            productName: 'Test Yarn Product',
            productCode: 'TEST001',
            description: 'Test product for production testing',
            unit: 'KG',
            price: 100.00,
            minStock: 100
        }
    },
    
    // Security test payloads
    security: {
        xssPayloads: [
            '<script>alert("xss")</script>',
            'javascript:alert("xss")',
            '<img src="x" onerror="alert(\'xss\')">',
            '\"><script>alert(\"xss\")</script>',
            '<svg onload="alert(\'xss\')">'
        ],
        sqlInjectionPayloads: [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "1' UNION SELECT * FROM users--",
            "'; DELETE FROM users; --"
        ],
        malformedTokens: [
            'invalid.token.here',
            'Bearer',
            '',
            null,
            undefined
        ]
    },
    
    // Load testing scenarios
    loadTests: [
        {
            name: 'Dashboard Stats Load Test',
            endpoint: '/api/dashboard/stats',
            method: 'GET',
            concurrentUsers: 50,
            duration: 10000,
            expectedSuccessRate: 0.95
        },
        {
            name: 'Purchase Orders Load Test',
            endpoint: '/api/purchase-orders',
            method: 'GET',
            concurrentUsers: 30,
            duration: 8000,
            expectedSuccessRate: 0.90
        },
        {
            name: 'Inventory Load Test',
            endpoint: '/api/inventory',
            method: 'GET',
            concurrentUsers: 40,
            duration: 12000,
            expectedSuccessRate: 0.95
        }
    ]
};
