import SalesChallan from '../models/SalesChallan.js';
import SalesOrder from '../models/SalesOrder.js';
import InventoryLot from '../models/InventoryLot.js';
import Product from '../models/Product.js';
import { generateSalesChallanPDF, generateSalesOrderConsolidatedPDF } from '../utils/pdfGenerator.js';

// ============ HELPER FUNCTIONS ============

// Get dispatched quantities for a sales order
export const getDispatchedQuantities = async (req, res) => {
  try {
    const { salesOrderId } = req.params;

    // Get all challans for this SO
    const challans = await SalesChallan.find({ salesOrder: salesOrderId });

    // Calculate dispatched quantities per item
    const dispatchedMap = {};
    challans.forEach(challan => {
      challan.items.forEach(item => {
        const key = item.salesOrderItem.toString();
        if (!dispatchedMap[key]) {
          dispatchedMap[key] = {
            salesOrderItem: item.salesOrderItem,
            product: item.product,
            productName: item.productName,
            totalDispatched: 0,
            unit: item.unit
          };
        }
        dispatchedMap[key].totalDispatched += item.dispatchQuantity;
      });
    });

    res.status(200).json({
      success: true,
      data: Object.values(dispatchedMap)
    });
  } catch (error) {
    console.error('Error getting dispatched quantities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dispatched quantities',
      error: error.message
    });
  }
};

// ============ SALES CHALLAN CONTROLLERS ============

// Get all sales challans with pagination and filters
export const getAllSalesChallans = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search
    } = req.query;
    
    // Validate and cap limit to prevent memory issues
    const validatedLimit = Math.min(parseInt(limit) || 10, 200); // Max 200 items per request
    const validatedPage = Math.max(parseInt(page) || 1, 1);
    
    let query = {};
    
    // Search functionality with optimized regex
    if (search && search.trim()) {
      const searchTerm = search.trim();
      query.$or = [
        { challanNumber: { $regex: searchTerm, $options: 'i' } },
        { soNumber: { $regex: searchTerm, $options: 'i' } },
        { customerName: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    const skip = (validatedPage - 1) * validatedLimit;
    
    // Execute queries in parallel for better performance
    const [challans, total] = await Promise.all([
      SalesChallan.find(query)
        .populate('customer', 'companyName gstNumber address')
        .populate('salesOrder', 'soNumber orderDate status')
        .populate('items.product', 'productName')
        .sort({ challanDate: -1 })
        .skip(skip)
        .limit(validatedLimit),
      SalesChallan.countDocuments(query)
    ]);
    
    res.status(200).json({
      success: true,
      data: challans,
      pagination: {
        currentPage: validatedPage,
        totalPages: Math.ceil(total / validatedLimit),
        totalItems: total,
        itemsPerPage: validatedLimit,
        hasNextPage: skip + validatedLimit < total,
        hasPrevPage: validatedPage > 1
      }
    });
  } catch (error) {
    console.error('Error fetching sales challans:', error);
    
    // Don't expose internal errors in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales challans',
      error: isDevelopment ? error.message : 'Internal server error'
    });
  }
};

