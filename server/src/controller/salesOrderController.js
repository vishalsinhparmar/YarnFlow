import SalesOrder from '../models/SalesOrder.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import InventoryLot from '../models/InventoryLot.js';
import { validationResult } from 'express-validator';

// Get all sales orders with filtering and pagination
export const getAllSalesOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      customer,
      orderDate,
      priority,
      search,
      sortBy = 'orderDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter = {};
    
    if (status) filter.status = status;
    if (customer) filter.customer = customer;
    if (priority) filter.priority = priority;
    
    if (orderDate) {
      const date = new Date(orderDate);
      filter.orderDate = {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lte: new Date(date.setHours(23, 59, 59, 999))
      };
    }
    
    if (search) {
      filter.$or = [
        { soNumber: { $regex: search, $options: 'i' } },
        { 'customerDetails.companyName': { $regex: search, $options: 'i' } },
        { 'customerDetails.contactPerson': { $regex: search, $options: 'i' } },
        { customerPONumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with population
    const salesOrders = await SalesOrder.find(filter)
      .populate('customer', 'companyName contactPerson email phone')
      .populate('items.product', 'productName productCode specifications')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await SalesOrder.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.status(200).json({
      success: true,
      data: salesOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales orders',
      error: error.message
    });
  }
};

// Get single sales order by ID
export const getSalesOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const salesOrder = await SalesOrder.findById(id)
      .populate('customer', 'companyName contactPerson email phone address gstNumber')
      .populate('items.product', 'productName productCode specifications')
      .populate('items.inventoryAllocations.inventoryLot', 'lotNumber currentQuantity');

    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: salesOrder
    });
  } catch (error) {
    console.error('Error fetching sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales order',
      error: error.message
    });
  }
};

// Create new sales order
export const createSalesOrder = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      customer,
      expectedDeliveryDate,
      items,
      customerPONumber,
      salesPerson,
      customerNotes,
      internalNotes,
      paymentTerms,
      shippingAddress,
      shippingMethod,
      priority,
      orderType,
      discountPercentage,
      discountAmount,
      shippingCharges,
      createdBy
    } = req.body;

    // Validate customer exists
    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(400).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Validate products exist and get details
    const validatedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      validatedItems.push({
        product: product._id,
        productName: product.productName,
        productCode: product.productCode,
        orderedQuantity: item.orderedQuantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || 18,
        notes: item.notes
      });
    }

    // Generate SO number
    const soNumber = await SalesOrder.generateSONumber();

    // Create sales order
    const salesOrder = new SalesOrder({
      soNumber,
      customer: customerDoc._id,
      customerDetails: {
        companyName: customerDoc.companyName,
        contactPerson: customerDoc.contactPerson,
        email: customerDoc.email,
        phone: customerDoc.phone,
        address: customerDoc.address
      },
      expectedDeliveryDate,
      items: validatedItems,
      customerPONumber,
      salesPerson,
      customerNotes,
      internalNotes,
      paymentTerms: paymentTerms || customerDoc.paymentTerms,
      shippingAddress: shippingAddress || customerDoc.address,
      shippingMethod,
      priority,
      orderType,
      discountPercentage: discountPercentage || 0,
      discountAmount: discountAmount || 0,
      shippingCharges: shippingCharges || 0,
      createdBy
    });

    await salesOrder.save();

    // Populate the saved sales order for response
    const populatedSalesOrder = await SalesOrder.findById(salesOrder._id)
      .populate('customer', 'companyName contactPerson email phone')
      .populate('items.product', 'productName productCode specifications');

    res.status(201).json({
      success: true,
      message: 'Sales order created successfully',
      data: populatedSalesOrder
    });
  } catch (error) {
    console.error('Error creating sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sales order',
      error: error.message
    });
  }
};

