import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  customerCode: {
    type: String,
    unique: true,
    uppercase: true
  },
  companyName: {
    type: String,
    trim: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: {
      type: String
    },
    city: {
      type: String
    },
    state: {
      type: String
    },
    pincode: {
      type: String
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  gstNumber: {
    type: String,
    trim: true
  },
  panNumber: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Auto-generate customer code before saving
customerSchema.pre('save', async function(next) {
  if (!this.customerCode) {
    try {
      const count = await mongoose.model('Customer').countDocuments();
      this.customerCode = `CUST${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.model('Customer', customerSchema);
