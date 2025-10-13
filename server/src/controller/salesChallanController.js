import SalesChallan from '../models/SalesChallan.js';
import SalesOrder from '../models/SalesOrder.js';
import InventoryLot from '../models/InventoryLot.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';

// ============ SALES CHALLAN CONTROLLERS ============

// Get all sales challans with pagination and filters
export const getAllSalesChallans = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      customer,
      dateFrom,
      dateTo,
      soReference 
    } = req.query;
    
    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { challanNumber: { $regex: search, $options: 'i' } },
        { soReference: { $regex: search, $options: 'i' } },
        { trackingNumber: { $regex: search, $options: 'i' } },
        { 'customerDetails.companyName': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by customer
    if (customer) {
      query.customer = customer;
    }
    
    // Filter by SO reference
    if (soReference) {
      query.soReference = soReference;
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.challanDate = {};
      if (dateFrom) query.challanDate.$gte = new Date(dateFrom);
      if (dateTo) query.challanDate.$lte = new Date(dateTo);
    }
    
    const skip = (page - 1) * limit;
    
    const challans = await SalesChallan.find(query)
      .populate('customer', 'companyName contactPerson email phone')
      .populate('salesOrder', 'soNumber orderDate totalAmount')
      .populate('items.product', 'productName productCode')
      .sort({ challanDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await SalesChallan.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: challans,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sales challans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales challans',
      error: error.message
    });
  }
};

// Get sales challan by ID
export const getSalesChallanById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const challan = await SalesChallan.findById(id)
      .populate('customer', 'companyName contactPerson email phone address')
      .populate('salesOrder', 'soNumber orderDate totalAmount expectedDeliveryDate')
      .populate('items.product', 'productName productCode specifications')
      .populate('items.inventoryAllocations.inventoryLot', 'lotNumber availableQuantity');
    
    if (!challan) {
      return res.status(404).json({
        success: false,
        message: 'Sales challan not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: challan
    });
  } catch (error) {
    console.error('Error fetching sales challan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales challan',
      error: error.message
    });
  }
};

