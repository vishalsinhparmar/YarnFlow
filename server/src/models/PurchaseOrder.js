import mongoose from 'mongoose';

const purchaseOrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true // Store name for historical reference
  },
  productCode: {
    type: String,
    required: true // Store code for historical reference
  },
  specifications: {
    yarnCount: String,
    color: String,
    quality: String,
    weight: Number,
    composition: String
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    default: 'Bags',
    trim: true
  },
  receivedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  pendingQuantity: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  }
});

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    unique: true,
    uppercase: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  supplierDetails: {
    companyName: {
      type: String,
      required: true
    },
    contactPerson: String,
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String
    }
  },
  orderDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  expectedDeliveryDate: {
    type: Date,
    default: function() {
      // Default to 7 days from now
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    }
  },
  items: [purchaseOrderItemSchema],
  
  // Status and Workflow
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Acknowledged', 'Approved', 'Partially_Received', 'Fully_Received', 'Cancelled', 'Closed'],
    default: 'Draft'
  },
  
  // Approval Workflow
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  approvedBy: {
    type: String, // User ID or name
    trim: true
  },
  approvedDate: Date,
  rejectionReason: {
    type: String,
    trim: true
  },
  
  // Payment Status
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid'],
    default: 'Pending'
  },
  
  // Internal Notes
  internalNotes: {
    type: String,
    trim: true
  },
  
  // Tracking
  sentDate: Date,
  acknowledgedDate: Date,
  
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
  lastModifiedBy: String,
  
  // Revision Control
  revisionNumber: {
    type: Number,
    default: 1
  },
  originalPO: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder'
  }
}, {
  timestamps: true
});

// Auto-generate PO number before saving
purchaseOrderSchema.pre('save', async function(next) {
  if (!this.poNumber) {
    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth(); // 0-11
      
      // Determine financial year (April to March)
      let financialYearStart, financialYearEnd;
      if (currentMonth >= 3) { // April (3) to December (11)
        financialYearStart = currentYear;
        financialYearEnd = currentYear + 1;
      } else { // January (0) to March (2)
        financialYearStart = currentYear - 1;
        financialYearEnd = currentYear;
      }
      
      const fyStart = String(financialYearStart).slice(-2); // Last 2 digits
      const fyEnd = String(financialYearEnd).slice(-2);
      
      // Get start and end dates for current financial year
      const fyStartDate = new Date(financialYearStart, 3, 1); // April 1st
      const fyEndDate = new Date(financialYearEnd, 3, 1); // April 1st next year
      
      // Count POs for current financial year
      const count = await mongoose.model('PurchaseOrder').countDocuments({
        createdAt: {
          $gte: fyStartDate,
          $lt: fyEndDate
        }
      });
      
      // Generate PO number: PKRK/PO/25-26/001
      this.poNumber = `PKRK/PO/${fyStart}-${fyEnd}/${String(count + 1).padStart(3, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  
  // Calculate pending quantities for items
  this.items.forEach(item => {
    item.pendingQuantity = item.quantity - item.receivedQuantity;
  });
  
  // Update status based on received quantities
  const totalItems = this.items.length;
  const fullyReceivedItems = this.items.filter(item => item.receivedQuantity >= item.quantity).length;
  const partiallyReceivedItems = this.items.filter(item => item.receivedQuantity > 0 && item.receivedQuantity < item.quantity).length;
  
  if (fullyReceivedItems === totalItems) {
    this.status = 'Fully_Received';
  } else if (partiallyReceivedItems > 0 || fullyReceivedItems > 0) {
    this.status = 'Partially_Received';
  }
  
  next();
});


// Indexes for better query performance
purchaseOrderSchema.index({ poNumber: 1 });
purchaseOrderSchema.index({ supplier: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ orderDate: -1 });
purchaseOrderSchema.index({ expectedDeliveryDate: 1 });
purchaseOrderSchema.index({ createdAt: -1 });

// Virtual for checking if PO is overdue
purchaseOrderSchema.virtual('isOverdue').get(function() {
  if (!this.expectedDeliveryDate || !this.status) {
    return false;
  }
  return this.expectedDeliveryDate < new Date() && !['Fully_Received', 'Cancelled', 'Closed'].includes(this.status);
});

// Virtual for completion percentage
purchaseOrderSchema.virtual('completionPercentage').get(function() {
  // Safety check for items array
  if (!this.items || !Array.isArray(this.items)) {
    return 0;
  }
  
  const totalQuantity = this.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const receivedQuantity = this.items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0);
  return totalQuantity > 0 ? Math.round((receivedQuantity / totalQuantity) * 100) : 0;
});

// Ensure virtuals are included in JSON output
purchaseOrderSchema.set('toJSON', { virtuals: true });
purchaseOrderSchema.set('toObject', { virtuals: true });

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);
