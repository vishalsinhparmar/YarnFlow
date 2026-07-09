import mongoose from "mongoose";
import logger from "./src/utils/logger.js";

const connectDB = async () => {
    try {
        // Use environment variable for database URI, fallback to local MongoDB
        const dbURI = process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb://localhost:27017/";
        
        await mongoose.connect(dbURI);
        
        logger.info(`✅ Database connected successfully to: ${mongoose.connection.host}`);
        console.log(`✅ Database connected successfully to: ${mongoose.connection.host}`);
        
    } catch (err) {
        logger.error('❌ Database connection error:', err.message);
        console.error('❌ Database connection error:', err.message);
        
        // Exit process with failure
        process.exit(1);
    }
};

// Handle database connection events
mongoose.connection.on('disconnected', () => {
    logger.warn('⚠️ Database disconnected');
    console.log('⚠️ Database disconnected');
});

mongoose.connection.on('reconnected', () => {
    logger.info('🔄 Database reconnected');
    console.log('🔄 Database reconnected');
});

export default connectDB;