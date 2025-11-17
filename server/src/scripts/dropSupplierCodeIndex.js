import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.developement
dotenv.config({ path: path.join(__dirname, '../../.env.developement') });

const dropSupplierCodeIndex = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the Supplier collection
    const db = mongoose.connection.db;
    const collection = db.collection('suppliers');

    // Drop the supplierCode index if it exists
    try {
      await collection.dropIndex('supplierCode_1');
      console.log('✓ Successfully dropped supplierCode_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('✓ Index supplierCode_1 does not exist (already removed)');
      } else {
        throw error;
      }
    }

    // List all remaining indexes
    const indexes = await collection.indexes();
    console.log('\nRemaining indexes:');
    indexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)}`);
    });

    console.log('\n✓ Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

dropSupplierCodeIndex();
