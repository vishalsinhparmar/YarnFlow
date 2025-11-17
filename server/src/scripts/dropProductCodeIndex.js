import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.developement
dotenv.config({ path: path.join(__dirname, '../../.env.developement') });

const dropProductCodeIndex = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the Product collection
    const db = mongoose.connection.db;
    const collection = db.collection('products');

    // Drop the productCode index if it exists
    try {
      await collection.dropIndex('productCode_1');
      console.log('✓ Successfully dropped productCode_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('✓ Index productCode_1 does not exist (already removed)');
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

dropProductCodeIndex();
