import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * ONE-TIME SCRIPT: Drop Email Indexes from Suppliers Collection
 * 
 * This script should be run ONLY ONCE to clean up old email indexes.
 * After running this script once, it's no longer needed.
 * 
 * To run: node src/scripts/dropEmailIndex.js
 */

const dropEmailIndex = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yarnflow');
    console.log('🔗 Connected to MongoDB');

    // Get the suppliers collection
    const db = mongoose.connection.db;
    const collection = db.collection('suppliers');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('📋 Current indexes:', indexes.map(idx => idx.name));

    // Check if email_1 index exists
    const emailIndexExists = indexes.some(index => index.name === 'email_1');

    if (emailIndexExists) {
      // Drop the email_1 index
      await collection.dropIndex('email_1');
      console.log('✅ Successfully dropped email_1 index');
    } else {
      console.log('ℹ️  email_1 index does not exist (already cleaned up)');
    }

    // Check for any other email indexes
    const emailIndexes = indexes.filter(index => 
      index.key && index.key.email !== undefined
    );

    if (emailIndexes.length > 0) {
      for (const emailIndex of emailIndexes) {
        await collection.dropIndex(emailIndex.name);
        console.log(`✅ Successfully dropped email index: ${emailIndex.name}`);
      }
    } else {
      console.log('ℹ️  No other email indexes found');
    }

    console.log('🎉 Email index cleanup completed successfully!');
    console.log('📝 Note: This script should only be run once. Email field has been completely removed from Supplier schema.');
    
  } catch (error) {
    if (error.code === 27) {
      console.log('ℹ️  Index not found (already dropped or doesn\'t exist)');
    } else {
      console.error('❌ Error dropping email index:', error);
    }
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
dropEmailIndex();