// Create sales challan from sales order
export const createSalesChallan = async (req, res) => {
  try {
    const {
      salesOrderId,
      deliveryAddress,
      transportDetails,
      expectedDeliveryDate,
      items,
      preparationNotes,
      createdBy
    } = req.body;
    
    // Validate sales order
    const salesOrder = await SalesOrder.findById(salesOrderId)
      .populate('customer')
      .populate('items.product');
    
    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }
    
    // Check if sales order is in correct status
    if (!['Confirmed', 'Processing'].includes(salesOrder.status)) {
      return res.status(400).json({
        success: false,
        message: 'Sales order must be confirmed or processing to create challan'
      });
    }
    
    // Check if challan already exists for this SO
    const existingChallan = await SalesChallan.findOne({ salesOrder: salesOrderId });
    if (existingChallan) {
      return res.status(400).json({
        success: false,
        message: 'Sales challan already exists for this sales order'
      });
    }
    
    // Prepare challan items
    const challanItems = [];
    let totalValue = 0;
    
    for (const item of items) {
      const soItem = salesOrder.items.find(si => si._id.toString() === item.salesOrderItemId);
      if (!soItem) {
        return res.status(400).json({
          success: false,
          message: `Invalid sales order item: ${item.salesOrderItemId}`
        });
      }
      
      // Validate dispatch quantity
      if (item.dispatchQuantity > soItem.orderedQuantity) {
        return res.status(400).json({
          success: false,
          message: `Dispatch quantity cannot exceed ordered quantity for ${soItem.productName}`
        });
      }
      
      // Allocate inventory if specified
      const inventoryAllocations = [];
      if (item.inventoryAllocations && item.inventoryAllocations.length > 0) {
        for (const allocation of item.inventoryAllocations) {
          const lot = await InventoryLot.findById(allocation.inventoryLotId);
          if (!lot) {
            return res.status(400).json({
              success: false,
              message: `Inventory lot not found: ${allocation.inventoryLotId}`
            });
          }
          
          if (allocation.allocatedQuantity > lot.availableQuantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient inventory in lot ${lot.lotNumber}`
            });
          }
          
          inventoryAllocations.push({
            inventoryLot: lot._id,
            allocatedQuantity: allocation.allocatedQuantity,
            lotNumber: lot.lotNumber
          });
        }
      }
      
      const itemValue = item.dispatchQuantity * soItem.unitPrice;
      totalValue += itemValue;
      
      challanItems.push({
        product: soItem.product._id,
        productName: soItem.product.productName,
        productCode: soItem.product.productCode,
        orderedQuantity: soItem.orderedQuantity,
        dispatchQuantity: item.dispatchQuantity,
        unit: soItem.unit,
        unitPrice: soItem.unitPrice,
        totalValue: itemValue,
        inventoryAllocations,
        itemStatus: 'Prepared',
        notes: item.notes || ''
      });
    }
    
    // Create sales challan
    const salesChallan = new SalesChallan({
      salesOrder: salesOrder._id,
      soReference: salesOrder.soNumber,
      customer: salesOrder.customer._id,
      customerDetails: {
        companyName: salesOrder.customer.companyName,
        contactPerson: salesOrder.customer.contactPerson,
        phone: salesOrder.customer.phone,
        email: salesOrder.customer.email
      },
      deliveryAddress: deliveryAddress || {
        street: salesOrder.customer.address?.street || '',
        city: salesOrder.customer.address?.city || '',
        state: salesOrder.customer.address?.state || '',
        pincode: salesOrder.customer.address?.pincode || '',
        country: salesOrder.customer.address?.country || 'India'
      },
      items: challanItems,
      transportDetails: transportDetails || {},
      deliveryDetails: {
        expectedDeliveryDate: expectedDeliveryDate || salesOrder.expectedDeliveryDate
      },
      totalValue,
      taxAmount: salesOrder.taxAmount || 0,
      preparationNotes,
      createdBy: createdBy || 'Admin'
    });
    
    await salesChallan.save();
    
    // Update sales order status to Shipped
    salesOrder.status = 'Shipped';
    salesOrder.shippedDate = new Date();
    await salesOrder.save();
    
    // Reserve inventory lots
    for (const item of challanItems) {
      for (const allocation of item.inventoryAllocations) {
        await InventoryLot.findByIdAndUpdate(
          allocation.inventoryLot,
          { 
            $inc: { 
              availableQuantity: -allocation.allocatedQuantity,
              reservedQuantity: allocation.allocatedQuantity
            }
          }
        );
      }
    }
    
    // Populate the created challan for response
    const populatedChallan = await SalesChallan.findById(salesChallan._id)
      .populate('customer', 'companyName contactPerson email phone')
      .populate('salesOrder', 'soNumber orderDate totalAmount')
      .populate('items.product', 'productName productCode');
    
    res.status(201).json({
      success: true,
      message: 'Sales challan created successfully',
      data: populatedChallan
    });
  } catch (error) {
    console.error('Error creating sales challan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sales challan',
      error: error.message
    });
  }
};

// Update sales challan
export const updateSalesChallan = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const challan = await SalesChallan.findById(id);
    if (!challan) {
      return res.status(404).json({
        success: false,
        message: 'Sales challan not found'
      });
    }
    
    // Don't allow updating delivered challans
    if (challan.status === 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify delivered challan'
      });
    }
    
    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key !== '_id' && key !== 'challanNumber' && key !== 'createdAt') {
        challan[key] = updateData[key];
      }
    });
    
    challan.updatedBy = updateData.updatedBy || 'Admin';
    await challan.save();
    
    const updatedChallan = await SalesChallan.findById(id)
      .populate('customer', 'companyName contactPerson email phone')
      .populate('salesOrder', 'soNumber orderDate totalAmount')
      .populate('items.product', 'productName productCode');
    
    res.status(200).json({
      success: true,
      message: 'Sales challan updated successfully',
      data: updatedChallan
    });
  } catch (error) {
    console.error('Error updating sales challan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sales challan',
      error: error.message
    });
  }
};

// Update challan status
export const updateChallanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, location, updatedBy } = req.body;
    
    const validStatuses = ['Prepared', 'Packed', 'Dispatched', 'In_Transit', 'Out_for_Delivery', 'Delivered', 'Returned', 'Cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const challan = await SalesChallan.findById(id);
    if (!challan) {
      return res.status(404).json({
        success: false,
        message: 'Sales challan not found'
      });
    }
    
    // Update status
    challan.status = status;
    challan.updatedBy = updatedBy || 'Admin';
    
    // Add to status history
    challan.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: updatedBy || 'Admin',
      notes: notes || `Status changed to ${status}`,
      location: location || ''
    });
    
    // Update specific fields based on status
    if (status === 'Dispatched') {
      challan.deliveryDetails.dispatchDate = new Date();
    } else if (status === 'Delivered') {
      challan.deliveryDetails.actualDeliveryDate = new Date();
      
      // Update sales order status to delivered
      await SalesOrder.findByIdAndUpdate(challan.salesOrder, {
        status: 'Delivered',
        deliveredDate: new Date()
      });
      
      // Update inventory - move from reserved to consumed
      for (const item of challan.items) {
        for (const allocation of item.inventoryAllocations) {
          await InventoryLot.findByIdAndUpdate(
            allocation.inventoryLot,
            { 
              $inc: { 
                reservedQuantity: -allocation.allocatedQuantity,
                consumedQuantity: allocation.allocatedQuantity
              }
            }
          );
        }
      }
    }
    
    await challan.save();
    
    const updatedChallan = await SalesChallan.findById(id)
      .populate('customer', 'companyName contactPerson email phone')
      .populate('salesOrder', 'soNumber orderDate totalAmount');
    
    res.status(200).json({
      success: true,
      message: `Challan status updated to ${status}`,
      data: updatedChallan
    });
  } catch (error) {
    console.error('Error updating challan status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update challan status',
      error: error.message
    });
  }
};

// Delete sales challan (only if not dispatched)
export const deleteSalesChallan = async (req, res) => {
  try {
    const { id } = req.params;
    
    const challan = await SalesChallan.findById(id);
    if (!challan) {
      return res.status(404).json({
        success: false,
        message: 'Sales challan not found'
      });
    }
    
    // Only allow deletion of prepared/packed challans
    if (!['Prepared', 'Packed'].includes(challan.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only prepared or packed challans can be deleted'
      });
    }
    
    // Release reserved inventory
    for (const item of challan.items) {
      for (const allocation of item.inventoryAllocations) {
        await InventoryLot.findByIdAndUpdate(
          allocation.inventoryLot,
          { 
            $inc: { 
              availableQuantity: allocation.allocatedQuantity,
              reservedQuantity: -allocation.allocatedQuantity
            }
          }
        );
      }
    }
    
    // Update sales order status back to processing
    await SalesOrder.findByIdAndUpdate(challan.salesOrder, {
      status: 'Processing'
    });
    
    await SalesChallan.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Sales challan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sales challan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete sales challan',
      error: error.message
    });
  }
};

// Get sales challan statistics
export const getSalesChallanStats = async (req, res) => {
  try {
    const stats = await SalesChallan.getStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching sales challan stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales challan statistics',
      error: error.message
    });
  }
};

// Get challans by sales order
export const getChallansBySalesOrder = async (req, res) => {
  try {
    const { soId } = req.params;
    
    const challans = await SalesChallan.find({ salesOrder: soId })
      .populate('customer', 'companyName contactPerson')
      .sort({ challanDate: -1 });
    
    res.status(200).json({
      success: true,
      data: challans
    });
  } catch (error) {
    console.error('Error fetching challans by sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch challans',
      error: error.message
    });
  }
};

// Track challan
export const trackChallan = async (req, res) => {
  try {
    const { challanNumber } = req.params;
    
    const challan = await SalesChallan.findOne({ challanNumber })
      .populate('customer', 'companyName contactPerson')
      .populate('salesOrder', 'soNumber')
      .select('challanNumber status statusHistory deliveryDetails transportDetails');
    
    if (!challan) {
      return res.status(404).json({
        success: false,
        message: 'Challan not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        challanNumber: challan.challanNumber,
        status: challan.status,
        customer: challan.customer,
        salesOrder: challan.salesOrder,
        transportDetails: challan.transportDetails,
        deliveryDetails: challan.deliveryDetails,
        statusHistory: challan.statusHistory
      }
    });
  } catch (error) {
    console.error('Error tracking challan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track challan',
      error: error.message
    });
  }
};
