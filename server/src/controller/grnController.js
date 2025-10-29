import GoodsReceiptNote from '../models/GoodsReceiptNote.js';
import InventoryLot from '../models/InventoryLot.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';

// ============ GRN CONTROLLERS ============

// Get all GRNs with pagination and filters
export const getAllGRNs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      supplier, 
      status, 
      qualityStatus,
      dateFrom,
      dateTo,
      poNumber 
    } = req.query;
    
    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { grnNumber: { $regex: search, $options: 'i' } },
        { poNumber: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'supplierDetails.companyName': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by supplier
    if (supplier) {
      query.supplier = supplier;
    }
    
    // Filter by receipt status (Pending, Partial, Complete)
    if (status) {
      query.receiptStatus = status;
    }
    
    // Filter by quality status
    if (qualityStatus) {
      query.qualityCheckStatus = qualityStatus;
    }
    
    // Filter by PO number
    if (poNumber) {
      query.poNumber = { $regex: poNumber, $options: 'i' };
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.receiptDate = {};
      if (dateFrom) query.receiptDate.$gte = new Date(dateFrom);
      if (dateTo) query.receiptDate.$lte = new Date(dateTo);
    }
    
    const grns = await GoodsReceiptNote.find(query)
      .populate('supplier', 'companyName supplierCode contactPerson phone')
      .populate('purchaseOrder', 'poNumber orderDate expectedDeliveryDate')
      .populate('items.product', 'productName productCode specifications')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await GoodsReceiptNote.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: grns,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching GRNs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GRNs',
      error: error.message
    });
  }
};

// Get GRN by ID
export const getGRNById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const grn = await GoodsReceiptNote.findById(id)
      .populate('supplier', 'companyName supplierCode contactPerson phone address')
      .populate('purchaseOrder', 'poNumber orderDate expectedDeliveryDate items')
      .populate('items.product', 'productName productCode specifications inventory');
    
    if (!grn) {
      return res.status(404).json({
        success: false,
        message: 'GRN not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: grn
    });
  } catch (error) {
    console.error('Error fetching GRN:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GRN',
      error: error.message
    });
  }
};

