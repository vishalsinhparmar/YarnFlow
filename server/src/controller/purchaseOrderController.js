import PurchaseOrder from '../models/PurchaseOrder.js';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';

// ============ PURCHASE ORDER CONTROLLERS ============

// Get all purchase orders with pagination and filters
export const getAllPurchaseOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      supplier, 
      status, 
      priority,
      dateFrom,
      dateTo,
      overdue 
    } = req.query;
    
    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { poNumber: { $regex: search, $options: 'i' } },
        { 'supplierDetails.companyName': { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by supplier
    if (supplier) {
      query.supplier = supplier;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by priority
    if (priority) {
      query.priority = priority;
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.orderDate = {};
      if (dateFrom) query.orderDate.$gte = new Date(dateFrom);
      if (dateTo) query.orderDate.$lte = new Date(dateTo);
    }
    
    // Overdue filter
    if (overdue === 'true') {
      query.expectedDeliveryDate = { $lt: new Date() };
      query.status = { $nin: ['Fully_Received', 'Cancelled', 'Closed'] };
    }
    
    const purchaseOrders = await PurchaseOrder.find(query)
      .populate('supplier', 'companyName supplierCode contactPerson email phone')
      .populate('items.product', 'productName productCode specifications')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await PurchaseOrder.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: purchaseOrders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase orders',
      error: error.message
    });
  }
};

// Get purchase order by ID
export const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const purchaseOrder = await PurchaseOrder.findById(id)
      .populate('supplier', 'companyName supplierCode contactPerson email phone address')
      .populate('items.product', 'productName productCode specifications inventory');
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase order',
      error: error.message
    });
  }
};

// Create new purchase order
export const createPurchaseOrder = async (req, res) => {
  try {
    console.log('Creating PO with data:', req.body);
    
    const {
      supplier: supplierId,
      expectedDeliveryDate,
      items,
      taxRate = 18,
      discountAmount = 0,
      deliveryAddress,
      shippingMethod,
      paymentTerms,
      terms,
      notes,
      priority = 'Medium',
      createdBy = 'System'
    } = req.body;
    
    // Validate supplier exists
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(400).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    // Validate and populate items
    const populatedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }
      
      const populatedItem = {
        product: product._id,
        productName: product.productName,
        productCode: product.productCode,
        specifications: {
          yarnCount: product.specifications?.yarnCount || item.specifications?.yarnCount || '',
          color: product.specifications?.color || item.specifications?.color || '',
          quality: product.specifications?.quality || item.specifications?.quality || '',
          weight: product.specifications?.weight || item.specifications?.weight || 0,
          composition: product.specifications?.composition || item.specifications?.composition || ''
        },
        quantity: item.quantity,
        unit: item.unit || product.inventory?.unit || 'Bags',
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        deliveryDate: item.deliveryDate || expectedDeliveryDate,
        notes: item.notes || ''
      };
      
      populatedItems.push(populatedItem);
    }
    
    // Create purchase order
    const purchaseOrder = new PurchaseOrder({
      supplier: supplierId,
      supplierDetails: {
        companyName: supplier.companyName,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address
      },
      expectedDeliveryDate,
      items: populatedItems,
      taxRate,
      discountAmount,
      deliveryAddress,
      shippingMethod,
      paymentTerms,
      terms,
      notes,
      priority,
      createdBy
    });
    
    await purchaseOrder.save();
    
    // Populate the saved PO for response
    const populatedPO = await PurchaseOrder.findById(purchaseOrder._id)
      .populate('supplier', 'companyName supplierCode contactPerson email phone')
      .populate('items.product', 'productName productCode specifications');
    
    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: populatedPO
    });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase order',
      error: error.message
    });
  }
};

// Update purchase order
export const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Don't allow updating certain fields after PO is sent
    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }
    
    if (['Sent', 'Acknowledged', 'Approved'].includes(purchaseOrder.status)) {
      // Only allow status updates and notes for sent POs
      const allowedFields = ['status', 'notes', 'internalNotes', 'approvalStatus', 'approvedBy', 'approvedDate', 'rejectionReason'];
      const updateKeys = Object.keys(updateData);
      const hasRestrictedFields = updateKeys.some(key => !allowedFields.includes(key));
      
      if (hasRestrictedFields) {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify purchase order details after it has been sent. Only status and notes can be updated.'
        });
      }
    }
    
    // If updating items, validate products
    if (updateData.items) {
      for (const item of updateData.items) {
        if (item.product) {
          const product = await Product.findById(item.product);
          if (!product) {
            return res.status(400).json({
              success: false,
              message: `Product not found: ${item.product}`
            });
          }
        }
      }
    }
    
    const updatedPO = await PurchaseOrder.findByIdAndUpdate(
      id,
      { ...updateData, lastModifiedBy: updateData.lastModifiedBy || 'System' },
      { new: true, runValidators: true }
    )
    .populate('supplier', 'companyName supplierCode contactPerson email phone')
    .populate('items.product', 'productName productCode specifications');
    
    res.status(200).json({
      success: true,
      message: 'Purchase order updated successfully',
      data: updatedPO
    });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update purchase order',
      error: error.message
    });
  }
};

