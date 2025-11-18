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
  acceptedQuantity: {
    type: Number,
    default: 0
  },
  rejectedQuantity: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    enum: ['Bags', 'Rolls', 'Kg', 'Meters', 'Pieces'],
    default: 'Bags'
  },
  
  // Quality Control
  qualityStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Partial'],
    default: 'Pending'
  },
  qualityNotes: {
    type: String,
    trim: true
  },
  
  // Storage Information
  warehouseLocation: {
    type: String,
    trim: true
  },
  batchNumber: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date
  },
  
  // Pricing (from PO)
  unitPrice: {
    type: Number,
    default: 0
  },
  totalValue: {
    type: Number,
    default: 0
  },
  
  // Manual Completion (for partial qty acceptance)
  manuallyCompleted: {
    type: Boolean,
    default: false
  },
  completionReason: {
    type: String,
    trim: true
  },
  completedAt: {
    type: Date
  },
  
  // Damage/Issues
  damageQuantity: {
    type: Number,
    default: 0
  },
  damageNotes: {
    type: String,
    trim: true
  },
  
  notes: {
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
    companyName: String,
    contactPerson: String,
    email: String,
    phone: String
  },
  
  // Receipt Information
  receiptDate: {
    type: Date,
    default: Date.now
  },
  
  // Items Received
  items: [grnItemSchema],
  
  // Status and Workflow
  status: {
    type: String,
    enum: ['Draft', 'Received', 'Under_Review', 'Approved', 'Rejected', 'Completed'],
    default: 'Draft'
  },
  
  // Receipt Status
  receiptStatus: {
    type: String,
    enum: ['Partial', 'Complete'],
    default: 'Partial'
  },
  isPartialReceipt: {
    type: Boolean,
    default: false
  },
  
  // Quality Control
  qualityCheckStatus: {
    type: String,
    enum: ['Pending', 'In_Progress', 'Completed', 'Failed'],
    default: 'Pending'
  },
  qualityCheckBy: {
    type: String,
    trim: true
  },
  qualityCheckDate: {
    type: Date
  },
  qualityRemarks: {
    type: String,
    trim: true
  },
  
  // Financial Summary
  totalReceivedValue: {
    type: Number,
    default: 0
  },
  totalAcceptedValue: {
    type: Number,
    default: 0
  },
  totalRejectedValue: {
    type: Number,
    default: 0
  },
  
  // Approval Workflow
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  approvedBy: {
    type: String,
    trim: true
  },
  approvedDate: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  
  // Additional Information
  checkedBy: {
    type: String,
    trim: true
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
  
  // Notes and Remarks
  generalNotes: {
    type: String,
    trim: true
  },
  internalNotes: {
    type: String,
    trim: true
  },
  
  // File Attachments
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Audit Trail
  createdBy: {
    type: String,
    required: true,
    default: 'System'
  },
  lastModifiedBy: {
    type: String
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

// Calculate financial totals before saving
grnSchema.pre('save', function(next) {
  // Calculate item-level totals
  this.items.forEach(item => {
    // Set accepted quantity to received if not specified
    if (item.acceptedQuantity === 0 && item.receivedQuantity > 0) {
      item.acceptedQuantity = item.receivedQuantity - (item.rejectedQuantity || 0) - (item.damageQuantity || 0);
    }
    
    // Calculate total value for item
    item.totalValue = (item.receivedQuantity || 0) * (item.unitPrice || 0);
  });
  
  // Calculate GRN totals
  this.totalReceivedValue = this.items.reduce((sum, item) => sum + (item.totalValue || 0), 0);
  this.totalAcceptedValue = this.items.reduce((sum, item) => sum + ((item.acceptedQuantity || 0) * (item.unitPrice || 0)), 0);
  this.totalRejectedValue = this.items.reduce((sum, item) => sum + ((item.rejectedQuantity || 0) * (item.unitPrice || 0)), 0);
  
  next();
});

// Update status based on quality check
grnSchema.pre('save', function(next) {
  const totalItems = this.items.length;
  const approvedItems = this.items.filter(item => item.qualityStatus === 'Approved').length;
  const rejectedItems = this.items.filter(item => item.qualityStatus === 'Rejected').length;
  
  if (approvedItems === totalItems) {
    this.qualityCheckStatus = 'Completed';
  } else if (rejectedItems === totalItems) {
    this.qualityCheckStatus = 'Failed';
  } else if (approvedItems > 0 || rejectedItems > 0) {
    this.qualityCheckStatus = 'In_Progress';
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
  if (!this.status || !this.qualityCheckStatus) {
    return false;
  }
  return this.status === 'Completed' && this.qualityCheckStatus === 'Completed';
});

// Virtual for completion percentage
grnSchema.virtual('completionPercentage').get(function() {
  // Safety check for items array
  if (!this.items || !Array.isArray(this.items)) {
    return 0;
  }
  
  const totalItems = this.items.length;
  const completedItems = this.items.filter(item => 
    item.qualityStatus === 'Approved' || item.qualityStatus === 'Rejected'
  ).length;
  return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
});

// Ensure virtuals are included in JSON output
grnSchema.set('toJSON', { virtuals: true });
grnSchema.set('toObject', { virtuals: true });

export default mongoose.model('GoodsReceiptNote', grnSchema);
