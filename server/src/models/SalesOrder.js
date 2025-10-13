import mongoose from 'mongoose';

const salesOrderSchema = new mongoose.Schema({
  // Order Identification
  soNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Customer Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerDetails: {
    companyName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    }
  },

  // Order Dates
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date,
    required: true
  },
  actualDeliveryDate: {
    type: Date
  },

  // Order Items
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: { type: String, required: true },
    productCode: { type: String, required: true },
    
    // Quantities
    orderedQuantity: { type: Number, required: true, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    shippedQuantity: { type: Number, default: 0, min: 0 },
    deliveredQuantity: { type: Number, default: 0, min: 0 },
    
    unit: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, default: 0, min: 0 },
    
    // Tax Information
    taxRate: { type: Number, default: 18 }, // GST percentage
    taxAmount: { type: Number, default: 0 },
    
    // Inventory Allocation
    inventoryAllocations: [{
      inventoryLot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryLot'
      },
      lotNumber: String,
      allocatedQuantity: { type: Number, min: 0 },
      reservedDate: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ['Reserved', 'Allocated', 'Shipped', 'Delivered'],
        default: 'Reserved'
      }
    }],
    
    // Item Status
    itemStatus: {
      type: String,
      enum: ['Pending', 'Reserved', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending'
    },
    
    notes: String
  }],

  // Financial Information
  subtotal: { type: Number, default: 0, min: 0 },
  taxAmount: { type: Number, default: 0, min: 0 },
  discountAmount: { type: Number, default: 0, min: 0 },
  discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
  shippingCharges: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, default: 0, min: 0 },

  // Order Status and Workflow
  status: {
    type: String,
    enum: ['Draft', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
    default: 'Draft',
    index: true
  },
  
  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Pending'
  },
  paymentTerms: {
    type: String,
    enum: ['Advance', 'COD', 'Net_15', 'Net_30', 'Net_45', 'Net_60'],
    default: 'Net_30'
  },
  
  // Shipping Information
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  shippingMethod: {
    type: String,
    enum: ['Standard', 'Express', 'Overnight', 'Pickup'],
    default: 'Standard'
  },
  trackingNumber: String,
  courierCompany: String,
  
  // Priority and Classification
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  orderType: {
    type: String,
    enum: ['Regular', 'Rush', 'Sample', 'Bulk', 'Export'],
    default: 'Regular'
  },

  // Workflow Tracking
  workflowHistory: [{
    status: String,
    changedBy: String,
    changedDate: { type: Date, default: Date.now },
    notes: String,
    systemGenerated: { type: Boolean, default: false }
  }],

  // Communication
  customerNotes: String,
  internalNotes: String,
  
  // References
  customerPONumber: String, // Customer's Purchase Order reference
  salesPerson: String,
  
  // Audit Information
  createdBy: { type: String, required: true },
  updatedBy: String,
  
  // Cancellation Information
  cancellationReason: String,
  cancelledBy: String,
  cancelledDate: Date,
  
  // Return Information
  returnReason: String,
  returnedBy: String,
  returnedDate: Date,
  returnedQuantity: Number

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
salesOrderSchema.index({ soNumber: 1 });
salesOrderSchema.index({ customer: 1 });
salesOrderSchema.index({ status: 1 });
salesOrderSchema.index({ orderDate: -1 });
salesOrderSchema.index({ expectedDeliveryDate: 1 });
salesOrderSchema.index({ 'customerDetails.companyName': 1 });

// Virtual for order completion percentage
salesOrderSchema.virtual('completionPercentage').get(function() {
  if (!this.items || this.items.length === 0) return 0;
  
  const totalItems = this.items.length;
  const completedItems = this.items.filter(item => 
    item.itemStatus === 'Delivered'
  ).length;
  
  return Math.round((completedItems / totalItems) * 100);
});

// Virtual for pending amount
salesOrderSchema.virtual('pendingAmount').get(function() {
  if (this.paymentStatus === 'Paid') return 0;
  return this.totalAmount;
});

