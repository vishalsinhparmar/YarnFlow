import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  productCode: {
    type: String,
    unique: true,
    uppercase: true
  },
  // Required fields for simplified form
  productName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  // Status field for management
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Discontinued'],
    default: 'Active'
  },
  // Keep these fields for backward compatibility but make them optional
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  specifications: {
    yarnCount: {
      type: String,
      default: ''
    },
    color: {
      type: String,
      default: 'Natural'
    },
    quality: {
      type: String,
      enum: ['Premium', 'Standard', 'Economy'],
      default: 'Standard'
    },
    weight: {
      type: Number,
      default: 100
    },
    length: {
      type: Number,
      default: 0
    },
    composition: {
      type: String,
      default: ''
    }
  },
  inventory: {
    currentStock: {
      type: Number,
      default: 0
    },
    minimumStock: {
      type: Number,
      default: 10
    },
    maximumStock: {
      type: Number,
      default: 1000
    },
    reorderLevel: {
      type: Number,
      default: 50
    },
    unit: {
      type: String,
      enum: ['Bags', 'Rolls', 'Kg', 'Meters', 'Pieces'],
      default: 'Bags'
    }
  },
  tags: [String],
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Auto-generate product code before saving
productSchema.pre('save', async function(next) {
  if (!this.productCode) {
    try {
      // Find the highest existing product code number
      const lastProduct = await mongoose.model('Product')
        .findOne({}, { productCode: 1 })
        .sort({ productCode: -1 })
        .lean();
      
      let nextNumber = 1;
      if (lastProduct && lastProduct.productCode) {
        // Extract number from code like "PROD0001" -> 1
        const match = lastProduct.productCode.match(/PROD(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      this.productCode = `PROD${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.model('Product', productSchema); 