// Update sales order
export const updateSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const salesOrder = await SalesOrder.findById(id);
    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    // Check if order can be modified
    if (['Shipped', 'Delivered', 'Cancelled'].includes(salesOrder.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot modify sales order in ${salesOrder.status} status`
      });
    }

    // Update the sales order
    Object.assign(salesOrder, updateData);
    salesOrder.updatedBy = updateData.updatedBy || 'System';

    await salesOrder.save();

    // Populate the updated sales order for response
    const populatedSalesOrder = await SalesOrder.findById(salesOrder._id)
      .populate('customer', 'companyName contactPerson email phone')
      .populate('items.product', 'productName productCode specifications');

    res.status(200).json({
      success: true,
      message: 'Sales order updated successfully',
      data: populatedSalesOrder
    });
  } catch (error) {
    console.error('Error updating sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sales order',
      error: error.message
    });
  }
};

// Update sales order status
export const updateSalesOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, updatedBy } = req.body;

    const validStatuses = ['Draft', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const salesOrder = await SalesOrder.findById(id);
    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    // Update status and add to workflow history
    salesOrder.status = status;
    salesOrder.updatedBy = updatedBy || 'System';
    
    if (notes) {
      salesOrder.workflowHistory.push({
        status,
        changedBy: updatedBy || 'System',
        changedDate: new Date(),
        notes
      });
    }

    // Handle specific status changes
    if (status === 'Delivered' && !salesOrder.actualDeliveryDate) {
      salesOrder.actualDeliveryDate = new Date();
    }

    await salesOrder.save();

    res.status(200).json({
      success: true,
      message: 'Sales order status updated successfully',
      data: salesOrder
    });
  } catch (error) {
    console.error('Error updating sales order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sales order status',
      error: error.message
    });
  }
};

// Reserve inventory for sales order
export const reserveInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { reservedBy } = req.body;

    const salesOrder = await SalesOrder.findById(id)
      .populate('items.product');

    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    if (salesOrder.status !== 'Confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Can only reserve inventory for confirmed orders'
      });
    }

    const reservationResults = [];

    // Process each item
    for (const item of salesOrder.items) {
      const requiredQuantity = item.orderedQuantity - item.reservedQuantity;
      
      if (requiredQuantity <= 0) {
        reservationResults.push({
          productName: item.productName,
          status: 'Already Reserved',
          reservedQuantity: item.reservedQuantity
        });
        continue;
      }

      // Find available inventory lots for this product
      const availableLots = await InventoryLot.find({
        product: item.product._id,
        status: 'Active',
        currentQuantity: { $gt: 0 }
      }).sort({ receivedDate: 1 }); // FIFO

      let remainingToReserve = requiredQuantity;
      const allocations = [];

      for (const lot of availableLots) {
        if (remainingToReserve <= 0) break;

        const availableInLot = lot.currentQuantity - (lot.reservedQuantity || 0);
        if (availableInLot <= 0) continue;

        const toReserve = Math.min(remainingToReserve, availableInLot);
        
        // Update inventory lot
        lot.reservedQuantity = (lot.reservedQuantity || 0) + toReserve;
        await lot.save();

        // Add allocation to sales order item
        allocations.push({
          inventoryLot: lot._id,
          lotNumber: lot.lotNumber,
          allocatedQuantity: toReserve,
          reservedDate: new Date(),
          status: 'Reserved'
        });

        remainingToReserve -= toReserve;
      }

      // Update sales order item
      item.reservedQuantity += (requiredQuantity - remainingToReserve);
      item.inventoryAllocations.push(...allocations);
      
      if (remainingToReserve === 0) {
        item.itemStatus = 'Reserved';
      }

      reservationResults.push({
        productName: item.productName,
        requiredQuantity,
        reservedQuantity: requiredQuantity - remainingToReserve,
        shortfall: remainingToReserve,
        status: remainingToReserve === 0 ? 'Fully Reserved' : 'Partially Reserved'
      });
    }

    // Update overall order status if all items are reserved
    const allItemsReserved = salesOrder.items.every(item => 
      item.itemStatus === 'Reserved'
    );
    
    if (allItemsReserved) {
      salesOrder.status = 'Processing';
    }

    salesOrder.updatedBy = reservedBy || 'System';
    await salesOrder.save();

    res.status(200).json({
      success: true,
      message: 'Inventory reservation completed',
      data: {
        salesOrder,
        reservationResults
      }
    });
  } catch (error) {
    console.error('Error reserving inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reserve inventory',
      error: error.message
    });
  }
};

// Ship sales order
export const shipSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber, courierCompany, shippedBy, notes } = req.body;

    const salesOrder = await SalesOrder.findById(id);
    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    if (salesOrder.status !== 'Processing') {
      return res.status(400).json({
        success: false,
        message: 'Can only ship orders in Processing status'
      });
    }

    // Update sales order
    salesOrder.status = 'Shipped';
    salesOrder.trackingNumber = trackingNumber;
    salesOrder.courierCompany = courierCompany;
    salesOrder.updatedBy = shippedBy || 'System';

    // Update inventory lots - reduce current quantity
    for (const item of salesOrder.items) {
      for (const allocation of item.inventoryAllocations) {
        const lot = await InventoryLot.findById(allocation.inventoryLot);
        if (lot) {
          // Reduce current quantity and reserved quantity
          lot.currentQuantity -= allocation.allocatedQuantity;
          lot.reservedQuantity -= allocation.allocatedQuantity;
          
          // Add movement record
          lot.movements.push({
            type: 'Issued',
            quantity: allocation.allocatedQuantity,
            date: new Date(),
            reference: salesOrder.soNumber,
            notes: `Shipped for sales order ${salesOrder.soNumber}`,
            performedBy: shippedBy || 'System'
          });
          
          await lot.save();
        }
        
        // Update allocation status
        allocation.status = 'Shipped';
      }
      
      // Update item quantities and status
      item.shippedQuantity = item.orderedQuantity;
      item.itemStatus = 'Shipped';
    }

    // Add to workflow history
    salesOrder.workflowHistory.push({
      status: 'Shipped',
      changedBy: shippedBy || 'System',
      changedDate: new Date(),
      notes: notes || `Shipped via ${courierCompany}, Tracking: ${trackingNumber}`
    });

    await salesOrder.save();

    res.status(200).json({
      success: true,
      message: 'Sales order shipped successfully',
      data: salesOrder
    });
  } catch (error) {
    console.error('Error shipping sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ship sales order',
      error: error.message
    });
  }
};

// Mark sales order as delivered
export const markAsDelivered = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveredBy, notes, actualDeliveryDate } = req.body;

    const salesOrder = await SalesOrder.findById(id);
    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    if (salesOrder.status !== 'Shipped') {
      return res.status(400).json({
        success: false,
        message: 'Can only mark shipped orders as delivered'
      });
    }

    // Update sales order
    salesOrder.status = 'Delivered';
    salesOrder.actualDeliveryDate = actualDeliveryDate ? new Date(actualDeliveryDate) : new Date();
    salesOrder.updatedBy = deliveredBy || 'System';

    // Update item status and allocations
    salesOrder.items.forEach(item => {
      item.deliveredQuantity = item.shippedQuantity;
      item.itemStatus = 'Delivered';
      
      item.inventoryAllocations.forEach(allocation => {
        allocation.status = 'Delivered';
      });
    });

    // Add to workflow history
    salesOrder.workflowHistory.push({
      status: 'Delivered',
      changedBy: deliveredBy || 'System',
      changedDate: new Date(),
      notes: notes || 'Order delivered successfully'
    });

    await salesOrder.save();

    res.status(200).json({
      success: true,
      message: 'Sales order marked as delivered',
      data: salesOrder
    });
  } catch (error) {
    console.error('Error marking as delivered:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as delivered',
      error: error.message
    });
  }
};

// Cancel sales order
export const cancelSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason, cancelledBy, notes } = req.body;

    const salesOrder = await SalesOrder.findById(id);
    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    if (['Delivered', 'Cancelled'].includes(salesOrder.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order in ${salesOrder.status} status`
      });
    }

    // Release reserved inventory
    for (const item of salesOrder.items) {
      for (const allocation of item.inventoryAllocations) {
        if (allocation.status === 'Reserved') {
          const lot = await InventoryLot.findById(allocation.inventoryLot);
          if (lot) {
            lot.reservedQuantity -= allocation.allocatedQuantity;
            await lot.save();
          }
        }
      }
    }

    // Update sales order
    salesOrder.status = 'Cancelled';
    salesOrder.cancellationReason = cancellationReason;
    salesOrder.cancelledBy = cancelledBy || 'System';
    salesOrder.cancelledDate = new Date();
    salesOrder.updatedBy = cancelledBy || 'System';

    // Add to workflow history
    salesOrder.workflowHistory.push({
      status: 'Cancelled',
      changedBy: cancelledBy || 'System',
      changedDate: new Date(),
      notes: notes || cancellationReason
    });

    await salesOrder.save();

    res.status(200).json({
      success: true,
      message: 'Sales order cancelled successfully',
      data: salesOrder
    });
  } catch (error) {
    console.error('Error cancelling sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel sales order',
      error: error.message
    });
  }
};

// Delete sales order (draft only)
export const deleteSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const salesOrder = await SalesOrder.findById(id);
    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    if (salesOrder.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete draft sales orders'
      });
    }

    await SalesOrder.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Sales order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete sales order',
      error: error.message
    });
  }
};

// Get sales order statistics
export const getSalesOrderStats = async (req, res) => {
  try {
    const stats = await SalesOrder.getOrderStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching sales order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales order statistics',
      error: error.message
    });
  }
};

// Get sales orders by customer
export const getSalesOrdersByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const salesOrders = await SalesOrder.find({ customer: customerId })
      .populate('customer', 'companyName contactPerson')
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await SalesOrder.countDocuments({ customer: customerId });

    res.status(200).json({
      success: true,
      data: salesOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching customer sales orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer sales orders',
      error: error.message
    });
  }
};
