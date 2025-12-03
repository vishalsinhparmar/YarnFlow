import mongoose from 'mongoose';

// Individual item received in GRN
const grnItemSchema = new mongoose.Schema({
  purchaseOrderItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder.items'
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true // Store for historical reference
  },
  
  // Quantities
  orderedQuantity: {
    type: Number,
    default: 0
  },
  orderedWeight: {
    type: Number,
    default: 0
  },
  previouslyReceived: {
    type: Number,
    default: 0
  },
  previousWeight: {
    type: Number,
    default: 0
  },
  receivedQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  receivedWeight: {
    type: Number,
    default: 0
  },
  pendingQuantity: {
    type: Number,
    default: 0
  },
  pendingWeight: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    default: 'Bags',
    trim: true
  },
  
  // Manual Completion (for partial qty acceptance)
  manuallyCompleted: {
    type: Boolean,
    default: false
  },
  completionReason: {
    type: String,
    trim: true
  }
});

// Main GRN Schema
const grnSchema = new mongoose.Schema({
  grnNumber: {
    type: String,
    unique: true,
    uppercase: true
  },
  
  // Reference to Purchase Order
  purchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    required: true
  },
  poNumber: {
    type: String,
    required: true // Store for easy reference
  },
  
  // Supplier Information (from PO)
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  supplierDetails: {
    companyName: String
  },
  
  // Receipt Information
  receiptDate: {
    type: Date,
    default: Date.now
  },
  
  // Items Received
  items: [grnItemSchema],
  
  // Status
  status: {
    type: String,
    enum: ['Draft', 'Received', 'Partial', 'Complete'],
    default: 'Draft'
  },
  receiptStatus: {
    type: String,
    enum: ['Partial', 'Complete'],
    default: 'Partial'
  },
  
  // Storage and Warehouse
  warehouseLocation: {
    type: String,
    trim: true
  },
  storageInstructions: {
    type: String,
    trim: true
  },
  
  // Notes
  generalNotes: {
    type: String,
    trim: true
  },
  
  // Audit Trail
  createdBy: {
    type: String,
    required: true,
    default: 'System'
  }
}, {
  timestamps: true
});

// Auto-generate GRN number before saving
grnSchema.pre('save', async function(next) {
  if (!this.grnNumber) {
    try {
      // Count total GRNs to get next number
      const count = await mongoose.model('GoodsReceiptNote').countDocuments({});
      
      // Generate GRN number: PKRK/GRN/01, PKRK/GRN/02, etc.
      this.grnNumber = `PKRK/GRN/${String(count + 1).padStart(2, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

// Indexes for better query performance
grnSchema.index({ grnNumber: 1 });
grnSchema.index({ purchaseOrder: 1 });
grnSchema.index({ supplier: 1 });
grnSchema.index({ status: 1 });
grnSchema.index({ receiptDate: -1 });
grnSchema.index({ createdAt: -1 });

// Virtual for checking if GRN is complete
grnSchema.virtual('isComplete').get(function() {
  return this.receiptStatus === 'Complete';
});

// Ensure virtuals are included in JSON output
grnSchema.set('toJSON', { virtuals: true });
grnSchema.set('toObject', { virtuals: true });

export default mongoose.model('GoodsReceiptNote', grnSchema);
