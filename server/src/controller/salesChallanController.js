import mongoose from 'mongoose';
import SalesChallan from '../models/SalesChallan.js';
import SalesOrder from '../models/SalesOrder.js';
import InventoryLot from '../models/InventoryLot.js';
import Product from '../models/Product.js';
import CompanyProfile from '../models/CompanyProfile.js';
import WarehouseLocation from '../models/WarehouseLocation.js';
import { generateSalesChallanPDF, generateSalesOrderConsolidatedPDF } from '../utils/pdfGenerator.js';

// ============ HELPER: resolve legacy warehouse ObjectId refs to display names ============
// Some older InventoryLot records may have been saved with a raw WarehouseLocation _id
// (a form-wiring bug, now fixed at the source in grnController). Resolve defensively here
// so any pre-existing data still displays a friendly name instead of a raw ObjectId string.
const resolveWarehouseDisplayName = async (value, session) => {
  if (!value) return value;
  if (mongoose.Types.ObjectId.isValid(value)) {
    const wh = await WarehouseLocation.findById(value).session(session || null).select('name').lean();
    if (wh?.name) return wh.name;
  }
  return value;
};

// ============ HELPER: fetch active company profile ============
const getActiveCompanyProfile = async () => {
  let profile = await CompanyProfile.findOne({ isActive: true }).lean();
  console.log('[PDF] Company profile terms from DB:', JSON.stringify(profile?.challanTermsAndConditions));
  if (!profile) {
    // Return safe defaults if no profile configured yet
    profile = {
      companyName: process.env.COMPANY_NAME || 'Your Company Name',
      headOfficeAddress: process.env.COMPANY_ADDRESS || '',
      branchOfficeAddress: '',
      phone: process.env.COMPANY_PHONE || '',
      gstin: process.env.COMPANY_GSTIN || '',
      msmeNo: '',
      city: process.env.COMPANY_CITY || '',
      challanTermsAndConditions: [],
      challanFooterNote: 'Computer-generated delivery challan',
      signatureLabel: 'For'
    };
  }
  return profile;
};

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
// Uses MongoDB transactions for atomic operations ensuring data consistency
export const createSalesChallan = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const {
      salesOrder,
      expectedDeliveryDate,
      warehouseLocation,
      items,
      notes,
      createdBy
    } = req.body;
    
    // Validate required fields (before transaction work)
    if (!salesOrder) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Sales Order is required'
      });
    }

    // Warehouse is auto-derived from the inventory lot(s) that fulfill this order
    // (see stock-out loop below). Manual entry is still accepted for backward
    // compatibility / products without lot-level warehouse data, but no longer required.

    if (!items || items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }
    
    // Get SO details (within transaction)
    const so = await SalesOrder.findById(salesOrder)
      .populate('customer')
      .populate('items.product')
      .session(session);
    
    console.log('Sales Order found:', {
      id: so?._id,
      soNumber: so?.soNumber,
      customer: so?.customer,
      itemsCount: so?.items?.length
    });
    
    if (!so) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }
    
    if (!so.customer) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Sales order customer not found or not populated'
      });
    }
    
    // Prevent challan creation for Delivered or Cancelled SOs
    if (['Delivered', 'Cancelled'].includes(so.status)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Cannot create challan for delivered or cancelled sales order'
      });
    }
    
    // Validate dispatch quantities against remaining (ordered - already dispatched)
    const existingChallansForValidation = await SalesChallan.find({ salesOrder: so._id }).session(session);
    const dispatchedMapForValidation = {};
    existingChallansForValidation.forEach(ch => {
      ch.items.forEach(ci => {
        const k = ci.salesOrderItem.toString();
        dispatchedMapForValidation[k] = (dispatchedMapForValidation[k] || 0) + ci.dispatchQuantity;
      });
    });

    for (const item of items) {
      const soItem = so.items.find(si => si._id.toString() === item.salesOrderItem.toString());
      if (!soItem) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Item not found in sales order`
        });
      }

      const alreadyDispatched = dispatchedMapForValidation[item.salesOrderItem.toString()] || 0;
      const remainingQtyAllowed = soItem.quantity - alreadyDispatched;
      if (item.dispatchQuantity > remainingQtyAllowed) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Dispatch quantity for ${item.productName} exceeds remaining quantity (${remainingQtyAllowed} ${soItem.unit} remaining)`
        });
      }
    }

    // Auto-derive warehouse from the inventory lot(s) that will fulfill this order
    // (same product+category flow that was already used for GRN stock-in) instead of
    // requiring the user to manually pick a warehouse every time.
    let derivedWarehouseLocation = warehouseLocation || '';
    if (!derivedWarehouseLocation) {
      const derivedWarehouses = new Set();
      for (const item of items) {
        const soItemForWarehouse = so.items.find(si => si._id.toString() === item.salesOrderItem.toString());
        const wFilter = {
          product: item.product,
          status: 'Active',
          currentQuantity: { $gt: 0 }
        };
        if (soItemForWarehouse?.subProduct) wFilter.subProduct = soItemForWarehouse.subProduct;
        const fulfillingLot = await InventoryLot.findOne(wFilter).sort({ receivedDate: 1 }).session(session);
        if (fulfillingLot?.warehouse) {
          derivedWarehouses.add(await resolveWarehouseDisplayName(fulfillingLot.warehouse, session));
        }
      }
      derivedWarehouseLocation = [...derivedWarehouses].join(', ') || 'Main Warehouse';
    }

    // Prepare challan data
    const challanData = {
      salesOrder: so._id,
      soNumber: so.soNumber || `SO-${Date.now()}`,
      customer: so.customer._id,
      customerName: so.customer.companyName || so.customer.name || 'Unknown',
      warehouseLocation: derivedWarehouseLocation,
      expectedDeliveryDate: expectedDeliveryDate || null,
      items: items.map(item => {
        // Find corresponding SO item to get notes and sub-product details
        const soItem = so.items.find(si => si._id.toString() === item.salesOrderItem.toString());
        return {
          salesOrderItem: item.salesOrderItem,
          product: item.product,
          productName: item.productName,
          subProduct: soItem?.subProduct || item.subProduct || null,
          subProductName: soItem?.subProductName || item.subProductName || null,
          subProductWeights: Array.isArray(item.subProductWeights) ? item.subProductWeights : [],
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

    // Create challan (within transaction)
    const challan = new SalesChallan(challanData);

    try {
      await challan.save({ session });
      console.log('Challan saved successfully:', challan._id);
    } catch (saveError) {
      console.error('Challan save error:', saveError);
      console.error('Validation errors:', saveError.errors);
      throw saveError;
    }

    // Update SO dispatch status (like GRN updates PO receipt status)
    // Fetch all challans for this SO to calculate dispatch status (within transaction)
    const allChallans = await SalesChallan.find({ salesOrder: so._id }).session(session);
    so.updateDispatchStatus(allChallans);
    await so.save({ session });

    // Process Stock Out for inventory (following GRN pattern)
    // IMPORTANT: Only deduct stock when SO item is COMPLETE (like GRN only creates lots when PO item is complete)
    // Stock out happens ONLY when:
    // 1. Item is 100% dispatched (quantity fully dispatched), OR
    // 2. Item is manually marked as complete
    console.log(`\n🔄 Starting stock out processing for ${items.length} item(s)...`);
    
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
      // Include the SO item id so multi-sub-product orders don't collide on the same product+challan reference
      const challanNumbersStr = `${challansForThisItem.map(ch => ch.challanNumber).sort().join(', ')}|SOItem:${item.salesOrderItem}`;
      console.log(`   Looking for existing movement with reference: "${challanNumbersStr}"`);
      
      const existingMovement = await InventoryLot.findOne({
        product: item.product,
        'movements': {
          $elemMatch: {
            type: 'Issued',
            reference: challanNumbersStr
          }
        }
      }).session(session).lean();
      
      if (existingMovement) {
        console.log(`⏭️ Stock already deducted for this SO item (found movement with reference: ${challanNumbersStr})`);
        continue;
      }
      
      console.log(`   No existing movement found. Proceeding with stock deduction...`);
      
      let totalQtyToDeduct = 0;
      let totalWeightToDeduct = 0;
      
      // Calculate total quantity and weight to deduct from all challans.
      // For sub-product items, use the exact sum of subProductWeights (individual bag weights)
      // as the authoritative weight — never rely on the stored weight field which may differ
      // due to legacy data or rounding.
      for (const challanToProcess of challansForThisItem) {
        const challanItem = challanToProcess.items.find(i => i.salesOrderItem.toString() === item.salesOrderItem.toString());
        if (challanItem) {
          totalQtyToDeduct += challanItem.dispatchQuantity;
          const exactWeight = Array.isArray(challanItem.subProductWeights) && challanItem.subProductWeights.length > 0
            ? challanItem.subProductWeights.reduce((s, w) => s + (Number(w) || 0), 0)
            : (challanItem.weight || 0);
          totalWeightToDeduct += exactWeight;
        }
      }
      
      console.log(`📊 Total to deduct: ${totalQtyToDeduct} ${item.unit}, ${totalWeightToDeduct.toFixed(2)} kg`);
      
      // Find available inventory lots for this product (FIFO - First In First Out) - within transaction
      // Restrict by sub-product if the sales order item specifies one
      const currentSOItem = so.items.find(si => si._id.toString() === item.salesOrderItem.toString());
      const lotFilter = {
        product: item.product,
        status: 'Active',
        currentQuantity: { $gt: 0 }
      };
      if (currentSOItem?.subProduct) {
        lotFilter.subProduct = currentSOItem.subProduct;
      }
      const lots = await InventoryLot.find(lotFilter).sort({ receivedDate: 1 }).session(session); // FIFO: oldest first

      if (lots.length === 0) {
        console.warn(`⚠️ No inventory lots found for ${item.productName}`);
        continue;
      }

      // Calculate available quantity and weight to enforce non-negative inventory
      // Production note: when a lot tracks individual per-unit weights (subProductWeights),
      // use the REAL sum of those entries instead of an average — this is the source of truth.
      const availableQty = lots.reduce((sum, lot) => sum + (lot.currentQuantity - (lot.reservedQuantity || 0)), 0);
      const availableWeight = lots.reduce((sum, lot) => {
        if (Array.isArray(lot.subProductWeights) && lot.subProductWeights.length > 0) {
          return sum + lot.subProductWeights.reduce((s, w) => s + (Number(w) || 0), 0);
        }
        const weightPerUnit = lot.receivedQuantity > 0 ? (lot.totalWeight || 0) / lot.receivedQuantity : 0;
        return sum + (lot.currentQuantity - (lot.reservedQuantity || 0)) * weightPerUnit;
      }, 0);

      if (totalQtyToDeduct > availableQty) {
        const err = new Error(`Insufficient stock for ${item.productName}. Available: ${availableQty} ${item.unit}, Required: ${totalQtyToDeduct} ${item.unit}`);
        err.statusCode = 400;
        throw err;
      }
      if (totalWeightToDeduct > availableWeight) {
        const err = new Error(`Insufficient weight for ${item.productName}. Available: ${availableWeight.toFixed(2)} kg, Required: ${totalWeightToDeduct.toFixed(2)} kg`);
        err.statusCode = 400;
        throw err;
      }

      let remainingQty = totalQtyToDeduct;
      let remainingWeight = totalWeightToDeduct;
      const lotsUpdated = [];

      // Deduct from lots using FIFO (following GRN pattern) - within transaction
      // Production fix: when a lot tracks individual per-unit weights (subProductWeights),
      // remove the EXACT weight entries for each unit consumed instead of an average split.
      // This ensures inventory always reflects the real physical weight of each roll/bag,
      // never a mathematically-averaged approximation.
      for (const lot of lots) {
        if (remainingQty <= 0) break;

        const lotAvailableQty = lot.currentQuantity - (lot.reservedQuantity || 0);
        if (lotAvailableQty <= 0) continue;

        let qtyToDeduct = 0;
        let weightToDeduct = 0;
        const lotHasIndividualWeights = Array.isArray(lot.subProductWeights) && lot.subProductWeights.length > 0;

        if (lotHasIndividualWeights) {
          // Exact deduction: consume the oldest recorded individual weight entries first
          const unitsToTake = Math.min(remainingQty, lot.subProductWeights.length, lotAvailableQty);
          const remainingWeights = [...lot.subProductWeights];
          for (let i = 0; i < unitsToTake; i++) {
            const w = Number(remainingWeights.shift()) || 0;
            weightToDeduct += w;
            qtyToDeduct += 1;
          }
          lot.subProductWeights = remainingWeights;
        } else {
          // Legacy / no individual weight data: proportional average (only path for non-subproduct products)
          qtyToDeduct = Math.min(remainingQty, lotAvailableQty);
          const weightPerUnit = lot.receivedQuantity > 0 ? (lot.totalWeight || 0) / lot.receivedQuantity : 0;
          weightToDeduct = qtyToDeduct * weightPerUnit;
        }

        if (qtyToDeduct <= 0) continue;

        // Update lot quantities (similar to GRN updating inventory)
        lot.currentQuantity -= qtyToDeduct;
        lot.totalWeight = Math.max(0, (lot.totalWeight || 0) - weightToDeduct);

        // Add movement record with weight for ALL challans (not just current one)
        // Reference all challan numbers that contributed to this deduction, scoped to the SO item
        const challanRefs = challansForThisItem.map(ch => ch.challanNumber).join(', ');
        lot.movements.push({
          type: 'Issued',
          quantity: qtyToDeduct,
          weight: weightToDeduct,
          date: new Date(),
          reference: challanNumbersStr,
          notes: `Stock out for Sales Challan(s): ${challanRefs} (SO Item Completed)`,
          performedBy: createdBy || 'Admin'
        });

        // Update status if fully consumed
        if (lot.currentQuantity === 0) {
          lot.status = 'Consumed';
        }

        await lot.save({ session });
        lotsUpdated.push({ lotNumber: lot.lotNumber, quantity: qtyToDeduct, weight: weightToDeduct });
        remainingQty -= qtyToDeduct;
        remainingWeight -= weightToDeduct;

        console.log(`📦 Deducted ${qtyToDeduct} ${item.unit} (${weightToDeduct.toFixed(2)} kg) of ${item.productName} from lot ${lot.lotNumber}${lotHasIndividualWeights ? ' [exact weights]' : ' [avg]'}`);
      }

      // Update product inventory (following GRN pattern) - within transaction
      if (lotsUpdated.length > 0) {
        const totalDeducted = lotsUpdated.reduce((sum, l) => sum + l.quantity, 0);
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { 'inventory.currentStock': -totalDeducted } },
          { session }
        );
      }

      if (remainingQty > 0) {
        console.warn(`⚠️ Insufficient stock for ${item.productName}. Short by ${remainingQty} ${item.unit}`);
        const err = new Error(`Insufficient stock for ${item.productName}. Short by ${remainingQty} ${item.unit}`);
        err.statusCode = 400;
        throw err;
      }
    }

    console.log(`✅ Stock out processed for challan ${challan.challanNumber}`);
    
    // Commit the transaction - all operations succeeded
    await session.commitTransaction();
    console.log('✅ Transaction committed successfully');

    // Populate challan before returning (outside transaction)
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
    // Abort transaction on any error
    await session.abortTransaction();
    console.error('❌ Transaction aborted - Error creating sales challan:', error);
    
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
    
    // Return 400 for client-side validation errors (insufficient stock/weight)
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create sales challan',
      error: error.message
    });
  } finally {
    // Always end the session
    session.endSession();
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

    // Fetch live company profile from DB
    const companyInfo = await getActiveCompanyProfile();

    // Generate PDF buffer (resolve any legacy raw warehouse ObjectId to a display name)
    const challanForPdf = {
      ...challan.toObject(),
      warehouseLocation: await resolveWarehouseDisplayName(challan.warehouseLocation)
    };
    const pdfBuffer = await generateSalesChallanPDF(challanForPdf, companyInfo);

    // Set response headers for PDF download
    const rawCustomerName = challan.customerDetails?.companyName || challan.customer?.companyName || 'Customer';
    const safeCustomer = rawCustomerName.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_').slice(0, 40);
    const filename = `Challan_${safeCustomer}_${challan.challanNumber}.pdf`;
    
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

    // Fetch live company profile from DB
    const companyInfo = await getActiveCompanyProfile();

    // Consolidate all challan data (resolve any legacy raw warehouse ObjectIds to display names)
    const rawWarehouses = [...new Set(challans.map(c => c.warehouseLocation).filter(Boolean))];
    const resolvedWarehouses = await Promise.all(rawWarehouses.map(w => resolveWarehouseDisplayName(w)));
    const consolidatedData = {
      salesOrder: challans[0].salesOrder,
      customer: challans[0].customer,
      customerDetails: challans[0].customerDetails,
      challans: challans,
      soNumber: challans[0].soReference || challans[0].salesOrder?.soNumber,
      totalChallans: challans.length,
      warehouseLocation: [...new Set(resolvedWarehouses)].join(', ')
    };

    // Generate consolidated PDF buffer
    const pdfBuffer = await generateSalesOrderConsolidatedPDF(consolidatedData, companyInfo);

    // Set response headers for download
    const rawCustName = consolidatedData.customerDetails?.companyName || consolidatedData.customer?.companyName || 'Customer';
    const safeCustName = rawCustName.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_').slice(0, 40);
    const filename = `Consolidated_${safeCustName}_${consolidatedData.soNumber}.pdf`;
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

    // Fetch live company profile from DB
    const companyInfo = await getActiveCompanyProfile();

    // Consolidate data (resolve any legacy raw warehouse ObjectIds to display names)
    const rawWarehouses = [...new Set(challans.map(c => c.warehouseLocation).filter(Boolean))];
    const resolvedWarehouses = await Promise.all(rawWarehouses.map(w => resolveWarehouseDisplayName(w)));
    const consolidatedData = {
      salesOrder: challans[0].salesOrder,
      customer: challans[0].customer,
      customerDetails: challans[0].customerDetails,
      challans: challans,
      soNumber: challans[0].soReference || challans[0].salesOrder?.soNumber,
      totalChallans: challans.length,
      warehouseLocation: [...new Set(resolvedWarehouses)].join(', ')
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

    // Fetch live company profile from DB
    const companyInfo = await getActiveCompanyProfile();

    // Generate PDF buffer (resolve any legacy raw warehouse ObjectId to a display name)
    const challanForPdf = {
      ...challan.toObject(),
      warehouseLocation: await resolveWarehouseDisplayName(challan.warehouseLocation)
    };
    const pdfBuffer = await generateSalesChallanPDF(challanForPdf, companyInfo);

    // Set response headers for inline display (preview in browser)
    const rawCustomerNameP = challan.customerDetails?.companyName || challan.customer?.companyName || 'Customer';
    const safeCustomerP = rawCustomerNameP.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_').slice(0, 40);
    const filename = `Challan_${safeCustomerP}_${challan.challanNumber}.pdf`;
    
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
