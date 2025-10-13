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
  soReference: {
    type: String,
    required: true,
    index: true
  },
  
  // Customer Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerDetails: {
    companyName: String,
    contactPerson: String,
    phone: String,
    email: String
  },
  
  // Delivery Address
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
    landmark: String
  },
  
  // Items to be delivered
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
    dispatchQuantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    
    // Pricing (for reference)
    unitPrice: { type: Number, required: true, min: 0 },
    totalValue: { type: Number, required: true, min: 0 },
    
    // Inventory allocation
    inventoryAllocations: [{
      inventoryLot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryLot'
      },
      allocatedQuantity: { type: Number, required: true, min: 0 },
      lotNumber: String
    }],
    
    // Item status
    itemStatus: {
      type: String,
      enum: ['Prepared', 'Packed', 'Dispatched', 'Delivered'],
      default: 'Prepared'
    },
    
    notes: String
  }],
  
  // Transport Details
  transportDetails: {
    vehicleNumber: String,
    vehicleType: {
      type: String,
      enum: ['Truck', 'Tempo', 'Van', 'Car', 'Bike', 'Other'],
      default: 'Truck'
    },
    driverName: String,
    driverPhone: String,
    driverLicense: String,
    transporterName: String,
    transporterGST: String,
    freightCharges: { type: Number, default: 0, min: 0 }
  },
  
  // Delivery Information
  deliveryDetails: {
    expectedDeliveryDate: Date,
    actualDeliveryDate: Date,
    deliveryTime: String,
    receivedBy: String,
    receivedByDesignation: String,
    receivedByPhone: String,
    deliveryNotes: String,
    customerSignature: String, // File path or base64
    deliveryProof: String // File path for delivery proof
  },
  
  // Status and Workflow
  status: {
    type: String,
    enum: ['Prepared', 'Packed', 'Dispatched', 'In_Transit', 'Out_for_Delivery', 'Delivered', 'Returned', 'Cancelled'],
    default: 'Prepared',
    index: true
  },
  
  // Financial Information
  totalValue: { type: Number, required: true, min: 0 },
  taxAmount: { type: Number, default: 0, min: 0 },
  freightCharges: { type: Number, default: 0, min: 0 },
  
  // Tracking Information
  trackingNumber: String,
  awbNumber: String, // Air Way Bill Number
  courierPartner: String,
  
  // Workflow History
  statusHistory: [{
    status: {
      type: String,
      enum: ['Prepared', 'Packed', 'Dispatched', 'In_Transit', 'Out_for_Delivery', 'Delivered', 'Returned', 'Cancelled']
    },
    timestamp: { type: Date, default: Date.now },
    updatedBy: String,
    notes: String,
    location: String
  }],
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['Challan_Copy', 'Invoice', 'Packing_List', 'Transport_Receipt', 'Delivery_Proof', 'Other']
    },
    fileName: String,
    filePath: String,
    uploadedBy: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Notes and Comments
  preparationNotes: String,
  packingNotes: String,
  dispatchNotes: String,
  deliveryNotes: String,
  internalNotes: String,
  
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
    
    // In transit challans
    this.countDocuments({
      status: { $in: ['Dispatched', 'In_Transit', 'Out_for_Delivery'] }
    }),
    
    // Delivered this month
    this.countDocuments({
      status: 'Delivered',
      'deliveryDetails.actualDeliveryDate': {
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
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
  ]);
  
  const [totalChallans, statusBreakdown, thisMonth, inTransit, deliveredThisMonth, monthlyTrends] = stats;
  
  return {
    overview: {
      totalChallans,
      thisMonth,
      inTransit,
      deliveredThisMonth
    },
    statusBreakdown,
    monthlyTrends
  };
};

const SalesChallan = mongoose.model('SalesChallan', salesChallanSchema);

export default SalesChallan;