// Virtual for days since order
salesOrderSchema.virtual('daysSinceOrder').get(function() {
  const now = new Date();
  const orderDate = new Date(this.orderDate);
  const diffTime = Math.abs(now - orderDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for days until delivery
salesOrderSchema.virtual('daysUntilDelivery').get(function() {
  if (this.status === 'Delivered') return 0;
  
  const now = new Date();
  const deliveryDate = new Date(this.expectedDeliveryDate);
  const diffTime = deliveryDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to calculate totals
salesOrderSchema.pre('save', function(next) {
  // Calculate item totals
  this.items.forEach(item => {
    item.totalPrice = item.orderedQuantity * item.unitPrice;
    item.taxAmount = (item.totalPrice * item.taxRate) / 100;
  });
  
  // Calculate order totals
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.taxAmount = this.items.reduce((sum, item) => sum + item.taxAmount, 0);
  
  // Apply discount
  const discountAmount = this.discountPercentage > 0 
    ? (this.subtotal * this.discountPercentage) / 100 
    : this.discountAmount;
  
  this.discountAmount = discountAmount;
  this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount + this.shippingCharges;
  
  next();
});

// Pre-save middleware to update workflow history
salesOrderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.workflowHistory.push({
      status: this.status,
      changedBy: this.updatedBy || 'System',
      changedDate: new Date(),
      systemGenerated: !this.updatedBy
    });
  }
  next();
});

// Static method to generate SO number
salesOrderSchema.statics.generateSONumber = async function() {
  const currentYear = new Date().getFullYear();
  const prefix = `SO${currentYear}`;
  
  // Find the last SO number for current year
  const lastOrder = await this.findOne({
    soNumber: { $regex: `^${prefix}` }
  }).sort({ soNumber: -1 });
  
  let nextNumber = 1;
  if (lastOrder) {
    const lastNumber = parseInt(lastOrder.soNumber.replace(prefix, ''));
    nextNumber = lastNumber + 1;
  }
  
  return `${prefix}${String(nextNumber).padStart(6, '0')}`;
};

// Static method to get order statistics
salesOrderSchema.statics.getOrderStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        avgOrderValue: { $avg: '$totalAmount' }
      }
    }
  ]);
  
  const statusStats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$totalAmount' }
      }
    }
  ]);
  
  const monthlyStats = await this.aggregate([
    {
      $match: {
        orderDate: {
          $gte: new Date(new Date().getFullYear(), 0, 1) // Current year
        }
      }
    },
    {
      $group: {
        _id: {
          month: { $month: '$orderDate' },
          year: { $year: '$orderDate' }
        },
        orders: { $sum: 1 },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  
  return {
    overview: stats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
    statusBreakdown: statusStats,
    monthlyTrends: monthlyStats
  };
};

// Pre-save middleware to calculate totals automatically
salesOrderSchema.pre('save', function(next) {
  // Calculate item totals if not provided
  this.items.forEach(item => {
    if (!item.totalPrice || item.totalPrice === 0) {
      const itemSubtotal = item.orderedQuantity * item.unitPrice;
      const itemTaxAmount = (itemSubtotal * (item.taxRate || 18)) / 100;
      item.totalPrice = itemSubtotal + itemTaxAmount;
      item.taxAmount = itemTaxAmount;
    }
  });

  // Calculate order totals if not provided
  if (!this.subtotal || this.subtotal === 0) {
    this.subtotal = this.items.reduce((sum, item) => {
      return sum + (item.orderedQuantity * item.unitPrice);
    }, 0);
  }

  if (!this.taxAmount || this.taxAmount === 0) {
    this.taxAmount = this.items.reduce((sum, item) => {
      return sum + (item.taxAmount || 0);
    }, 0);
  }

  if (!this.totalAmount || this.totalAmount === 0) {
    const calculatedDiscountAmount = this.discountPercentage > 0 
      ? (this.subtotal * this.discountPercentage) / 100 
      : this.discountAmount;
    
    this.totalAmount = this.subtotal + this.taxAmount - calculatedDiscountAmount + (this.shippingCharges || 0);
  }

  next();
});

const SalesOrder = mongoose.model('SalesOrder', salesOrderSchema);

export default SalesOrder;
