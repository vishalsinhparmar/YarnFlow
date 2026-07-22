import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db.js';
import authRoutes from './src/routes/authRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import masterDataRoutes from './src/routes/masterDataRoutes.js';
import purchaseOrderRoutes from './src/routes/purchaseOrderRoutes.js';
import grnRoutes from './src/routes/grnRoutes.js';
import inventoryRoutes from './src/routes/inventoryRoutes.js';
import salesOrderRoutes from './src/routes/salesOrderRoutes.js';
import salesChallanRoutes from './src/routes/salesChallanRoutes.js';
import companyProfileRoutes from './src/routes/companyProfileRoutes.js';
import warehouseRoutes from './src/routes/warehouseRoutes.js';
import userManagementRoutes from './src/routes/userManagementRoutes.js';
import reportsRoutes from './src/routes/reportsRoutes.js';
import logger from './src/utils/logger.js';

// Load environment variables based on NODE_ENV
const NODE_ENV = process.env.NODE_ENV || 'development';

// Load environment-specific .env file with fallback
try {
    if (NODE_ENV === 'production') {
        dotenv.config({ path: '.env.production' });
        console.log(`🌍 Loading environment: production`);
    } else {
        // Default to development
        dotenv.config({ path: '.env.developement' });
        console.log(`🌍 Loading environment: development`);
    }
} catch (error) {
    console.log('⚠️ Environment file not found, using default configuration');
    dotenv.config(); // Fallback to default .env
}

const app = express();

// CORS Configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',') 
        : ['http://localhost:3000', 'http://localhost:5173','http://localhost:8081'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle malformed JSON and oversized payloads — must be error middleware (4 args) right after parsers
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400)) {
        return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
    }
    if (err.status === 413 || err.type === 'entity.too.large') {
        return res.status(400).json({ success: false, message: 'Request payload too large' });
    }
    next(err);
});

// Connect to database
connectDB();

// Health check route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: "YarnFlow Server is running",
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);  // ✅ Fixed: Added /api prefix for consistency
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/grn', grnRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/sales-challans', salesChallanRoutes);
app.use('/api/company-profile', companyProfileRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/users', userManagementRoutes);
app.use('/api/reports', reportsRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use((error, req, res, next) => {
    logger.error('Global error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

const PORT = process.env.PORT || 3020;

// Export app for testing
export { app };

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 YarnFlow Server is running on port ${PORT}`);
    console.log(`🚀 Server is running on 0.0.0.0:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}


