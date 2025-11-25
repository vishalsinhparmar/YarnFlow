import PurchaseOrder from '../models/PurchaseOrder.js';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';
import Category from '../models/Category.js';

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
      .populate('supplier', 'companyName gstNumber')
      .populate('category', 'categoryName')
      .populate('items.product', 'productName')
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
      .populate('supplier', 'companyName gstNumber')
      .populate('category', 'categoryName')
      .populate('items.product', 'productName');
    
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
      category: categoryId,
      expectedDeliveryDate,
      items,
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

    // Validate category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
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

      // Validate product belongs to selected category
      const productCategoryId = product.category?._id?.toString() || product.category?.toString();
      if (productCategoryId !== categoryId) {
        return res.status(400).json({
          success: false,
          message: `Product "${product.productName}" does not belong to the selected category`
        });
      }
      
      const populatedItem = {
        product: product._id,
        productName: product.productName,
        productCode: product.productCode,
        quantity: item.quantity,
        weight: item.weight || 0,
        unit: item.unit || 'Bags',
        notes: item.notes || ''
      };
      
      populatedItems.push(populatedItem);
    }
    
    // Generate PO number using static method (prevents duplicate key errors)
    const poNumber = await PurchaseOrder.generatePONumber();
    
    // Create purchase order
    const purchaseOrder = new PurchaseOrder({
      poNumber,
      supplier: supplierId,
      category: categoryId,
      supplierDetails: {
        companyName: supplier.companyName,
        contactPerson: supplier.contactPerson,
        phone: supplier.phone,
        address: supplier.address
      },
      expectedDeliveryDate,
      items: populatedItems,
      createdBy
    });
    
    await purchaseOrder.save();
    
    // Populate the saved PO for response
    const populatedPO = await PurchaseOrder.findById(purchaseOrder._id)
      .populate('supplier', 'companyName gstNumber')
      .populate('category', 'categoryName')
      .populate('items.product', 'productName');
    
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
    
    // If updating items, validate and populate product details
    if (updateData.items) {
      const populatedItems = [];
      for (const item of updateData.items) {
        if (item.product) {
          const product = await Product.findById(item.product);
          if (!product) {
            return res.status(400).json({
              success: false,
              message: `Product not found: ${item.product}`
            });
          }
          
          // Populate item with product details
          populatedItems.push({
            product: product._id,
            productName: product.productName,
            productCode: product.productCode,
            quantity: item.quantity,
            weight: item.weight || 0,
            unit: item.unit || 'Bags',
            notes: item.notes || '',
            // Preserve existing receipt data if any
            receivedQuantity: item.receivedQuantity || 0,
            receivedWeight: item.receivedWeight || 0,
            pendingQuantity: item.pendingQuantity || 0,
            pendingWeight: item.pendingWeight || 0,
            receiptStatus: item.receiptStatus || 'Pending',
            manuallyCompleted: item.manuallyCompleted || false
          });
        }
      }
      updateData.items = populatedItems;
    }
    
    const updatedPO = await PurchaseOrder.findByIdAndUpdate(
      id,
      { ...updateData, lastModifiedBy: updateData.lastModifiedBy || 'System' },
      { new: true, runValidators: true }
    )
    .populate('supplier', 'companyName gstNumber')
    .populate('items.product', 'productName');
    
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
    
    // Only allow deletion of Draft and Cancelled POs
    if (purchaseOrder.status !== 'Draft' && purchaseOrder.status !== 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Only draft and cancelled purchase orders can be deleted'
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
    .populate('supplier', 'companyName gstNumber');
    
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

// Cancel purchase order
export const cancelPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason, cancelledBy } = req.body;
    
    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }
    
    // Don't allow cancelling already cancelled or completed POs
    if (purchaseOrder.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Purchase order is already cancelled'
      });
    }
    
    if (purchaseOrder.status === 'Fully_Received') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a fully received purchase order'
      });
    }
    
    // Update PO with cancellation details
    purchaseOrder.status = 'Cancelled';
    purchaseOrder.cancellationReason = cancellationReason || 'Cancelled by user';
    purchaseOrder.cancelledBy = cancelledBy || 'Admin';
    purchaseOrder.cancelledDate = new Date();
    
    await purchaseOrder.save();
    
    res.status(200).json({
      success: true,
      message: 'Purchase order cancelled successfully',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error cancelling purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel purchase order',
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
