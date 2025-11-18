import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  address: {
    city: {
      type: String,
      trim: true
    }
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// Auto-extract PAN from GST if GST is provided and PAN is not
customerSchema.pre('save', function(next) {
  if (this.gstNumber && this.gstNumber.length >= 10 && !this.panNumber) {
    this.panNumber = this.gstNumber.substring(2, 12).toUpperCase();
  }
  next();
});

export default mongoose.model('Customer', customerSchema);
