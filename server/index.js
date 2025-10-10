import express from 'express';
import cors from 'cors';
import connectDB from './db.js';
import authRoutes from './src/routes/authRoutes.js';
import masterDataRoutes from './src/routes/masterDataRoutes.js';
import purchaseOrderRoutes from './src/routes/purchaseOrderRoutes.js';
import logger from './src/utils/logger.js';
// import dotenv from 'dotenv';

// dotenv.config({path:})
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/auth', authRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);

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

const PORT = 3020 || process.env.PORT
app.listen(PORT , ()=>{
    console.log(`server is running on http://localhost:${PORT}`)
});


