import mongoose from 'mongoose';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/yarnflow', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const clearProducts = async () => {
  try {
    // Clear all products to remove old structure
    const result = await mongoose.connection.db.collection('products').deleteMany({});
    console.log(`Cleared ${result.deletedCount} products with old structure`);
    
    console.log('✅ Products cleared successfully. You can now create new products with the updated structure.');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing products:', error);
    process.exit(1);
  }
};

clearProducts();
