import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  customerCode: {
    type: String,
    unique: true,
    uppercase: true
  },
  // Required fields for simplified form
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
  notes: {
    type: String,
    trim: true
  },
  address: {
    city: {
      type: String,
      trim: true
    },
    // Keep other address fields for backward compatibility but make them optional
    street: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  // Keep these fields for backward compatibility but make them optional
  contactPerson: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    sparse: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  // Status field for future use
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// Auto-generate customer code and extract PAN from GST before saving
customerSchema.pre('save', async function(next) {
  // Auto-generate customer code
  if (!this.customerCode) {
    try {
      // Find the highest existing customer code number
      const lastCustomer = await mongoose.model('Customer')
        .findOne({}, { customerCode: 1 })
        .sort({ customerCode: -1 })
        .lean();
      
      let nextNumber = 1;
      if (lastCustomer && lastCustomer.customerCode) {
        // Extract number from code like "CUST0001" -> 1
        const match = lastCustomer.customerCode.match(/CUST(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      this.customerCode = `CUST${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  
  // Auto-extract PAN from GST if GST is provided and PAN is not
  if (this.gstNumber && this.gstNumber.length >= 10 && !this.panNumber) {
    this.panNumber = this.gstNumber.substring(2, 12).toUpperCase();
  }
  
  next();
});

export default mongoose.model('Customer', customerSchema);
