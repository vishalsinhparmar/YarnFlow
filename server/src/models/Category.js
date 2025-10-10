import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  categoryCode: {
    type: String,
    unique: true,
    uppercase: true
  },
  categoryName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  categoryType: {
    type: String,
    enum: ['Cotton Yarn', 'Polyester', 'Blended Yarn', 'Raw Material', 'Finished Goods'],
    required: true
  },
  specifications: {
    unit: {
      type: String,
      enum: ['Bags', 'Rolls', 'Kg', 'Meters', 'Pieces'],
      required: true
    },
    standardWeight: {
      type: Number, // in kg
      required: true
    },
    yarnCount: [String], // e.g., ['20s', '30s', '40s']
    blendRatio: String, // e.g., '60/40', '50/50'
    color: [String],
    quality: [String]
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
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
      const count = await mongoose.model('Category').countDocuments();
      this.categoryCode = `CAT${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.model('Category', categorySchema);
