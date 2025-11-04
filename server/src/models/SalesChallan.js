import mongoose from 'mongoose';

const salesChallanSchema = new mongoose.Schema({
  // Basic Information
  challanNumber: {
    type: String,
    unique: true,
    index: true
  },
  challanDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Reference to Sales Order
  salesOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder',
    required: true,
    index: true
  },
  soNumber: {
    type: String,
    required: false,  // Made optional temporarily
    index: true
  },
  
  // Customer Information (cached from SO)
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false  // Made optional temporarily
  },
  customerName: String,
  
  // Warehouse Information (NEW - like GRN)
  warehouseLocation: {
    type: String,
    required: true
  },
  
  // Expected Delivery Date
  expectedDeliveryDate: Date,
  
  // Items to be dispatched
  items: [{
    salesOrderItem: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: { type: String, required: true },
    productCode: { type: String, required: true },
    
    // Quantities
    orderedQuantity: { type: Number, required: true, min: 0 },
    dispatchQuantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    weight: { type: Number, default: 0 },
    
    // Manual completion support (like GRN)
    manuallyCompleted: { type: Boolean, default: false },
    completionReason: { type: String },
    completedAt: { type: Date },
    
    // Item status
    itemStatus: {
      type: String,
      enum: ['Prepared', 'Packed', 'Dispatched', 'Delivered'],
      default: 'Prepared'
    }
  }],
  
  // Status and Workflow
  status: {
    type: String,
    enum: ['Prepared', 'Packed', 'Dispatched', 'In_Transit', 'Delivered', 'Cancelled'],
    default: 'Prepared',
    index: true
  },
  
  // Workflow History
  statusHistory: [{
    status: {
      type: String,
      enum: ['Prepared', 'Packed', 'Dispatched', 'In_Transit', 'Delivered', 'Cancelled']
    },
    timestamp: { type: Date, default: Date.now },
    updatedBy: String,
    notes: String
  }],
  
  // Notes
  notes: String,
  
  // System Fields
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedBy: String,
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

salesChallanSchema.index({ challanDate: -1 });
salesChallanSchema.index({ status: 1, challanDate: -1 });
salesChallanSchema.index({ customer: 1, challanDate: -1 });
salesChallanSchema.index({ 'deliveryDetails.expectedDeliveryDate': 1 });

// Pre-save middleware to generate challan number and handle status history
salesChallanSchema.pre('save', async function(next) {
  try {
    // Generate challan number for new documents
    if (this.isNew && !this.challanNumber) {
      // Generate challan number: CH202410001
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      
      // Find the last challan number for this month
      const lastChallan = await this.constructor.findOne({
        challanNumber: new RegExp(`^CH${year}${month}`)
      }).sort({ challanNumber: -1 });
      
      let nextNumber = 1;
      if (lastChallan) {
        const lastNumber = parseInt(lastChallan.challanNumber.slice(-4));
        nextNumber = lastNumber + 1;
      }
      
      this.challanNumber = `CH${year}${month}${String(nextNumber).padStart(4, '0')}`;
    }
    
    // Add status history for status changes
    if (this.isModified('status') && !this.isNew) {
      this.statusHistory.push({
        status: this.status,
        timestamp: new Date(),
        updatedBy: this.updatedBy || 'System',
        notes: `Status changed to ${this.status}`
      });
    }
    
    // Update timestamp
    this.updatedAt = new Date();
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to get statistics
salesChallanSchema.statics.getStats = async function() {
  try {
    const stats = await Promise.all([
      // Total challans
      this.countDocuments(),
      
      // Status breakdown
      this.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      // This month challans
      this.countDocuments({
        challanDate: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
        }
      }),
      
      // In transit challans (Dispatched, In_Transit, Out_for_Delivery)
      this.countDocuments({
        status: { $in: ['Dispatched', 'In_Transit', 'Out_for_Delivery'] }
      }),
      
      // Delivered this month
      this.countDocuments({
        status: 'Delivered',
        challanDate: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
        }
      }),
      
      // Monthly trends
      this.aggregate([
        {
          $group: {
            _id: {
              month: { $month: '$challanDate' },
              year: { $year: '$challanDate' }
            },
            challans: { $sum: 1 },
            totalValue: { $sum: '$totalValue' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 } // Last 12 months
      ])
    ]);
    
    const [totalChallans, statusBreakdown, thisMonth, inTransit, deliveredThisMonth, monthlyTrends] = stats;
    
    // Calculate Pending, Partial, Delivered stats based on item completion
    const allChallans = await this.find({});
    let pending = 0;
    let partial = 0;
    let completed = 0;
    
    allChallans.forEach(challan => {
      if (!challan.items || challan.items.length === 0) {
        pending++;
        return;
      }
      
      let allItemsComplete = true;
      let anyItemPartial = false;
      
      challan.items.forEach(item => {
        const dispatched = item.dispatchQuantity || 0;
        const ordered = item.orderedQuantity || 0;
        const manuallyCompleted = item.manuallyCompleted || false;
        
        if (manuallyCompleted || dispatched >= ordered) {
          // Item is complete
        } else if (dispatched > 0 && dispatched < ordered) {
          allItemsComplete = false;
          anyItemPartial = true;
        } else {
          allItemsComplete = false;
        }
      });
      
      if (allItemsComplete) {
        completed++;
      } else if (anyItemPartial) {
        partial++;
      } else {
        pending++;
      }
    });
    
    return {
      overview: {
        totalChallans: totalChallans || 0,
        thisMonth: thisMonth || 0,
        inTransit: inTransit || 0,
        deliveredThisMonth: deliveredThisMonth || 0
      },
      statusBreakdown: statusBreakdown || [],
      pending: pending,
      partial: partial,
      completed: completed,
      monthlyTrends: monthlyTrends || []
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    return {
      overview: {
        totalChallans: 0,
        thisMonth: 0,
        inTransit: 0,
        deliveredThisMonth: 0
      },
      statusBreakdown: [],
      pending: 0,
      completed: 0,
      monthlyTrends: []
    };
  }
};

// Virtual fields for frontend compatibility
salesChallanSchema.virtual('soReference').get(function() {
  return this.soNumber || (this.salesOrder?.soNumber) || 'N/A';
});

salesChallanSchema.virtual('customerDetails').get(function() {
  if (this.customer && typeof this.customer === 'object' && this.customer.companyName) {
    return {
      companyName: this.customer.companyName,
      contactPerson: this.customer.contactPerson,
      email: this.customer.email,
      phone: this.customer.phone
    };
  }
  return {
    companyName: this.customerName || 'Unknown',
    contactPerson: '',
    email: '',
    phone: ''
  };
});

// Ensure virtuals are included in JSON output
salesChallanSchema.set('toJSON', { virtuals: true });
salesChallanSchema.set('toObject', { virtuals: true });

const SalesChallan = mongoose.model('SalesChallan', salesChallanSchema);

export default SalesChallan;
