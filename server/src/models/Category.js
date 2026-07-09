import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  hasSubProducts: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('Category', categorySchema);
