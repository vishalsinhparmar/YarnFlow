import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  productCode: {
    type: String,
    unique: true,
    uppercase: true
  },
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
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
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
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Discontinued'],
    default: 'Active'
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
      const count = await mongoose.model('Product').countDocuments();
      this.productCode = `PROD${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.model('Product', productSchema); 