// Delete purchase order
export const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }
    
    // Only allow deletion of Draft POs
    if (purchaseOrder.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft purchase orders can be deleted'
      });
    }
    
    await PurchaseOrder.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Purchase order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete purchase order',
      error: error.message
    });
  }
};

// Update PO status
export const updatePurchaseOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const validStatuses = ['Draft', 'Sent', 'Acknowledged', 'Approved', 'Partially_Received', 'Fully_Received', 'Cancelled', 'Closed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const updateData = { status };
    
    // Add timestamp for status changes
    if (status === 'Sent') updateData.sentDate = new Date();
    if (status === 'Acknowledged') updateData.acknowledgedDate = new Date();
    if (notes) updateData.notes = notes;
    
    const updatedPO = await PurchaseOrder.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('supplier', 'companyName supplierCode contactPerson email phone');
    
    if (!updatedPO) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Purchase order status updated to ${status}`,
      data: updatedPO
    });
  } catch (error) {
    console.error('Error updating PO status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update purchase order status',
      error: error.message
    });
  }
};

// Receive items (Goods Receipt)
export const receiveItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedItems, notes } = req.body;
    
    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }
    
    // Update received quantities
    receivedItems.forEach(receivedItem => {
      const poItem = purchaseOrder.items.id(receivedItem.itemId);
      if (poItem) {
        poItem.receivedQuantity = Math.min(
          (poItem.receivedQuantity || 0) + receivedItem.quantity,
          poItem.quantity
        );
      }
    });
    
    if (notes) {
      purchaseOrder.notes = purchaseOrder.notes ? 
        `${purchaseOrder.notes}\n\nGoods Receipt: ${notes}` : 
        `Goods Receipt: ${notes}`;
    }
    
    await purchaseOrder.save(); // This will trigger the pre-save hook to update status
    
    // Update product inventory
    for (const receivedItem of receivedItems) {
      const poItem = purchaseOrder.items.id(receivedItem.itemId);
      if (poItem) {
        await Product.findByIdAndUpdate(
          poItem.product,
          { $inc: { 'inventory.currentStock': receivedItem.quantity } }
        );
      }
    }
    
    const updatedPO = await PurchaseOrder.findById(id)
      .populate('supplier', 'companyName supplierCode contactPerson email phone')
      .populate('items.product', 'productName productCode specifications');
    
    res.status(200).json({
      success: true,
      message: 'Items received successfully',
      data: updatedPO
    });
  } catch (error) {
    console.error('Error receiving items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to receive items',
      error: error.message
    });
  }
};

// Get PO statistics
export const getPurchaseOrderStats = async (req, res) => {
  try {
    const stats = await Promise.all([
      // Total POs
      PurchaseOrder.countDocuments(),
      
      // POs by status
      PurchaseOrder.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      // Overdue POs
      PurchaseOrder.countDocuments({
        expectedDeliveryDate: { $lt: new Date() },
        status: { $nin: ['Fully_Received', 'Cancelled', 'Closed'] }
      }),
      
      // Total value (current month)
      PurchaseOrder.aggregate([
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
            totalValue: { $sum: '$totalAmount' }
          }
        }
      ]),
      
      // Pending approvals
      PurchaseOrder.countDocuments({
        approvalStatus: 'Pending',
        status: { $ne: 'Draft' }
      })
    ]);
    
    const [totalPOs, statusCounts, overduePOs, monthlyValue, pendingApprovals] = stats;
    
    res.status(200).json({
      success: true,
      data: {
        totalPOs,
        statusBreakdown: statusCounts,
        overduePOs,
        monthlyValue: monthlyValue[0]?.totalValue || 0,
        pendingApprovals
      }
    });
  } catch (error) {
    console.error('Error fetching PO stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase order statistics',
      error: error.message
    });
  }
};
