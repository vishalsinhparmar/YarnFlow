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
    enum: ['Bags', 'Rolls', 'Kg', 'Meters', 'Pieces'],
    required: true
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryDate: {
    type: Date,
    required: true
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
    required: true
  },
  items: [purchaseOrderItemSchema],
  
  // Financial Details
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 18, // GST rate in percentage
    min: 0,
    max: 100
  },
  taxAmount: {
    type: Number,
    required: false,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: false,
    min: 0
  },
  
  // Status and Workflow
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Acknowledged', 'Approved', 'Partially_Received', 'Fully_Received', 'Cancelled', 'Closed'],
    default: 'Draft'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
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
  
  // Delivery Information
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  },
  shippingMethod: {
    type: String,
    enum: ['Pickup', 'Courier', 'Transport', 'Own_Vehicle'],
    default: 'Transport'
  },
  
  // Payment Terms
  paymentTerms: {
    type: String,
    enum: ['Advance', 'Cash_on_Delivery', 'Credit_15', 'Credit_30', 'Credit_45', 'Credit_60'],
    default: 'Credit_30'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid'],
    default: 'Pending'
  },
  
  // Additional Information
  terms: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
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
      const currentYear = new Date().getFullYear();
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      
      // Count POs for current month
      const count = await mongoose.model('PurchaseOrder').countDocuments({
        createdAt: {
          $gte: new Date(currentYear, new Date().getMonth(), 1),
          $lt: new Date(currentYear, new Date().getMonth() + 1, 1)
        }
      });
      
      this.poNumber = `PO${currentYear}${currentMonth}${String(count + 1).padStart(4, '0')}`;
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

// Calculate totals before saving
purchaseOrderSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Calculate tax amount
  this.taxAmount = (this.subtotal * this.taxRate) / 100;
  
  // Calculate total amount
  this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;
  
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
  return this.expectedDeliveryDate < new Date() && !['Fully_Received', 'Cancelled', 'Closed'].includes(this.status);
});

// Virtual for completion percentage
purchaseOrderSchema.virtual('completionPercentage').get(function() {
  const totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
  const receivedQuantity = this.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
  return totalQuantity > 0 ? Math.round((receivedQuantity / totalQuantity) * 100) : 0;
});

// Ensure virtuals are included in JSON output
purchaseOrderSchema.set('toJSON', { virtuals: true });
purchaseOrderSchema.set('toObject', { virtuals: true });

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);
