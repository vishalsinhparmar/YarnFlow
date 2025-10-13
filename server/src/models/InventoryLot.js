import mongoose from 'mongoose';

// Individual lot/batch tracking schema
const inventoryLotSchema = new mongoose.Schema({
  lotNumber: {
    type: String,
    unique: true,
    uppercase: true
  },
  
  // Reference Information
  grn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoodsReceiptNote',
    required: true
  },
  grnNumber: {
    type: String,
    required: true
  },
  purchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder'
  },
  poNumber: {
    type: String
  },
  
  // Product Information
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productCode: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  
  // Supplier Information
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  supplierName: {
    type: String,
    required: true
  },
  supplierBatchNumber: {
    type: String,
    trim: true
  },
  
  // Product Specifications
  specifications: {
    yarnCount: String,
    color: String,
    quality: String,
    weight: Number,
    composition: String,
    grade: String
  },
  
  // Quantity Information
  receivedQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  currentQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  availableQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  unit: {
    type: String,
    enum: ['Bags', 'Rolls', 'Kg', 'Meters', 'Pieces'],
    default: 'Bags'
  },
  
  // Quality Information
  qualityStatus: {
    type: String,
    enum: ['Approved', 'Rejected', 'Under_Review', 'Quarantine'],
    default: 'Approved'
  },
  qualityGrade: {
    type: String,
    enum: ['A', 'B', 'C', 'Reject'],
    default: 'A'
  },
  qualityNotes: {
    type: String,
    trim: true
  },
  
  // Storage Information
  warehouse: {
    type: String,
    trim: true
  },
  location: {
    zone: String,
    rack: String,
    shelf: String,
    bin: String
  },
  storageConditions: {
    temperature: Number,
    humidity: Number,
    specialRequirements: String
  },
  
  // Date Information
  receivedDate: {
    type: Date,
    required: true
  },
  manufactureDate: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  
  // Cost Information
  unitCost: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCost: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Status and Lifecycle
  status: {
    type: String,
    enum: ['Active', 'Reserved', 'Consumed', 'Expired', 'Damaged', 'Returned'],
    default: 'Active'
  },
  
  // Movement History
  movements: [{
    type: {
      type: String,
      enum: ['Received', 'Reserved', 'Issued', 'Returned', 'Adjusted', 'Transferred', 'Damaged']
    },
    quantity: Number,
    date: {
      type: Date,
      default: Date.now
    },
    reference: String, // SO number, transfer note, etc.
    notes: String,
    performedBy: String
  }],
  
  // Alerts and Notifications
  alerts: [{
    type: {
      type: String,
      enum: ['Low_Stock', 'Expiry_Warning', 'Quality_Issue', 'Storage_Issue']
    },
    message: String,
    date: {
      type: Date,
      default: Date.now
    },
    acknowledged: {
      type: Boolean,
      default: false
    }
  }],
  
  // Additional Information
  notes: {
    type: String,
    trim: true
  },
  tags: [String], // For custom categorization
  
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

