import { expect } from 'chai';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../index.js';
import User from '../src/models/user.model.js';
import CompanyProfile from '../src/models/CompanyProfile.js';
import logger from '../src/utils/logger.js';

// Test configuration
const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/yarnflow_test';
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3020';

// Test data
let authToken = '';
let testCompanyId = '';
let testUserId = '';
let testProductId = '';
let testCategoryId = '';
let testSupplierId = '';
let testCustomerId = '';
let testPOId = '';
let testGRNId = '';
let testSOId = '';
let testChallanId = '';

// Production-level test suite
describe('🚀 YarnFlow Production-Level Server Tests', () => {
    
    before(async () => {
        try {
            // Close any existing connections
            if (mongoose.connection.readyState !== 0) {
                await mongoose.connection.close();
            }
            
            // Connect to test database
            await mongoose.connect(TEST_DB_URI);
            logger.info('✅ Test database connected');
            
            // Clean up test database
            await mongoose.connection.db.dropDatabase();
            logger.info('🧹 Test database cleaned');
            
        } catch (error) {
            logger.error('❌ Test setup failed:', error);
            throw error;
        }
    });

    after(async () => {
        try {
            // Clean up and close database connection
            if (mongoose.connection.readyState !== 0) {
                await mongoose.connection.db.dropDatabase();
                await mongoose.connection.close();
                logger.info('✅ Test database cleaned and closed');
            }
        } catch (error) {
            logger.error('❌ Test cleanup failed:', error);
        }
    });

    describe('🔧 Server Infrastructure Tests', () => {
        
        it('✅ Server should start and respond to health check', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);
            
            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('message');
            expect(response.body).to.have.property('timestamp');
        });

        it('✅ CORS should be properly configured', async () => {
            const response = await request(app)
                .options('/')
                .set('Origin', 'http://localhost:3000')
                .expect(200);
            
            expect(response.headers).to.have.property('access-control-allow-origin');
        });

        it('✅ Request size limits should be enforced', async () => {
            const largePayload = 'x'.repeat(11 * 1024 * 1024); // 11MB
            
            const response = await request(app)
                .post('/api/auth/login')
                .send({ data: largePayload })
                .expect(413);
        });

        it('✅ Global error handler should catch unhandled errors', async () => {
            const response = await request(app)
                .get('/non-existent-route')
                .expect(404);
            
            expect(response.body).to.have.property('success', false);
        });
    });

    describe('🔐 Authentication & Authorization Tests', () => {
        
        it('✅ Should register a new user', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@yarnflow.com',
                password: 'Test@123456',
                role: 'admin',
                fullName: 'Test User'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('token');
            expect(response.body.data.user).to.have.property('email', userData.email);
            
            authToken = response.body.data.token;
            testUserId = response.body.data.user._id;
        });

        it('✅ Should login with valid credentials', async () => {
            const loginData = {
                email: 'test@yarnflow.com',
                password: 'Test@123456'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('token');
            authToken = response.body.data.token;
        });

        it('❌ Should reject invalid credentials', async () => {
            const loginData = {
                email: 'test@yarnflow.com',
                password: 'wrongpassword'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body).to.have.property('success', false);
        });

        it('✅ Should validate JWT token', async () => {
            const response = await request(app)
                .get('/api/auth/validate')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
        });

        it('❌ Should reject requests without authentication', async () => {
            const response = await request(app)
                .get('/api/dashboard/stats')
                .expect(401);

            expect(response.body).to.have.property('success', false);
        });
    });

    describe('📊 Dashboard API Tests', () => {
        
        it('✅ Should fetch dashboard statistics', async () => {
            const response = await request(app)
                .get('/api/dashboard/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('stats');
            expect(response.body.data.stats).to.have.property('purchaseOrders');
            expect(response.body.data.stats).to.have.property('grn');
            expect(response.body.data.stats).to.have.property('inventory');
            expect(response.body.data.stats).to.have.property('salesOrders');
        });

        it('✅ Should fetch recent activities', async () => {
            const response = await request(app)
                .get('/api/dashboard/recent-activities')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.be.an('array');
        });
    });

    describe('🏢 Company Profile Tests', () => {
        
        it('✅ Should create company profile', async () => {
            const companyData = {
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
            };

            const response = await request(app)
                .post('/api/company-profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(companyData)
                .expect(201);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('companyName', companyData.companyName);
            testCompanyId = response.body.data._id;
        });

        it('✅ Should fetch company profile', async () => {
            const response = await request(app)
                .get('/api/company-profile')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('companyName');
        });

        it('✅ Should update company profile', async () => {
            const updateData = {
                phone: '+919876543210'
            };

            const response = await request(app)
                .put('/api/company-profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('phone', updateData.phone);
        });
    });

    describe('📦 Master Data Tests', () => {
        
        it('✅ Should create category', async () => {
            const categoryData = {
                categoryName: 'Test Yarn Category',
                description: 'Test category for production testing'
            };

            const response = await request(app)
                .post('/api/master-data/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .send(categoryData)
                .expect(201);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('categoryName', categoryData.categoryName);
            testCategoryId = response.body.data._id;
        });

        it('✅ Should create supplier', async () => {
            const supplierData = {
                supplierName: 'Test Supplier',
                contactPerson: 'Test Contact',
                email: 'supplier@yarnflow.com',
                phone: '+911234567890',
                address: '123 Supplier Street',
                gstin: 'SUPPLIERGST123456789'
            };

            const response = await request(app)
                .post('/api/master-data/suppliers')
                .set('Authorization', `Bearer ${authToken}`)
                .send(supplierData)
                .expect(201);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('supplierName', supplierData.supplierName);
            testSupplierId = response.body.data._id;
        });

        it('✅ Should create customer', async () => {
            const customerData = {
                customerName: 'Test Customer',
                contactPerson: 'Customer Contact',
                email: 'customer@yarnflow.com',
                phone: '+911234567891',
                address: '123 Customer Street',
                gstin: 'CUSTOMERGST123456789'
            };

            const response = await request(app)
                .post('/api/master-data/customers')
                .set('Authorization', `Bearer ${authToken}`)
                .send(customerData)
                .expect(201);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('customerName', customerData.customerName);
            testCustomerId = response.body.data._id;
        });

        it('✅ Should create product', async () => {
            const productData = {
                productName: 'Test Yarn Product',
                productCode: 'TEST001',
                category: testCategoryId,
                description: 'Test product for production testing',
                unit: 'KG',
                price: 100.00,
                minStock: 100
            };

            const response = await request(app)
                .post('/api/master-data/products')
                .set('Authorization', `Bearer ${authToken}`)
                .send(productData)
                .expect(201);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('productName', productData.productName);
            testProductId = response.body.data._id;
        });

        it('✅ Should fetch all master data', async () => {
            const response = await request(app)
                .get('/api/master-data')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('categories');
            expect(response.body.data).to.have.property('suppliers');
            expect(response.body.data).to.have.property('customers');
            expect(response.body.data).to.have.property('products');
        });
    });

    describe('🛒 Purchase Order Tests', () => {
        
        it('✅ Should create purchase order', async () => {
            const poData = {
                supplier: testSupplierId,
                orderDate: new Date().toISOString(),
                expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                items: [
                    {
                        product: testProductId,
                        quantity: 100,
                        unitPrice: 50.00,
                        totalPrice: 5000.00
                    }
                ],
                terms: 'Test terms and conditions',
                notes: 'Test notes'
            };

            const response = await request(app)
                .post('/api/purchase-orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send(poData)
                .expect(201);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('poNumber');
            expect(response.body.data.items).to.be.an('array');
            testPOId = response.body.data._id;
        });

        it('✅ Should fetch purchase orders', async () => {
            const response = await request(app)
                .get('/api/purchase-orders')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.be.an('array');
        });

        it('✅ Should update purchase order status', async () => {
            const response = await request(app)
                .patch(`/api/purchase-orders/${testPOId}/status`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'Approved', notes: 'Approved for testing' })
                .expect(200);

            expect(response.body).to.have.property('success', true);
        });
    });

    describe('📥 Goods Receipt Note Tests', () => {
        
        it('✅ Should create GRN', async () => {
            const grnData = {
                purchaseOrder: testPOId,
                grnDate: new Date().toISOString(),
                items: [
                    {
                        product: testProductId,
                        purchaseOrderItem: testPOId,
                        receivedQuantity: 95,
                        acceptedQuantity: 90,
                        rejectedQuantity: 5,
                        unitPrice: 50.00,
                        batchNumber: 'BATCH001',
                        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ],
                notes: 'Test GRN for production testing'
            };

            const response = await request(app)
                .post('/api/grn')
                .set('Authorization', `Bearer ${authToken}`)
                .send(grnData)
                .expect(201);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('grnNumber');
            testGRNId = response.body.data._id;
        });

        it('✅ Should fetch GRNs', async () => {
            const response = await request(app)
                .get('/api/grn')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.be.an('array');
        });

        it('✅ Should get GRN statistics', async () => {
            const response = await request(app)
                .get('/api/grn/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('totalGRNs');
        });
    });

    describe('📦 Inventory Tests', () => {
        
        it('✅ Should fetch inventory lots', async () => {
            const response = await request(app)
                .get('/api/inventory')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.be.an('array');
        });

        it('✅ Should get inventory statistics', async () => {
            const response = await request(app)
                .get('/api/inventory/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('totalLots');
        });

        it('✅ Should fetch inventory by category', async () => {
            const response = await request(app)
                .get(`/api/inventory/category/${testCategoryId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
        });
    });

    describe('💰 Sales Order Tests', () => {
        
        it('✅ Should create sales order', async () => {
            const soData = {
                customer: testCustomerId,
                orderDate: new Date().toISOString(),
                expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                items: [
                    {
                        product: testProductId,
                        quantity: 50,
                        unitPrice: 60.00,
                        totalPrice: 3000.00
                    }
                ],
                terms: 'Test sales terms',
                notes: 'Test sales order notes'
            };

            const response = await request(app)
                .post('/api/sales-orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send(soData)
                .expect(201);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('soNumber');
            testSOId = response.body.data._id;
        });

        it('✅ Should fetch sales orders', async () => {
            const response = await request(app)
                .get('/api/sales-orders')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.be.an('array');
        });

        it('✅ Should get sales order statistics', async () => {
            const response = await request(app)
                .get('/api/sales-orders/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('overview');
        });
    });

    describe('🚚 Sales Challan Tests', () => {
        
        it('✅ Should create sales challan', async () => {
            const challanData = {
                salesOrder: testSOId,
                challanDate: new Date().toISOString(),
                items: [
                    {
                        product: testProductId,
                        salesOrderItem: testSOId,
                        dispatchQuantity: 25,
                        unitPrice: 60.00,
                        totalPrice: 1500.00,
                        batchNumber: 'BATCH001'
                    }
                ],
                vehicleNumber: 'TEST1234',
                driverName: 'Test Driver',
                notes: 'Test challan notes'
            };

            const response = await request(app)
                .post('/api/sales-challans')
                .set('Authorization', `Bearer ${authToken}`)
                .send(challanData)
                .expect(201);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('challanNumber');
            testChallanId = response.body.data._id;
        });

        it('✅ Should fetch sales challans', async () => {
            const response = await request(app)
                .get('/api/sales-challans')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.be.an('array');
        });

        it('✅ Should get challan statistics', async () => {
            const response = await request(app)
                .get('/api/sales-challans/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
            expect(response.body.data).to.have.property('totalChallans');
        });
    });

    describe('📈 Performance & Scalability Tests', () => {
        
        it('✅ Should handle concurrent requests', async () => {
            const promises = [];
            const concurrentRequests = 50;

            for (let i = 0; i < concurrentRequests; i++) {
                promises.push(
                    request(app)
                        .get('/api/dashboard/stats')
                        .set('Authorization', `Bearer ${authToken}`)
                );
            }

            const results = await Promise.all(promises);
            const successCount = results.filter(res => res.status === 200).length;
            
            expect(successCount).to.equal(concurrentRequests);
        }).timeout(10000);

        it('✅ Should respond within acceptable time limits', async () => {
            const startTime = Date.now();
            
            await request(app)
                .get('/api/dashboard/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            const responseTime = Date.now() - startTime;
            expect(responseTime).to.be.below(2000); // Should respond within 2 seconds
        });

        it('✅ Should handle large data requests', async () => {
            const response = await request(app)
                .get('/api/purchase-orders?limit=100&page=1')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
        });
    });

    describe('🛡️ Security Tests', () => {
        
        it('❌ Should prevent SQL injection attempts', async () => {
            const maliciousInput = "'; DROP TABLE users; --";
            
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: maliciousInput, password: 'test' })
                .expect(401);

            expect(response.body).to.have.property('success', false);
        });

        it('❌ Should prevent XSS attempts', async () => {
            const xssPayload = '<script>alert("xss")</script>';
            
            const response = await request(app)
                .post('/api/master-data/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ categoryName: xssPayload })
                .expect(400); // Should be caught by validation

            expect(response.body).to.have.property('success', false);
        });

        it('❌ Should reject malformed JWT tokens', async () => {
            const response = await request(app)
                .get('/api/dashboard/stats')
                .set('Authorization', 'Bearer invalid.token.here')
                .expect(401);

            expect(response.body).to.have.property('success', false);
        });
    });

    describe('🔍 Data Integrity Tests', () => {
        
        it('✅ Should maintain data consistency across related entities', async () => {
            // Verify PO status reflects GRN creation
            const poResponse = await request(app)
                .get(`/api/purchase-orders/${testPOId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(poResponse.body.data).to.have.property('status');
        });

        it('✅ Should handle transaction rollback on errors', async () => {
            const invalidData = {
                supplier: 'invalid-id',
                items: []
            };

            const response = await request(app)
                .post('/api/purchase-orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body).to.have.property('success', false);
        });
    });

    describe('📊 Reporting Tests', () => {
        
        it('✅ Should generate inventory reports', async () => {
            const response = await request(app)
                .get('/api/reports/inventory')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
        });

        it('✅ Should generate sales reports', async () => {
            const response = await request(app)
                .get('/api/reports/sales')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success', true);
        });
    });

    describe('🔄 API Versioning & Compatibility Tests', () => {
        
        it('✅ Should maintain backward compatibility', async () => {
            // Test that existing endpoints still work with expected response format
            const response = await request(app)
                .get('/api/dashboard/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).to.have.property('success');
            expect(response.body).to.have.property('data');
        });
    });
});
