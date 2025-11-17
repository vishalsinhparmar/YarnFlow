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
    companyName: { type: String, default: 'Unknown Company' },
    contactPerson: { type: String, default: 'Unknown Contact' },
    email: { type: String, default: 'no-email@example.com' },
    phone: { type: String, default: 'No Phone' },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    }
  },

  // Category (NEW - for inventory integration)
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },

  // Order Dates
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date,
    required: false
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
    
    // Quantities (simplified for inventory-based sales)
    quantity: { type: Number, required: true, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    shippedQuantity: { type: Number, default: 0, min: 0 },
    deliveredQuantity: { type: Number, default: 0, min: 0 },
    
    unit: { type: String, required: true },
    weight: { type: Number, default: 0 }, // Total weight from inventory
    dispatchedWeight: { type: Number, default: 0 }, // Weight dispatched via challans
    manuallyCompleted: { type: Boolean, default: false }, // Manually marked as complete
    
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
    
    // Item-specific notes
    notes: {
      type: String,
      default: '',
      trim: true
    }
  }],

  // Financial Information
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
  
  // Shipping Information
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  trackingNumber: String,
  courierCompany: String,
  

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
  
  // Calculate simple total amount
  this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice + item.taxAmount, 0);
  
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

// Method to update dispatch status based on challan data
// Note: This is called from controller after fetching challans to avoid circular dependency
salesOrderSchema.methods.updateDispatchStatus = function(challans) {
  if (!challans || challans.length === 0) {
    return;
  }
  
  // Calculate dispatched quantities per item
  const dispatchedMap = {};
  const manuallyCompletedMap = {};
  
  challans.forEach(challan => {
    if (!challan.items || !Array.isArray(challan.items)) {
      return;
    }
    
    challan.items.forEach(item => {
      const key = item.salesOrderItem.toString();
      
      if (!dispatchedMap[key]) {
        dispatchedMap[key] = 0;
      }
      dispatchedMap[key] += item.dispatchQuantity || 0;
      
      // Track if any challan marked this item as manually completed
      if (item.manuallyCompleted) {
        manuallyCompletedMap[key] = true;
      }
    });
  });
  
  // Update each SO item's dispatch status
  let allItemsCompleted = true;
  let anyItemDispatched = false;
  
  for (let i = 0; i < this.items.length; i++) {
    const item = this.items[i];
    const itemId = item._id.toString();
    const dispatched = dispatchedMap[itemId] || 0;
    const manuallyCompleted = manuallyCompletedMap[itemId] || false;
    
    // UPDATE: Save dispatched quantities to SO item (like GRN saves receivedQuantity to PO item)
    item.deliveredQuantity = dispatched;
    item.shippedQuantity = dispatched; // Keep both in sync
    item.manuallyCompleted = manuallyCompleted;
    
    // Calculate dispatched weight (proportional to quantity)
    if (item.weight && item.quantity > 0) {
      item.dispatchedWeight = (dispatched / item.quantity) * item.weight;
    }
    
    if (dispatched > 0) {
      anyItemDispatched = true;
    }
    
    if (manuallyCompleted) {
      // Item manually marked as complete
      console.log(`✅ Item ${item.productName || 'Unknown'} manually completed (${dispatched}/${item.quantity})`);
      // Consider it complete regardless of quantity
    } else if (dispatched < item.quantity) {
      // Not fully dispatched and not manually completed
      allItemsCompleted = false;
    }
  }
  
  // Update SO status based on dispatch progress
  if (allItemsCompleted && this.status !== 'Delivered') {
    this.status = 'Delivered';
    console.log(`📦 Sales Order ${this.soNumber} marked as Delivered`);
  } else if (anyItemDispatched && (this.status === 'Draft' || this.status === 'Pending')) {
    // If any items dispatched and status is Draft or Pending, move to Processing
    this.status = 'Processing';
    console.log(`📦 Sales Order ${this.soNumber} marked as Processing (${Object.keys(dispatchedMap).length} items dispatched)`);
  }
  
  this.markModified('status');
};

// Static method to generate SO number
salesOrderSchema.statics.generateSONumber = async function() {
  // Count total SOs to get next number
  const count = await this.countDocuments({});
  
  // Generate SO number: PKRK/SO/01, PKRK/SO/02, etc.
  return `PKRK/SO/${String(count + 1).padStart(2, '0')}`;
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


const SalesOrder = mongoose.model('SalesOrder', salesOrderSchema);

export default SalesOrder;