// Auto-generate lot number before saving
inventoryLotSchema.pre('save', async function(next) {
  if (!this.lotNumber) {
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      
      // Count lots for current month
      const count = await mongoose.model('InventoryLot').countDocuments({
        createdAt: {
          $gte: new Date(currentYear, new Date().getMonth(), 1),
          $lt: new Date(currentYear, new Date().getMonth() + 1, 1)
        }
      });
      
      this.lotNumber = `LOT${currentYear}${currentMonth}${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

// Calculate available quantity before saving
inventoryLotSchema.pre('save', function(next) {
  this.availableQuantity = Math.max(0, this.currentQuantity - this.reservedQuantity);
  
  // Calculate total cost
  this.totalCost = this.currentQuantity * this.unitCost;
  
  // Update status based on quantity
  if (this.currentQuantity <= 0) {
    this.status = 'Consumed';
  } else if (this.reservedQuantity >= this.currentQuantity) {
    this.status = 'Reserved';
  } else if (this.status === 'Reserved' && this.reservedQuantity < this.currentQuantity) {
    this.status = 'Active';
  }
  
  next();
});

// Check for expiry and generate alerts
inventoryLotSchema.pre('save', function(next) {
  if (this.expiryDate) {
    const today = new Date();
    const daysToExpiry = Math.ceil((this.expiryDate - today) / (1000 * 60 * 60 * 24));
    
    // Generate expiry warning if within 30 days
    if (daysToExpiry <= 30 && daysToExpiry > 0) {
      const existingAlert = this.alerts.find(alert => 
        alert.type === 'Expiry_Warning' && !alert.acknowledged
      );
      
      if (!existingAlert) {
        this.alerts.push({
          type: 'Expiry_Warning',
          message: `Item expires in ${daysToExpiry} days`,
          date: new Date()
        });
      }
    }
    
    // Mark as expired if past expiry date
    if (daysToExpiry <= 0 && this.status !== 'Expired') {
      this.status = 'Expired';
      this.alerts.push({
        type: 'Expiry_Warning',
        message: 'Item has expired',
        date: new Date()
      });
    }
  }
  
  next();
});

// Indexes for better query performance
inventoryLotSchema.index({ lotNumber: 1 });
inventoryLotSchema.index({ product: 1 });
inventoryLotSchema.index({ supplier: 1 });
inventoryLotSchema.index({ grn: 1 });
inventoryLotSchema.index({ status: 1 });
inventoryLotSchema.index({ qualityStatus: 1 });
inventoryLotSchema.index({ receivedDate: -1 });
inventoryLotSchema.index({ expiryDate: 1 });
inventoryLotSchema.index({ 'location.zone': 1 });

// Virtual for days until expiry
inventoryLotSchema.virtual('daysToExpiry').get(function() {
  if (!this.expiryDate) return null;
  const today = new Date();
  return Math.ceil((this.expiryDate - today) / (1000 * 60 * 60 * 24));
});

// Virtual for stock value
inventoryLotSchema.virtual('stockValue').get(function() {
  const currentQuantity = this.currentQuantity || 0;
  const unitCost = this.unitCost || 0;
  return currentQuantity * unitCost;
});

// Virtual for utilization percentage
inventoryLotSchema.virtual('utilizationPercentage').get(function() {
  const receivedQuantity = this.receivedQuantity || 0;
  const currentQuantity = this.currentQuantity || 0;
  
  if (receivedQuantity === 0) return 0;
  const consumed = receivedQuantity - currentQuantity;
  return Math.round((consumed / receivedQuantity) * 100);
});

// Static method to find lots by product
inventoryLotSchema.statics.findByProduct = function(productId, options = {}) {
  const query = { product: productId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.qualityStatus) {
    query.qualityStatus = options.qualityStatus;
  }
  
  return this.find(query)
    .populate('product', 'productName productCode')
    .populate('supplier', 'companyName supplierCode')
    .sort({ receivedDate: -1 });
};

// Static method to find expiring lots
inventoryLotSchema.statics.findExpiring = function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    expiryDate: { $lte: futureDate, $gte: new Date() },
    status: { $in: ['Active', 'Reserved'] },
    currentQuantity: { $gt: 0 }
  })
  .populate('product', 'productName productCode')
  .sort({ expiryDate: 1 });
};

// Static method to find low stock lots
inventoryLotSchema.statics.findLowStock = function(threshold = 10) {
  return this.find({
    currentQuantity: { $lte: threshold },
    status: 'Active'
  })
  .populate('product', 'productName productCode')
  .sort({ currentQuantity: 1 });
};

// Ensure virtuals are included in JSON output
inventoryLotSchema.set('toJSON', { virtuals: true });
inventoryLotSchema.set('toObject', { virtuals: true });

export default mongoose.model('InventoryLot', inventoryLotSchema);