// Create new GRN from Purchase Order
export const createGRN = async (req, res) => {
  try {
    console.log('Creating GRN with data:', req.body);
    
    const {
      purchaseOrder: poId,
      receiptDate = new Date(),
      deliveryDate,
      invoiceNumber,
      invoiceDate,
      invoiceAmount,
      vehicleNumber,
      driverName,
      driverPhone,
      transportCompany,
      items,
      receivedBy,
      warehouseLocation,
      generalNotes,
      createdBy = 'System'
    } = req.body;
    
    // Validate and fetch Purchase Order
    const purchaseOrder = await PurchaseOrder.findById(poId)
      .populate('supplier')
      .populate('items.product');
    
    if (!purchaseOrder) {
      return res.status(400).json({
        success: false,
        message: 'Purchase Order not found'
      });
    }
    
    // Validate items against PO
    const validatedItems = [];
    for (const item of items) {
      const poItem = purchaseOrder.items.find(pi => pi._id.toString() === item.purchaseOrderItem);
      if (!poItem) {
        return res.status(400).json({
          success: false,
          message: `Invalid PO item reference: ${item.purchaseOrderItem}`
        });
      }
      
      const product = await Product.findById(poItem.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${poItem.product}`
        });
      }
      
      // Get ordered weight from PO item specifications
      const orderedWeight = poItem.specifications?.weight || 0;
      
      // Calculate previously received (from PO's receivedQuantity, excluding this GRN)
      const previouslyReceived = poItem.receivedQuantity || 0;
      
      // Calculate previous weight
      let previousWeight = poItem.receivedWeight || 0;
      if (previousWeight === 0 && previouslyReceived > 0 && poItem.quantity > 0 && orderedWeight > 0) {
        const weightPerUnit = orderedWeight / poItem.quantity;
        previousWeight = previouslyReceived * weightPerUnit;
      }
      
      // Calculate received weight for this GRN
      let receivedWeight = item.receivedWeight || 0;
      if (receivedWeight === 0 && item.receivedQuantity > 0 && poItem.quantity > 0 && orderedWeight > 0) {
        const weightPerUnit = orderedWeight / poItem.quantity;
        receivedWeight = item.receivedQuantity * weightPerUnit;
      }
      
      // Calculate pending
      const pendingQuantity = Math.max(0, poItem.quantity - (previouslyReceived + item.receivedQuantity));
      const pendingWeight = Math.max(0, orderedWeight - (previousWeight + receivedWeight));
      
      validatedItems.push({
        purchaseOrderItem: item.purchaseOrderItem,
        product: product._id,
        productName: product.productName,
        productCode: product.productCode,
        specifications: product.specifications || {},
        orderedQuantity: poItem.quantity,
        orderedWeight: orderedWeight,
        previouslyReceived: previouslyReceived,
        previousWeight: previousWeight,
        receivedQuantity: item.receivedQuantity,
        receivedWeight: receivedWeight,
        pendingQuantity: pendingQuantity,
        pendingWeight: pendingWeight,
        acceptedQuantity: item.acceptedQuantity || item.receivedQuantity,
        rejectedQuantity: item.rejectedQuantity || 0,
        unit: poItem.unit || product.inventory?.unit || 'Bags',
        unitPrice: poItem.unitPrice,
        qualityStatus: item.qualityStatus || 'Pending',
        qualityNotes: item.qualityNotes || '',
        warehouseLocation: item.warehouseLocation || warehouseLocation,
        batchNumber: item.batchNumber || '',
        damageQuantity: item.damageQuantity || 0,
        damageNotes: item.damageNotes || '',
        notes: item.notes || ''
      });
    }
    
    // Calculate receipt status
    const allItemsComplete = validatedItems.every(item => item.pendingQuantity === 0);
    const anyItemReceived = validatedItems.some(item => item.receivedQuantity > 0);
    
    let receiptStatus = 'Pending';
    if (allItemsComplete && anyItemReceived) {
      receiptStatus = 'Complete';
    } else if (anyItemReceived) {
      receiptStatus = 'Partial';
    }
    
    const isPartialReceipt = validatedItems.some(item => item.previouslyReceived > 0 || item.pendingQuantity > 0);
    
    // Create GRN
    const grn = new GoodsReceiptNote({
      purchaseOrder: poId,
      poNumber: purchaseOrder.poNumber,
      supplier: purchaseOrder.supplier._id,
      supplierDetails: {
        companyName: purchaseOrder.supplier.companyName,
        contactPerson: purchaseOrder.supplier.contactPerson,
        phone: purchaseOrder.supplier.phone
      },
      receiptDate,
      deliveryDate,
      invoiceNumber,
      invoiceDate,
      invoiceAmount,
      vehicleNumber,
      driverName,
      driverPhone,
      transportCompany,
      items: validatedItems,
      receivedBy,
      warehouseLocation,
      generalNotes,
      createdBy,
      receiptStatus,
      isPartialReceipt
    });
    
    await grn.save();
    
    // Update PO with received quantities and weights
    for (const grnItem of grn.items) {
      const poItem = purchaseOrder.items.find(pi => pi._id.toString() === grnItem.purchaseOrderItem.toString());
      if (poItem) {
        poItem.receivedQuantity = (poItem.receivedQuantity || 0) + grnItem.receivedQuantity;
        poItem.receivedWeight = (poItem.receivedWeight || 0) + grnItem.receivedWeight;
        
        // Calculate pending
        const orderedWeight = poItem.specifications?.weight || 0;
        poItem.pendingWeight = Math.max(0, orderedWeight - poItem.receivedWeight);
      }
    }
    
    // Update PO receipt status
    await purchaseOrder.updateReceiptStatus();
    await purchaseOrder.save();
    
    // Populate the saved GRN for response
    const populatedGRN = await GoodsReceiptNote.findById(grn._id)
      .populate('supplier', 'companyName supplierCode contactPerson phone')
      .populate('purchaseOrder', 'poNumber orderDate expectedDeliveryDate')
      .populate('items.product', 'productName productCode specifications');
    
    res.status(201).json({
      success: true,
      message: 'GRN created successfully',
      data: populatedGRN
    });
  } catch (error) {
    console.error('Error creating GRN:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create GRN',
      error: error.message
    });
  }
};

// Update GRN
export const updateGRN = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const grn = await GoodsReceiptNote.findById(id);
    if (!grn) {
      return res.status(404).json({
        success: false,
        message: 'GRN not found'
      });
    }
    
    // Don't allow updating certain fields after approval
    if (grn.status === 'Completed') {
      const allowedFields = ['generalNotes', 'internalNotes'];
      const updateKeys = Object.keys(updateData);
      const hasRestrictedFields = updateKeys.some(key => !allowedFields.includes(key));
      
      if (hasRestrictedFields) {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify completed GRN. Only notes can be updated.'
        });
      }
    }
    
    const updatedGRN = await GoodsReceiptNote.findByIdAndUpdate(
      id,
      { ...updateData, lastModifiedBy: updateData.lastModifiedBy || 'System' },
      { new: true, runValidators: true }
    )
    .populate('supplier', 'companyName supplierCode contactPerson phone')
    .populate('purchaseOrder', 'poNumber orderDate expectedDeliveryDate')
    .populate('items.product', 'productName productCode specifications');
    
    res.status(200).json({
      success: true,
      message: 'GRN updated successfully',
      data: updatedGRN
    });
  } catch (error) {
    console.error('Error updating GRN:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update GRN',
      error: error.message
    });
  }
};

// Delete GRN
export const deleteGRN = async (req, res) => {
  try {
    const { id } = req.params;
    
    const grn = await GoodsReceiptNote.findById(id);
    if (!grn) {
      return res.status(404).json({
        success: false,
        message: 'GRN not found'
      });
    }
    
    // Only allow deletion of Draft GRNs
    if (grn.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft GRNs can be deleted'
      });
    }
    
    await GoodsReceiptNote.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'GRN deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting GRN:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete GRN',
      error: error.message
    });
  }
};

// Update GRN status
export const updateGRNStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const validStatuses = ['Draft', 'Received', 'Under_Review', 'Approved', 'Rejected', 'Completed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const updateData = { status };
    if (notes) updateData.generalNotes = notes;
    
    const updatedGRN = await GoodsReceiptNote.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('supplier', 'companyName supplierCode contactPerson phone');
    
    if (!updatedGRN) {
      return res.status(404).json({
        success: false,
        message: 'GRN not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `GRN status updated to ${status}`,
      data: updatedGRN
    });
  } catch (error) {
    console.error('Error updating GRN status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update GRN status',
      error: error.message
    });
  }
};

// Approve GRN and create inventory lots
export const approveGRN = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy, notes } = req.body;
    
    const grn = await GoodsReceiptNote.findById(id)
      .populate('supplier')
      .populate('items.product');
    
    if (!grn) {
      return res.status(404).json({
        success: false,
        message: 'GRN not found'
      });
    }
    
    // Update GRN approval status
    grn.approvalStatus = 'Approved';
    grn.approvedBy = approvedBy;
    grn.approvedDate = new Date();
    grn.status = 'Completed';
    if (notes) grn.generalNotes = notes;
    
    await grn.save();
    
    // Create inventory lots for approved items
    const inventoryLots = [];
    for (const item of grn.items) {
      if (item.qualityStatus === 'Approved' && item.acceptedQuantity > 0) {
        const lot = new InventoryLot({
          grn: grn._id,
          grnNumber: grn.grnNumber,
          purchaseOrder: grn.purchaseOrder,
          poNumber: grn.poNumber,
          product: item.product._id,
          productName: item.productName,
          productCode: item.productCode,
          supplier: grn.supplier._id,
          supplierName: grn.supplierDetails.companyName,
          supplierBatchNumber: item.batchNumber,
          specifications: item.specifications,
          receivedQuantity: item.acceptedQuantity,
          currentQuantity: item.acceptedQuantity,
          unit: item.unit,
          qualityStatus: 'Approved',
          qualityNotes: item.qualityNotes,
          warehouse: item.warehouseLocation,
          receivedDate: grn.receiptDate,
          expiryDate: item.expiryDate,
          unitCost: item.unitPrice,
          notes: item.notes,
          createdBy: approvedBy || 'System'
        });
        
        // Add initial movement record
        lot.movements.push({
          type: 'Received',
          quantity: item.acceptedQuantity,
          date: grn.receiptDate,
          reference: grn.grnNumber,
          notes: `Received via GRN ${grn.grnNumber}`,
          performedBy: approvedBy || 'System'
        });
        
        await lot.save();
        inventoryLots.push(lot);
        
        // Update product inventory
        await Product.findByIdAndUpdate(
          item.product._id,
          { $inc: { 'inventory.currentStock': item.acceptedQuantity } }
        );
      }
    }
    
    const populatedGRN = await GoodsReceiptNote.findById(grn._id)
      .populate('supplier', 'companyName supplierCode contactPerson phone')
      .populate('purchaseOrder', 'poNumber orderDate expectedDeliveryDate')
      .populate('items.product', 'productName productCode specifications');
    
    res.status(200).json({
      success: true,
      message: 'GRN approved and inventory lots created successfully',
      data: {
        grn: populatedGRN,
        inventoryLots: inventoryLots.length
      }
    });
  } catch (error) {
    console.error('Error approving GRN:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve GRN',
      error: error.message
    });
  }
};

// Get GRN statistics
export const getGRNStats = async (req, res) => {
  try {
    const stats = await Promise.all([
      // Total GRNs
      GoodsReceiptNote.countDocuments(),
      
      // GRNs by receipt status (Pending, Partial, Complete)
      GoodsReceiptNote.aggregate([
        { $group: { _id: '$receiptStatus', count: { $sum: 1 } } }
      ]),
      
      // Pending GRNs (receiptStatus = Pending)
      GoodsReceiptNote.countDocuments({
        receiptStatus: 'Pending'
      }),
      
      // Completed GRNs (receiptStatus = Complete)
      GoodsReceiptNote.countDocuments({
        receiptStatus: 'Complete'
      }),
      
      // This month's GRNs
      GoodsReceiptNote.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }),
      
      // Total received value (current month)
      GoodsReceiptNote.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        },
        {
          $group: {
            _id: null,
            totalValue: { $sum: '$totalReceivedValue' }
          }
        }
      ])
    ]);
    
    const [totalGRNs, statusCounts, pendingCount, completedCount, thisMonth, monthlyValue] = stats;
    
    res.status(200).json({
      success: true,
      data: {
        totalGRNs,
        statusBreakdown: statusCounts,
        pending: pendingCount,
        completed: completedCount,
        thisMonth,
        monthlyValue: monthlyValue[0]?.totalValue || 0
      }
    });
  } catch (error) {
    console.error('Error fetching GRN stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GRN statistics',
      error: error.message
    });
  }
};

// Get GRNs by Purchase Order
export const getGRNsByPO = async (req, res) => {
  try {
    const { poId } = req.params;
    
    const grns = await GoodsReceiptNote.find({ purchaseOrder: poId })
      .populate('supplier', 'companyName supplierCode')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: grns
    });
  } catch (error) {
    console.error('Error fetching GRNs by PO:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GRNs for Purchase Order',
      error: error.message
    });
  }
};
