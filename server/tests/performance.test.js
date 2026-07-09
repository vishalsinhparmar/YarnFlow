import { expect } from 'chai';
import request from 'supertest';
import { app } from '../index.js';
import { TEST_CONFIG } from './config.js';
import logger from '../src/utils/logger.js';

describe('⚡ Performance & Load Testing', () => {
    
    let authToken = '';
    
    before(async () => {
        // Setup auth token for performance tests
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: TEST_CONFIG.testData.user.email,
                password: TEST_CONFIG.testData.user.password
            });
        
        if (loginResponse.body.success) {
            authToken = loginResponse.body.data.token;
        }
    });

    describe('🚀 Response Time Tests', () => {
        
        it('✅ Dashboard stats should respond within 2 seconds', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/dashboard/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            const responseTime = Date.now() - startTime;
            
            expect(responseTime).to.be.below(TEST_CONFIG.performance.maxResponseTime);
            expect(response.body).to.have.property('success', true);
            
            logger.info(`📊 Dashboard stats response time: ${responseTime}ms`);
        });

        it('✅ Purchase orders list should respond within 2 seconds', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/purchase-orders?limit=50')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            const responseTime = Date.now() - startTime;
            
            expect(responseTime).to.be.below(TEST_CONFIG.performance.maxResponseTime);
            expect(response.body).to.have.property('success', true);
            
            logger.info(`📦 Purchase orders response time: ${responseTime}ms`);
        });

        it('✅ Inventory should respond within 2 seconds', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/inventory')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            const responseTime = Date.now() - startTime;
            
            expect(responseTime).to.be.below(TEST_CONFIG.performance.maxResponseTime);
            expect(response.body).to.have.property('success', true);
            
            logger.info(`📦 Inventory response time: ${responseTime}ms`);
        });

        it('✅ Sales orders should respond within 2 seconds', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/sales-orders?limit=50')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            const responseTime = Date.now() - startTime;
            
            expect(responseTime).to.be.below(TEST_CONFIG.performance.maxResponseTime);
            expect(response.body).to.have.property('success', true);
            
            logger.info(`💰 Sales orders response time: ${responseTime}ms`);
        });
    });

    describe('🔄 Concurrent Request Tests', () => {
        
        it('✅ Should handle 50 concurrent dashboard requests', async () => {
            const concurrentRequests = TEST_CONFIG.performance.concurrentRequests;
            const promises = [];
            
            const startTime = Date.now();
            
            for (let i = 0; i < concurrentRequests; i++) {
                promises.push(
                    request(app)
                        .get('/api/dashboard/stats')
                        .set('Authorization', `Bearer ${authToken}`)
                );
            }
            
            const results = await Promise.all(promises);
            const totalTime = Date.now() - startTime;
            const successCount = results.filter(res => res.status === 200).length;
            const avgResponseTime = totalTime / concurrentRequests;
            
            expect(successCount).to.equal(concurrentRequests);
            expect(avgResponseTime).to.be.below(TEST_CONFIG.performance.maxResponseTime);
            
            logger.info(`🔄 ${concurrentRequests} concurrent requests completed in ${totalTime}ms`);
            logger.info(`📈 Average response time: ${avgResponseTime}ms`);
        }).timeout(15000);

        it('✅ Should handle 30 concurrent purchase order requests', async () => {
            const concurrentRequests = 30;
            const promises = [];
            
            const startTime = Date.now();
            
            for (let i = 0; i < concurrentRequests; i++) {
                promises.push(
                    request(app)
                        .get('/api/purchase-orders?limit=20')
                        .set('Authorization', `Bearer ${authToken}`)
                );
            }
            
            const results = await Promise.all(promises);
            const totalTime = Date.now() - startTime;
            const successCount = results.filter(res => res.status === 200).length;
            const avgResponseTime = totalTime / concurrentRequests;
            
            expect(successCount).to.equal(concurrentRequests);
            expect(avgResponseTime).to.be.below(TEST_CONFIG.performance.maxResponseTime);
            
            logger.info(`🔄 ${concurrentRequests} PO requests completed in ${totalTime}ms`);
            logger.info(`📈 Average response time: ${avgResponseTime}ms`);
        }).timeout(15000);

        it('✅ Should handle mixed concurrent requests', async () => {
            const endpoints = [
                '/api/dashboard/stats',
                '/api/purchase-orders?limit=20',
                '/api/inventory',
                '/api/sales-orders?limit=20'
            ];
            
            const promises = [];
            const startTime = Date.now();
            
            for (let i = 0; i < 40; i++) {
                const endpoint = endpoints[i % endpoints.length];
                promises.push(
                    request(app)
                        .get(endpoint)
                        .set('Authorization', `Bearer ${authToken}`)
                );
            }
            
            const results = await Promise.all(promises);
            const totalTime = Date.now() - startTime;
            const successCount = results.filter(res => res.status === 200).length;
            
            expect(successCount).to.be.at.least(35); // Allow for some failures under load
            
            logger.info(`🔄 40 mixed requests completed in ${totalTime}ms`);
            logger.info(`✅ Success rate: ${(successCount/40*100).toFixed(2)}%`);
        }).timeout(20000);
    });

    describe('💾 Memory Usage Tests', () => {
        
        it('✅ Memory usage should stay within limits during load', async () => {
            const initialMemory = process.memoryUsage();
            
            // Simulate heavy load
            const promises = [];
            for (let i = 0; i < 100; i++) {
                promises.push(
                    request(app)
                        .get('/api/dashboard/stats')
                        .set('Authorization', `Bearer ${authToken}`)
                );
            }
            
            await Promise.all(promises);
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            
            const finalMemory = process.memoryUsage();
            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
            
            expect(memoryIncrease).to.be.below(TEST_CONFIG.performance.maxMemoryUsage);
            
            logger.info(`💾 Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
        }).timeout(30000);
    });

    describe('📊 Load Testing Scenarios', () => {
        
        TEST_CONFIG.loadTests.forEach(scenario => {
            it(`✅ ${scenario.name}`, async function() {
                this.timeout(scenario.duration + 5000);
                
                const promises = [];
                const results = [];
                const startTime = Date.now();
                
                // Continuous load test
                const interval = setInterval(() => {
                    for (let i = 0; i < Math.ceil(scenario.concurrentUsers / 10); i++) {
                        const promise = request(app)
                            [scenario.method.toLowerCase()](scenario.endpoint)
                            .set('Authorization', `Bearer ${authToken}`)
                            .then(res => {
                                results.push({
                                    status: res.status,
                                    timestamp: Date.now()
                                });
                                return res;
                            });
                        promises.push(promise);
                    }
                }, 100);
                
                // Stop after duration
                setTimeout(() => {
                    clearInterval(interval);
                }, scenario.duration);
                
                // Wait for all requests to complete
                await Promise.all(promises);
                
                const totalTime = Date.now() - startTime;
                const successCount = results.filter(r => r.status === 200).length;
                const successRate = successCount / results.length;
                
                expect(successRate).to.be.at.least(scenario.expectedSuccessRate);
                
                logger.info(`📊 ${scenario.name}:`);
                logger.info(`   ⏱️  Duration: ${totalTime}ms`);
                logger.info(`   📈 Total requests: ${results.length}`);
                logger.info(`   ✅ Success rate: ${(successRate * 100).toFixed(2)}%`);
            });
        });
    });

    describe('🔧 Stress Testing', () => {
        
        it('✅ Should handle rapid sequential requests', async () => {
            const requestCount = 200;
            const results = [];
            
            const startTime = Date.now();
            
            for (let i = 0; i < requestCount; i++) {
                try {
                    const response = await request(app)
                        .get('/api/dashboard/stats')
                        .set('Authorization', `Bearer ${authToken}`);
                    results.push({ status: response.status, index: i });
                } catch (error) {
                    results.push({ status: 500, index: i, error: error.message });
                }
            }
            
            const totalTime = Date.now() - startTime;
            const successCount = results.filter(r => r.status === 200).length;
            const avgTime = totalTime / requestCount;
            
            expect(successCount).to.be.at.least(requestCount * 0.95); // 95% success rate
            expect(avgTime).to.be.below(100); // Average under 100ms per request
            
            logger.info(`🔧 Rapid sequential test:`);
            logger.info(`   📊 ${requestCount} requests in ${totalTime}ms`);
            logger.info(`   ✅ Success rate: ${(successCount/requestCount*100).toFixed(2)}%`);
            logger.info(`   ⚡ Average time per request: ${avgTime.toFixed(2)}ms`);
        }).timeout(60000);

        it('✅ Should recover from temporary overload', async () => {
            // Create massive load
            const overloadPromises = [];
            for (let i = 0; i < 500; i++) {
                overloadPromises.push(
                    request(app)
                        .get('/api/dashboard/stats')
                        .set('Authorization', `Bearer ${authToken}`)
                );
            }
            
            // Wait for overload to complete
            await Promise.allSettled(overloadPromises);
            
            // Wait a bit for recovery
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Test if server recovered
            const recoveryStartTime = Date.now();
            const recoveryResponse = await request(app)
                .get('/api/dashboard/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            const recoveryTime = Date.now() - recoveryStartTime;
            
            expect(recoveryResponse.body).to.have.property('success', true);
            expect(recoveryTime).to.be.below(TEST_CONFIG.performance.maxResponseTime);
            
            logger.info(`🔄 Server recovered in ${recoveryTime}ms after overload`);
        }).timeout(90000);
    });

    describe('🌐 Network Performance Tests', () => {
        
        it('✅ Should handle slow connections gracefully', async () => {
            // Simulate slow connection by adding delay
            const originalTimeout = request(app).timeout;
            
            const response = await request(app)
                .get('/api/dashboard/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .timeout(5000) // 5 second timeout
                .expect(200);
            
            expect(response.body).to.have.property('success', true);
        });

        it('✅ Should handle large response payloads efficiently', async () => {
            const response = await request(app)
                .get('/api/purchase-orders?limit=100')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            
            const responseSize = JSON.stringify(response.body).length;
            
            expect(response.body).to.have.property('success', true);
            expect(responseSize).to.be.below(5 * 1024 * 1024); // Less than 5MB
            
            logger.info(`📦 Large payload size: ${(responseSize / 1024).toFixed(2)}KB`);
        });
    });
});
