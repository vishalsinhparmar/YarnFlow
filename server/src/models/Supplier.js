import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  supplierCode: {
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
  city: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  // Status field for management
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Blocked'],
    default: 'Active'
  },
  // Keep these fields for backward compatibility but make them optional
  contactPerson: {
    type: String,
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
  // Keep these fields for backward compatibility but make them optional
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String
  },
  supplierType: {
    type: String,
    enum: ['Cotton Yarn', 'Polyester', 'Blended Yarn', 'Raw Cotton', 'Chemicals', 'Other'],
    default: 'Cotton Yarn'
  },
  paymentTerms: {
    type: String,
    enum: ['Advance', 'COD', 'Credit-15', 'Credit-30', 'Credit-45'],
    default: 'Credit-30'
  },
  verificationStatus: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected'],
    default: 'Pending'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  }
}, {
  timestamps: true
});

// Add indexes for better performance
supplierSchema.index({ supplierCode: 1 }, { unique: true });
supplierSchema.index({ companyName: 1 });
supplierSchema.index({ gstNumber: 1 });
supplierSchema.index({ status: 1 });

// Auto-generate supplier code before saving
supplierSchema.pre('save', async function(next) {
  if (!this.supplierCode) {
    try {
      let attempts = 0;
      const maxAttempts = 20;
      
      while (attempts < maxAttempts) {
        // Get current timestamp to ensure uniqueness in concurrent scenarios
        const timestamp = Date.now();
        
        // Find all existing supplier codes to determine the next available number
        const existingSuppliers = await mongoose.model('Supplier')
          .find({}, { supplierCode: 1 })
          .sort({ supplierCode: 1 })
          .lean();
        
        // Extract all existing numbers
        const existingNumbers = existingSuppliers
          .map(supplier => {
            const match = supplier.supplierCode?.match(/SUPP(\d+)/);
            return match ? parseInt(match[1]) : 0;
          })
          .filter(num => num > 0)
          .sort((a, b) => a - b);
        
        // Find the first gap or next number
        let nextNumber = 1;
        for (let i = 0; i < existingNumbers.length; i++) {
          if (existingNumbers[i] !== nextNumber) {
            break;
          }
          nextNumber++;
        }
        
        const candidateCode = `SUPP${String(nextNumber).padStart(4, '0')}`;
        
        // Double-check this code doesn't exist (race condition protection)
        const existingSupplier = await mongoose.model('Supplier')
          .findOne({ supplierCode: candidateCode })
          .lean();
        
        if (!existingSupplier) {
          this.supplierCode = candidateCode;
          break;
        }
        
        attempts++;
        // Add randomized delay to reduce race conditions
        const delay = Math.floor(Math.random() * 50) + 10;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      if (attempts >= maxAttempts) {
        // Fallback: use timestamp-based code if all else fails
        const fallbackCode = `SUPP${String(Date.now()).slice(-4)}`;
        const fallbackExists = await mongoose.model('Supplier')
          .findOne({ supplierCode: fallbackCode })
          .lean();
        
        if (!fallbackExists) {
          this.supplierCode = fallbackCode;
        } else {
          throw new Error('Unable to generate unique supplier code. Please try again.');
        }
      }
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

export default mongoose.model('Supplier', supplierSchema);
