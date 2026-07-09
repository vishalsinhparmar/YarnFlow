import SalesOrder from '../models/SalesOrder.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import InventoryLot from '../models/InventoryLot.js';
import SalesChallan from '../models/SalesChallan.js';
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
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter = {};
    
    if (status) filter.status = status;
    if (customer) filter.customer = customer;
    
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
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    // Default dropdown ordering is ascending by SO number; explicit sort params override it
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with population
    const salesOrders = await SalesOrder.find(filter)
      .populate('customer', 'companyName gstNumber address')
      .populate('category', 'categoryName')
      .populate('items.product', 'productName')
      .populate('items.subProduct', 'name')
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
      .populate('customer', 'companyName gstNumber address')
      .populate('category', 'categoryName')
      .populate('items.product', 'productName')
      .populate('items.subProduct', 'name');

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
      category,
      items,
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

    // Validate products exist and group by product+sub-product to validate total quantity/weight
    const validatedItems = [];
    const groupedItems = new Map();

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      const key = `${item.product}-${item.subProduct || '__none__'}`;
      const grouped = groupedItems.get(key) || {
        product,
        productId: item.product,
        subProductId: item.subProduct || null,
        subProductName: item.subProductName || null,
        totalQuantity: 0,
        totalWeight: 0,
        label: item.subProductName || product.productName,
        unit: item.unit
      };
      grouped.totalQuantity += Number(item.quantity) || 0;
      grouped.totalWeight += Number(item.weight) || 0;
      groupedItems.set(key, grouped);

      validatedItems.push({
        product: product._id,
        productName: product.productName,
        subProduct: item.subProduct || null,
        subProductName: item.subProductName || null,
        subProductWeights: Array.isArray(item.subProductWeights) ? item.subProductWeights : [],
        quantity: item.quantity,
        unit: item.unit,
        weight: item.weight || 0,
        notes: item.notes || ''  // ✅ Include notes from request
      });
    }

    // Check inventory availability grouped by product/sub-product
    for (const grouped of groupedItems.values()) {
      const inventoryFilter = {
        product: grouped.productId,
        status: 'Active',
        currentQuantity: { $gt: 0 }
      };
      if (grouped.subProductId) {
        inventoryFilter.subProduct = grouped.subProductId;
      }
      const inventoryLots = await InventoryLot.find(inventoryFilter);

      const totalAvailableQty = inventoryLots.reduce((sum, lot) => sum + (lot.currentQuantity || 0), 0);
      const totalAvailableWeight = inventoryLots.reduce((sum, lot) => {
        const weightPerUnit = lot.receivedQuantity > 0 ? (lot.totalWeight || 0) / lot.receivedQuantity : 0;
        return sum + (lot.currentQuantity || 0) * weightPerUnit;
      }, 0);

      if (totalAvailableQty < grouped.totalQuantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${grouped.label}. Available: ${totalAvailableQty} ${grouped.unit}, Requested: ${grouped.totalQuantity} ${grouped.unit}`
        });
      }

      if (grouped.totalWeight > 0 && grouped.totalWeight > totalAvailableWeight) {
        return res.status(400).json({
          success: false,
          message: `Insufficient weight for ${grouped.label}. Available: ${totalAvailableWeight.toFixed(2)} kg, Requested: ${grouped.totalWeight.toFixed(2)} kg`
        });
      }
    }


    // Create sales order
    const salesOrder = new SalesOrder({
      customer: customerDoc._id,
      customerName: customerDoc.companyName || 'Unknown Company',
      category,
      expectedDeliveryDate,
      items: validatedItems,
      createdBy: createdBy || 'Admin'
    });

      await salesOrder.save();
      console.log(`✅ Sales Order ${salesOrder.soNumber} saved successfully`);


    // Populate the saved sales order for response
    const populatedSalesOrder = await SalesOrder.findById(salesOrder._id)
      .populate('customer', 'companyName gstNumber address')
      .populate('category', 'categoryName')
      .populate('items.product', 'productName')
      .populate('items.subProduct', 'name');

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

    // Check if order can be modified - only Draft orders can be edited
    if (salesOrder.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: `Cannot modify sales order in ${salesOrder.status} status. Only Draft orders can be edited.`
      });
    }

    // Update the sales order
    Object.assign(salesOrder, updateData);
    salesOrder.updatedBy = updateData.updatedBy || 'System';

    await salesOrder.save();

    // Populate the updated sales order for response
    const populatedSalesOrder = await SalesOrder.findById(salesOrder._id)
      .populate('customer', 'companyName gstNumber address')
      .populate('category', 'categoryName')
      .populate('items.product', 'productName')
      .populate('items.subProduct', 'name');

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

// Cancel sales order
export const cancelSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;

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

    // Update sales order status
    salesOrder.status = 'Cancelled';
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

// Delete sales order (draft or cancelled only)
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

    // Allow deletion of Draft or Cancelled orders only
    if (salesOrder.status !== 'Draft' && salesOrder.status !== 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete draft or cancelled sales orders'
      });
    }

    // Check if there are any challans associated with this SO
    const SalesChallan = (await import('../models/SalesChallan.js')).default;
    const challansCount = await SalesChallan.countDocuments({ salesOrder: id });
    
    if (challansCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete sales order. It has ${challansCount} associated challan(s). Please delete or reassign the challans first.`
      });
    }

    await SalesOrder.findByIdAndDelete(id);

    console.log(`✅ Sales Order ${salesOrder.soNumber} deleted successfully`);

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
      .populate('customer', 'companyName')
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

// Recalculate all SO statuses based on challans (utility endpoint)
export const recalculateAllSOStatuses = async (req, res) => {
  try {
    const salesOrders = await SalesOrder.find({});
    let updated = 0;
    
    for (const so of salesOrders) {
      const challans = await SalesChallan.find({ salesOrder: so._id });
      
      if (challans.length > 0) {
        const oldStatus = so.status;
        so.updateDispatchStatus(challans);
        await so.save();
        
        if (oldStatus !== so.status) {
          updated++;
          console.log(`Updated ${so.soNumber}: ${oldStatus} → ${so.status}`);
        }
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Recalculated ${salesOrders.length} sales orders, updated ${updated}`,
      data: {
        total: salesOrders.length,
        updated: updated
      }
    });
  } catch (error) {
    console.error('Error recalculating SO statuses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to recalculate SO statuses',
      error: error.message
    });
  }
};