// Get sales challan by ID
export const getSalesChallanById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const challan = await SalesChallan.findById(id)
      .populate('customer', 'companyName gstNumber address')
      .populate('salesOrder', 'soNumber orderDate expectedDeliveryDate')
      .populate('items.product', 'productName');
    
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
      salesOrder,
      expectedDeliveryDate,
      warehouseLocation,
      items,
      notes,
      createdBy
    } = req.body;
    
    // Validate required fields
    if (!salesOrder) {
      return res.status(400).json({
        success: false,
        message: 'Sales Order is required'
      });
    }

    if (!warehouseLocation) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse Location is required'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }
    
    // Get SO details
    const so = await SalesOrder.findById(salesOrder)
      .populate('customer')
      .populate('items.product');
    
    console.log('Sales Order found:', {
      id: so?._id,
      soNumber: so?.soNumber,
      customer: so?.customer,
      itemsCount: so?.items?.length
    });
    
    if (!so) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }
    
    if (!so.customer) {
      return res.status(400).json({
        success: false,
        message: 'Sales order customer not found or not populated'
      });
    }
    
    // Prevent challan creation for Delivered or Cancelled SOs
    if (['Delivered', 'Cancelled'].includes(so.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create challan for delivered or cancelled sales order'
      });
    }
    
    // Validate dispatch quantities
    for (const item of items) {
      const soItem = so.items.find(si => si._id.toString() === item.salesOrderItem.toString());
      if (!soItem) {
        return res.status(400).json({
          success: false,
          message: `Item not found in sales order`
        });
      }

      if (item.dispatchQuantity > soItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Dispatch quantity exceeds ordered quantity for ${item.productName}`
        });
      }
    }

    // Prepare challan data
    const challanData = {
      salesOrder: so._id,
      soNumber: so.soNumber || `SO-${Date.now()}`,
      customer: so.customer._id,
      customerName: so.customer.companyName || so.customer.name || 'Unknown',
      warehouseLocation,
      expectedDeliveryDate: expectedDeliveryDate || null,
      items: items.map(item => {
        // Find corresponding SO item to get notes
        const soItem = so.items.find(si => si._id.toString() === item.salesOrderItem.toString());
        return {
          salesOrderItem: item.salesOrderItem,
          product: item.product,
          productName: item.productName,
          orderedQuantity: item.orderedQuantity,
          dispatchQuantity: item.dispatchQuantity,
          unit: item.unit,
          weight: item.weight || 0,
          notes: soItem?.notes || '',
          manuallyCompleted: item.markAsComplete || false
        };
      }),
      notes: notes || '',  // Add dispatch notes from form
      createdBy: createdBy || 'Admin',
      status: 'Prepared'
    };

    console.log('Creating challan with data:', JSON.stringify(challanData, null, 2));

    // Create challan
    const challan = new SalesChallan(challanData);

    try {
      await challan.save();
      console.log('Challan saved successfully:', challan._id);
    } catch (saveError) {
      console.error('Challan save error:', saveError);
      console.error('Validation errors:', saveError.errors);
      throw saveError;
    }

    // Update SO dispatch status (like GRN updates PO receipt status)
    // Fetch all challans for this SO to calculate dispatch status
    const allChallans = await SalesChallan.find({ salesOrder: so._id });
    so.updateDispatchStatus(allChallans);
    await so.save();

    // Process Stock Out for inventory (following GRN pattern)
    // IMPORTANT: Only deduct stock when SO item is COMPLETE (like GRN only creates lots when PO item is complete)
    // Stock out happens ONLY when:
    // 1. Item is 100% dispatched (quantity fully dispatched), OR
    // 2. Item is manually marked as complete
    console.log(`\n🔄 Starting stock out processing for ${items.length} item(s)...`);
    
    try {
      for (const item of items) {
        console.log(`\n📦 Processing item: ${item.productName}`);
        console.log(`   Product ID: ${item.product}`);
        console.log(`   SO Item ID: ${item.salesOrderItem}`);
        console.log(`   Dispatch Qty: ${item.dispatchQuantity}`);
        console.log(`   Weight: ${item.weight}`);
        
        // Find the SO item to check completion status
        const soItem = so.items.find(i => i._id.toString() === item.salesOrderItem.toString());
        if (!soItem) {
          console.warn(`⚠️ SO item not found for ${item.productName}`);
          console.warn(`   Available SO items: ${so.items.map(i => i._id.toString()).join(', ')}`);
          continue;
        }
        
        console.log(`   SO Item found: ${soItem.productName}, Qty: ${soItem.quantity}`);
        
        // Calculate total dispatched for this SO item across all challans
        const totalDispatched = allChallans.reduce((sum, ch) => {
          const chItem = ch.items.find(i => i.salesOrderItem.toString() === item.salesOrderItem.toString());
          return sum + (chItem ? chItem.dispatchQuantity : 0);
        }, 0);
        
        // Check if this specific SO item is now complete
        const isItemComplete = item.markAsComplete || totalDispatched >= soItem.quantity;
        
        console.log(`   Total dispatched across all challans: ${totalDispatched}`);
        console.log(`   SO item quantity: ${soItem.quantity}`);
        console.log(`   Mark as complete: ${item.markAsComplete || false}`);
        console.log(`   Is item complete: ${isItemComplete}`);
        
        if (!isItemComplete) {
          console.log(`⏳ SO item ${item.productName} not yet complete (${totalDispatched}/${soItem.quantity}). Stock will NOT be deducted yet.`);
          continue; // Skip stock deduction for incomplete items
        }
        
        console.log(`✅ SO item ${item.productName} is COMPLETE (${totalDispatched}/${soItem.quantity}). Processing stock out for ALL challans...`);
        
        // When item becomes complete, deduct stock for ALL challans (current + previous)
        // This is similar to GRN creating lots for all previous partial GRNs when item completes
        const challansForThisItem = allChallans.filter(ch => 
          ch.items.some(i => i.salesOrderItem.toString() === item.salesOrderItem.toString())
        ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Process in chronological order
        
        console.log(`📦 Found ${challansForThisItem.length} challan(s) for this item. Processing stock out...`);
        console.log(`   Challan numbers: ${challansForThisItem.map(ch => ch.challanNumber).join(', ')}`);
        
        // Check if stock has already been deducted by looking for a movement with all these challan numbers
        const challanNumbersStr = challansForThisItem.map(ch => ch.challanNumber).sort().join(', ');
        console.log(`   Looking for existing movement with reference: "${challanNumbersStr}"`);
        
        const existingMovement = await InventoryLot.findOne({
          product: item.product,
          'movements': {
            $elemMatch: {
              type: 'Issued',
              reference: challanNumbersStr
            }
          }
        }).lean();
        
        if (existingMovement) {
          console.log(`⏭️ Stock already deducted for this SO item (found movement with reference: ${challanNumbersStr})`);
          continue;
        }
        
        console.log(`   No existing movement found. Proceeding with stock deduction...`);
        
        let totalQtyToDeduct = 0;
        let totalWeightToDeduct = 0;
        
        // Calculate total quantity and weight to deduct from all challans
        for (const challanToProcess of challansForThisItem) {
          const challanItem = challanToProcess.items.find(i => i.salesOrderItem.toString() === item.salesOrderItem.toString());
          if (challanItem) {
            totalQtyToDeduct += challanItem.dispatchQuantity;
            totalWeightToDeduct += challanItem.weight || 0;
          }
        }
        
        console.log(`📊 Total to deduct: ${totalQtyToDeduct} ${item.unit}, ${totalWeightToDeduct.toFixed(2)} kg`);
        
        // Find available inventory lots for this product (FIFO - First In First Out)
        const lots = await InventoryLot.find({
          product: item.product,
          status: 'Active',
          currentQuantity: { $gt: 0 }
        }).sort({ receivedDate: 1 }); // FIFO: oldest first

        if (lots.length === 0) {
          console.warn(`⚠️ No inventory lots found for ${item.productName}`);
          continue;
        }

        let remainingQty = totalQtyToDeduct;
        let remainingWeight = totalWeightToDeduct;
        const lotsUpdated = [];

        // Deduct from lots using FIFO (following GRN pattern)
        for (const lot of lots) {
          if (remainingQty <= 0) break;

          const availableQty = lot.currentQuantity - lot.reservedQuantity;
          if (availableQty <= 0) continue;

          const qtyToDeduct = Math.min(remainingQty, availableQty);
          
          // Calculate proportional weight to deduct
          const weightPerUnit = remainingWeight / remainingQty;
          const weightToDeduct = qtyToDeduct * weightPerUnit;

          // Update lot quantities (similar to GRN updating inventory)
          lot.currentQuantity -= qtyToDeduct;

          // Add movement record with weight for ALL challans (not just current one)
          // Reference all challan numbers that contributed to this deduction
          const challanRefs = challansForThisItem.map(ch => ch.challanNumber).join(', ');
          lot.movements.push({
            type: 'Issued',
            quantity: qtyToDeduct,
            weight: weightToDeduct,
            date: new Date(),
            reference: challanRefs,
            notes: `Stock out for Sales Challan(s): ${challanRefs} (SO Item Completed)`,
            performedBy: createdBy || 'Admin'
          });

          // Update status if fully consumed
          if (lot.currentQuantity === 0) {
            lot.status = 'Consumed';
          }

          await lot.save();
          lotsUpdated.push({ lotNumber: lot.lotNumber, quantity: qtyToDeduct, weight: weightToDeduct });
          remainingQty -= qtyToDeduct;
          remainingWeight -= weightToDeduct;

          console.log(`📦 Deducted ${qtyToDeduct} ${item.unit} (${weightToDeduct.toFixed(2)} kg) of ${item.productName} from lot ${lot.lotNumber}`);
          console.log(`⚖️  Weight saved in movement: ${weightToDeduct.toFixed(2)} kg`);
        }

        // Update product inventory (following GRN pattern)
        if (lotsUpdated.length > 0) {
          const totalDeducted = lotsUpdated.reduce((sum, l) => sum + l.quantity, 0);
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { 'inventory.currentStock': -totalDeducted } }
          );
        }

        if (remainingQty > 0) {
          console.warn(`⚠️ Insufficient stock for ${item.productName}. Short by ${remainingQty} ${item.unit}`);
        }
      }

      console.log(`✅ Stock out processed for challan ${challan.challanNumber}`);
    } catch (stockError) {
      console.error('⚠️ Error processing stock out:', stockError.message);
      // Don't fail the challan creation if stock out fails
      // Log error for manual intervention
    }

    // Populate challan before returning
    const populatedChallan = await SalesChallan.findById(challan._id)
      .populate('customer', 'companyName gstNumber address')
      .populate('salesOrder', 'soNumber orderDate status')
      .populate('items.product', 'productName');

    res.status(201).json({
      success: true,
      message: 'Sales Challan created successfully',
      data: populatedChallan
    });
  } catch (error) {
    console.error('Error creating sales challan:', error);
    
    // If it's a validation error, send detailed info
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
        details: error.message
      });
    }
    
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
    
    // Don't allow updating delivered or cancelled challans
    if (['Delivered', 'Cancelled'].includes(challan.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify delivered or cancelled challan'
      });
    }
    
    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key !== '_id' && key !== 'challanNumber' && key !== 'createdAt') {
        challan[key] = updateData[key];
      }
    });
    
    await challan.save();
    
    const updatedChallan = await SalesChallan.findById(id)
      .populate('customer', 'companyName gstNumber address')
      .populate('salesOrder', 'soNumber orderDate')
      .populate('items.product', 'productName');
    
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
    
    const validStatuses = ['Prepared', 'Dispatched', 'Delivered', 'Cancelled'];
    
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
    
    // Add to status history
    challan.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: updatedBy || 'Admin',
      notes: notes || `Status changed to ${status}`
    });
    
    await challan.save();
    
    const updatedChallan = await SalesChallan.findById(id)
      .populate('customer', 'companyName gstNumber address')
      .populate('salesOrder', 'soNumber orderDate');
    
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
    
    // Only allow deletion of prepared challans
    if (challan.status !== 'Prepared') {
      return res.status(400).json({
        success: false,
        message: 'Only prepared challans can be deleted'
      });
    }
    
    
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
      .populate('customer', 'companyName')
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
      .populate('customer', 'companyName')
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

// ============================================
// GENERATE SALES CHALLAN PDF INVOICE
// ============================================
export const generateChallanPDF = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch complete challan data with all populated fields including customer address and category
    const challan = await SalesChallan.findById(id)
      .populate('customer', 'companyName gstNumber address')
      .populate({
        path: 'salesOrder',
        select: 'soNumber orderDate expectedDeliveryDate category',
        populate: {
          path: 'category',
          select: 'categoryName'
        }
      })
      .populate('items.product', 'productName');

    if (!challan) {
      return res.status(404).json({
        success: false,
        message: 'Sales challan not found'
      });
    }

    // Company information (your company - the sender)
    const companyInfo = {
      name: process.env.COMPANY_NAME || 'YarnFlow',
      address: process.env.COMPANY_ADDRESS || 'Business Address Line 1',
      city: process.env.COMPANY_CITY || 'City, State - 000000',
      phone: process.env.COMPANY_PHONE || '+91 00000 00000',
      email: process.env.COMPANY_EMAIL || 'info@yarnflow.com',
      gstin: process.env.COMPANY_GSTIN || 'GSTIN: 00XXXXX0000X0X0'
    };

    // Generate PDF buffer
    const pdfBuffer = await generateSalesChallanPDF(challan.toObject(), companyInfo);

    // Set response headers for PDF download
    const filename = `Sales_Challan_${challan.challanNumber}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Send PDF buffer
    res.send(pdfBuffer);

    console.log(`PDF generated successfully for challan: ${challan.challanNumber}`);

  } catch (error) {
    console.error('Error generating challan PDF:', error);
    
    // Don't expose internal errors in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: isDevelopment ? error.message : 'Internal server error'
    });
  }
};

