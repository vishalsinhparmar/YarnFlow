import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  categoryCode: {
    type: String,
    unique: true,
    uppercase: true
  },
  // Required fields for simplified form
  categoryName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Status field for management
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  // Keep these fields for backward compatibility but make them optional
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  categoryType: {
    type: String,
    enum: ['Cotton Yarn', 'Polyester', 'Blended Yarn', 'Raw Material', 'Finished Goods'],
    default: 'Cotton Yarn'
  },
  specifications: {
    unit: {
      type: String,
      enum: ['Bags', 'Rolls', 'Kg', 'Meters', 'Pieces'],
      default: 'Bags'
    },
    standardWeight: {
      type: Number,
      default: 100
    },
    yarnCount: [String],
    blendRatio: String,
    color: [String],
    quality: [String]
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Auto-generate category code before saving
categorySchema.pre('save', async function(next) {
  if (!this.categoryCode) {
    try {
      // Find the highest existing category code number
      const lastCategory = await mongoose.model('Category')
        .findOne({}, { categoryCode: 1 })
        .sort({ categoryCode: -1 })
        .lean();
      
      let nextNumber = 1;
      if (lastCategory && lastCategory.categoryCode) {
        // Extract number from code like "CAT0001" -> 1
        const match = lastCategory.categoryCode.match(/CAT(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      this.categoryCode = `CAT${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.model('Category', categorySchema);
