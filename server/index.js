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
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// // 404 handler
// app.use('/*', (req, res) => {
//     res.status(404).json({
//         success: false,
//         message: 'Route not found'
//     });
// });

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

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 YarnFlow Server is running on port ${PORT}`);
  console.log(`🚀 Server is running on 0.0.0.0:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});