// ============================================
// GENERATE CONSOLIDATED PDF FOR SALES ORDER (All Challans)
// ============================================
export const generateSOConsolidatedPDF = async (req, res) => {
  try {
    const { soId } = req.params;

    // Fetch all challans for this Sales Order
    const challans = await SalesChallan.find({ salesOrder: soId })
      .populate('customer', 'companyName gstNumber address')
      .populate('salesOrder', 'soNumber orderDate expectedDeliveryDate')
      .populate({
        path: 'items.product',
        select: 'productName category',
        populate: {
          path: 'category',
          select: 'categoryName name' // Include both field names for compatibility
        }
      })
      .sort({ challanDate: 1 }); // Sort by date

    if (!challans || challans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No challans found for this Sales Order'
      });
    }

    // Company information (your company - the sender)
    const companyInfo = {
      name: process.env.COMPANY_NAME || 'YarnFlow',
      address: process.env.COMPANY_ADDRESS || 'Business Address Line 1',
      city: process.env.COMPANY_CITY || 'City, State - 000000',
      phone: process.env.COMPANY_PHONE || '+91 00000 00000',
      email: process.env.COMPANY_EMAIL || 'info@yarnflow.com',
      gstin: process.env.COMPANY_GSTIN || 'GSTIN: 00XXXXX0000X0X0'
    };

    // Consolidate all challan data
    const consolidatedData = {
      salesOrder: challans[0].salesOrder,
      customer: challans[0].customer,
      customerDetails: challans[0].customerDetails,
      challans: challans,
      soNumber: challans[0].soReference || challans[0].salesOrder?.soNumber,
      totalChallans: challans.length
    };

    // Generate consolidated PDF buffer
    const pdfBuffer = await generateSalesOrderConsolidatedPDF(consolidatedData, companyInfo);

    // Set response headers for download
    const filename = `SO_${consolidatedData.soNumber}_Consolidated_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);

    console.log(`✅ Consolidated PDF generated for SO: ${consolidatedData.soNumber}`);
  } catch (error) {
    console.error('❌ Error generating consolidated PDF:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' 
        ? 'Failed to generate consolidated PDF' 
        : error.message
    });
  }
};

// ============================================
// PREVIEW CONSOLIDATED PDF FOR SALES ORDER
// ============================================
export const previewSOConsolidatedPDF = async (req, res) => {
  try {
    const { soId } = req.params;

    // Fetch all challans for this Sales Order
    const challans = await SalesChallan.find({ salesOrder: soId })
      .populate('customer', 'companyName gstNumber address')
      .populate('salesOrder', 'soNumber orderDate expectedDeliveryDate')
      .populate({
        path: 'items.product',
        select: 'productName category',
        populate: {
          path: 'category',
          select: 'categoryName name' // Include both field names for compatibility
        }
      })
      .sort({ challanDate: 1 });

    if (!challans || challans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No challans found for this Sales Order'
      });
    }

    // Company information
    const companyInfo = {
      name: process.env.COMPANY_NAME || 'YarnFlow',
      address: process.env.COMPANY_ADDRESS || 'Business Address Line 1',
      city: process.env.COMPANY_CITY || 'City, State - 000000',
      phone: process.env.COMPANY_PHONE || '+91 00000 00000',
      email: process.env.COMPANY_EMAIL || 'info@yarnflow.com',
      gstin: process.env.COMPANY_GSTIN || 'GSTIN: 00XXXXX0000X0X0'
    };

    // Consolidate data
    const consolidatedData = {
      salesOrder: challans[0].salesOrder,
      customer: challans[0].customer,
      customerDetails: challans[0].customerDetails,
      challans: challans,
      soNumber: challans[0].soReference || challans[0].salesOrder?.soNumber,
      totalChallans: challans.length
    };

    // Generate PDF buffer
    const pdfBuffer = await generateSalesOrderConsolidatedPDF(consolidatedData, companyInfo);

    // Set headers for inline display
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);

    console.log(`✅ Consolidated PDF preview for SO: ${consolidatedData.soNumber}`);
  } catch (error) {
    console.error('❌ Error previewing consolidated PDF:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' 
        ? 'Failed to preview consolidated PDF' 
        : error.message
    });
  }
};

// ============================================
// PREVIEW SALES CHALLAN PDF (Opens in browser)
// ============================================
export const previewChallanPDF = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch complete challan data with all populated fields including customer address and category
    const challan = await SalesChallan.findById(id)
      .populate('customer', 'companyName gstNumber address')
      .populate({
        path: 'salesOrder',
        select: 'soNumber orderDate expectedDeliveryDate category',
        populate: {
          path: 'category',
          select: 'categoryName'
        }
      })
      .populate('items.product', 'productName');

    if (!challan) {
      return res.status(404).json({
        success: false,
        message: 'Sales challan not found'
      });
    }

    // Company information (your company - the sender)
    const companyInfo = {
      name: process.env.COMPANY_NAME || 'YarnFlow',
      address: process.env.COMPANY_ADDRESS || 'Business Address Line 1',
      city: process.env.COMPANY_CITY || 'City, State - 000000',
      phone: process.env.COMPANY_PHONE || '+91 00000 00000',
      email: process.env.COMPANY_EMAIL || 'info@yarnflow.com',
      gstin: process.env.COMPANY_GSTIN || 'GSTIN: 00XXXXX0000X0X0'
    };

    // Generate PDF buffer
    const pdfBuffer = await generateSalesChallanPDF(challan.toObject(), companyInfo);

    // Set response headers for inline display (preview in browser)
    const filename = `Sales_Challan_${challan.challanNumber}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);

    console.log(`PDF preview generated for challan: ${challan.challanNumber}`);

  } catch (error) {
    console.error('Error previewing challan PDF:', error);
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(500).json({
      success: false,
      message: 'Failed to preview PDF',
      error: isDevelopment ? error.message : 'Internal server error'
    });
  }
};
