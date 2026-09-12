import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import models
import SalesChallan from '../src/models/SalesChallan.js';
import Category from '../src/models/Category.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.developement') });

async function testCategoryFilter() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check categories
    console.log('Test 1: Check Categories in Database');
    const categories = await Category.find({});
    console.log(`Found ${categories.length} categories:`);
    categories.forEach(cat => {
      console.log(`  - ${cat._id}: ${cat.categoryName}`);
    });

    // Check sales challans
    console.log('\n\nTest 2: Check Sales Challans');
    const challans = await SalesChallan.find({});
    console.log(`Found ${challans.length} sales challans`);
    
    challans.forEach((challan, idx) => {
      console.log(`\nChallan ${idx + 1}: ${challan.challanNumber}`);
      challan.items.forEach((item, itemIdx) => {
        console.log(`  Item ${itemIdx + 1}:`);
        console.log(`    Product: ${item.productName}`);
        console.log(`    Category: ${item.category}`);
        console.log(`    Category Type: ${typeof item.category}`);
      });
    });

    // Test filter
    console.log('\n\nTest 3: Filter by Category ObjectId');
    const categoryId = '6a9659a510260ff1486878fc';
    console.log(`Filtering by category: ${categoryId}`);
    
    const filtered = await SalesChallan.find({
      'items.category': mongoose.Types.ObjectId.createFromHexString(categoryId)
    });
    console.log(`Found ${filtered.length} challans with this category`);

    // Test with aggregation
    console.log('\n\nTest 4: Aggregation Pipeline Filter');
    const pipeline = [
      { $unwind: '$items' },
      {
        $match: {
          'items.category': mongoose.Types.ObjectId.createFromHexString(categoryId)
        }
      },
      {
        $project: {
          challanNumber: 1,
          'items.productName': 1,
          'items.category': 1
        }
      }
    ];
    
    const aggResult = await SalesChallan.aggregate(pipeline);
    console.log(`Found ${aggResult.length} items with this category`);
    aggResult.forEach(item => {
      console.log(`  - ${item.challanNumber}: ${item.items.productName}`);
    });

    console.log('\n✅ Test complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

testCategoryFilter();
