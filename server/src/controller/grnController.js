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
      .populate('supplier', 'companyName gstNumber')
      .populate({
        path: 'purchaseOrder',
        select: 'poNumber orderDate expectedDeliveryDate category items',
        populate: [
          {
            path: 'category',
            select: 'categoryName name'
          },
          {
            path: 'items.product',
            select: 'productName productCode category',
            populate: {
              path: 'category',
              select: 'categoryName name'
            }
          }
        ]
      })
      .populate({
        path: 'items.product',
        select: 'productName productCode specifications category',
        populate: {
          path: 'category',
          select: 'categoryName name'
        }
      })
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
      .populate('supplier', 'companyName gstNumber')
      .populate('purchaseOrder', 'poNumber orderDate expectedDeliveryDate items')
      .populate('items.product', 'productName');
    
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
        notes: item.notes || '',
        // Manual completion support
        manuallyCompleted: item.markAsComplete || false,
        completionReason: item.markAsComplete ? 'Marked as complete by user (losses/damages accepted)' : '',
        completedAt: item.markAsComplete ? new Date() : null
      });
      
      // Log what we're storing
      console.log(`📝 GRN Item ${item.productName}:`, {
        markAsComplete: item.markAsComplete,
        manuallyCompleted: item.markAsComplete || false,
        receivedQuantity: item.receivedQuantity,
        orderedQuantity: item.orderedQuantity
      });
    }
    
    // Calculate receipt status (consider manual completion)
    const allItemsComplete = validatedItems.every(item => 
      item.pendingQuantity === 0 || item.manuallyCompleted
    );
    const anyItemReceived = validatedItems.some(item => 
      item.receivedQuantity > 0 || item.manuallyCompleted
    );
    
    console.log(`📊 GRN Status Calculation:`);
    console.log(`   allItemsComplete: ${allItemsComplete}`);
    console.log(`   anyItemReceived: ${anyItemReceived}`);
    validatedItems.forEach(item => {
      console.log(`   - ${item.productName}: pending=${item.pendingQuantity}, manuallyCompleted=${item.manuallyCompleted}`);
    });
    
    let receiptStatus = 'Pending';
    if (allItemsComplete && anyItemReceived) {
      receiptStatus = 'Complete';
      console.log(`✅ GRN Status: Complete`);
    } else if (anyItemReceived) {
      receiptStatus = 'Partial';
      console.log(`⚠️  GRN Status: Partial`);
    } else {
      console.log(`ℹ️  GRN Status: Pending`);
    }
    
    const isPartialReceipt = validatedItems.some(item => 
      !item.manuallyCompleted && (item.previouslyReceived > 0 || item.pendingQuantity > 0)
    );
    
    // Create GRN
    // Set status based on receipt completion
    // Note: GRN status enum values are: Draft, Received, Under_Review, Approved, Rejected, Completed
    const grnStatus = receiptStatus === 'Complete' ? 'Completed' : (anyItemReceived ? 'Received' : 'Draft');
    // Only approve if receiptStatus is Complete (all items complete)
    const approvalStatus = receiptStatus === 'Complete' ? 'Approved' : 'Pending';
    
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
      isPartialReceipt,
      status: grnStatus,
      approvalStatus: approvalStatus,
      approvedBy: receiptStatus === 'Complete' ? createdBy : undefined,
      approvedDate: receiptStatus === 'Complete' ? new Date() : undefined
    });
    
    await grn.save();
    
    // Update PO with received quantities and manual completion flags FIRST
    for (const grnItem of grn.items) {
      const poItem = purchaseOrder.items.find(pi => pi._id.toString() === grnItem.purchaseOrderItem.toString());
      if (poItem) {
        // Update received quantities
        poItem.receivedQuantity = (poItem.receivedQuantity || 0) + grnItem.receivedQuantity;
        poItem.receivedWeight = (poItem.receivedWeight || 0) + grnItem.receivedWeight;
        
        // Mark as manually completed if user checked the box (BEFORE updateReceiptStatus)
        if (grnItem.manuallyCompleted) {
          console.log(`✅ Marking PO item as manually completed: ${poItem.productName}`);
          poItem.manuallyCompleted = true;
          poItem.completionReason = grnItem.completionReason;
          poItem.completedAt = grnItem.completedAt;
        } else {
          console.log(`ℹ️  PO item NOT manually completed: ${poItem.productName}, flag: ${grnItem.manuallyCompleted}`);
        }
      }
    }
    
    // Update PO receipt status (this will calculate pending and status based on manuallyCompleted flag)
    await purchaseOrder.updateReceiptStatus();
    console.log(`📦 PO Status after update: ${purchaseOrder.status}`);
    console.log(`📦 PO Completion: ${purchaseOrder.completionPercentage}%`);
    console.log(`📦 PO Items:`, purchaseOrder.items.map(i => ({
      name: i.productName,
      status: i.receiptStatus,
      manuallyCompleted: i.manuallyCompleted,
      received: i.receivedQuantity,
      pending: i.pendingQuantity
    })));
    
    // Direct database update to force changes (bypass Mongoose save issues)
    await PurchaseOrder.updateOne(
      { _id: purchaseOrder._id },
      {
        $set: {
          status: purchaseOrder.status,
          completionPercentage: purchaseOrder.completionPercentage,
          items: purchaseOrder.items.map(item => ({
            ...item.toObject(),
            receiptStatus: item.receiptStatus,
            pendingQuantity: item.manuallyCompleted ? 0 : item.pendingQuantity,
            pendingWeight: item.manuallyCompleted ? 0 : item.pendingWeight
          }))
        }
      }
    );
    console.log(`💾 PO saved successfully (direct update)`);
    
    // Verify the save by re-fetching from database
    const verifyPO = await PurchaseOrder.findById(purchaseOrder._id);
    console.log(`🔍 Verification - PO from DB:`);
    console.log(`   Status: ${verifyPO.status}`);
    console.log(`   Items:`, verifyPO.items.map(i => ({
      name: i.productName,
      status: i.receiptStatus,
      manuallyCompleted: i.manuallyCompleted,
      received: i.receivedQuantity,
      pending: i.pendingQuantity
    })));
    
    // Create inventory lots for completed items
    // When an item becomes complete, create lots for ALL GRNs (including previous partial ones)
    const inventoryLots = [];
    for (const item of grn.items) {
      // Check if this specific item is now complete
      const isItemComplete = item.manuallyCompleted || item.pendingQuantity === 0;
      
      if (isItemComplete && item.receivedQuantity > 0) {
        const product = await Product.findById(item.product);
        
        // Find all previous GRNs for this PO and product that don't have inventory lots yet
        const previousGRNs = await GoodsReceiptNote.find({
          purchaseOrder: grn.purchaseOrder,
          'items.product': item.product,
          _id: { $ne: grn._id } // Exclude current GRN
        }).sort({ createdAt: 1 });
        
        // Create lots for previous GRNs first
        for (const prevGRN of previousGRNs) {
          const prevItem = prevGRN.items.find(i => i.product.toString() === item.product.toString());
          if (prevItem && prevItem.receivedQuantity > 0) {
            // Check if lot already exists for this GRN and product
            const existingLot = await InventoryLot.findOne({
              grn: prevGRN._id,
              product: item.product
            });
            
            if (!existingLot) {
              const prevLot = new InventoryLot({
                grn: prevGRN._id,
                grnNumber: prevGRN.grnNumber,
                purchaseOrder: prevGRN.purchaseOrder,
                poNumber: prevGRN.poNumber,
                product: item.product,
                productName: product.productName,
                category: product.category,
                supplier: prevGRN.supplier,
                supplierName: prevGRN.supplierDetails?.companyName || grn.supplierDetails.companyName,
                supplierBatchNumber: prevItem.batchNumber,
                specifications: prevItem.specifications,
                receivedQuantity: prevItem.receivedQuantity,
                currentQuantity: prevItem.receivedQuantity,
                unit: prevItem.unit,
                totalWeight: prevItem.receivedWeight || 0,
                qualityStatus: 'Approved',
                qualityNotes: 'Auto-approved (Item Completed in Later GRN)',
                warehouse: prevGRN.warehouseLocation || prevItem.warehouseLocation || undefined,
                receivedDate: prevGRN.receiptDate,
                expiryDate: prevItem.expiryDate,
                unitCost: prevItem.unitPrice,
                notes: 'Auto-approved when item was completed',
                createdBy: 'System'
              });
              
              prevLot.movements.push({
                type: 'Received',
                quantity: prevItem.receivedQuantity,
                date: prevGRN.receiptDate,
                reference: prevGRN.grnNumber,
                notes: `Received via GRN ${prevGRN.grnNumber}`,
                performedBy: 'System'
              });
              
              await prevLot.save();
              inventoryLots.push(prevLot);
              console.log(`📦 Created inventory lot for previous GRN ${prevGRN.grnNumber}: ${prevItem.receivedQuantity} ${prevItem.unit}`);
              
              // Update product inventory for previous GRN
              await Product.findByIdAndUpdate(
                item.product,
                { $inc: { 'inventory.currentStock': prevItem.receivedQuantity } }
              );
              
              // Update previous GRN status to Completed
              await GoodsReceiptNote.findByIdAndUpdate(prevGRN._id, {
                status: 'Completed',
                approvalStatus: 'Approved',
                approvedBy: createdBy,
                approvedDate: new Date()
              });
              console.log(`✅ Updated GRN ${prevGRN.grnNumber} status to Completed`);
            }
          }
        }
        
        // Now create lot for current GRN
        // Debug warehouse location
        console.log(`📍 Warehouse for ${item.productName}:`, {
          grnWarehouse: grn.warehouseLocation,
          itemWarehouse: item.warehouseLocation,
          final: grn.warehouseLocation || item.warehouseLocation || undefined
        });
        
        const lot = new InventoryLot({
          grn: grn._id,
          grnNumber: grn.grnNumber,
          purchaseOrder: grn.purchaseOrder,
          poNumber: grn.poNumber,
          product: item.product,
          productName: product.productName,
          category: product.category,
          supplier: grn.supplier,
          supplierName: grn.supplierDetails.companyName,
          supplierBatchNumber: item.batchNumber,
          specifications: item.specifications,
          receivedQuantity: item.receivedQuantity,
          currentQuantity: item.receivedQuantity,
          unit: item.unit,
          totalWeight: item.receivedWeight || 0,
          qualityStatus: 'Approved',
          qualityNotes: item.manuallyCompleted 
            ? 'Auto-approved (Manually Completed)' 
            : 'Auto-approved (Item Fully Received)',
          warehouse: grn.warehouseLocation || item.warehouseLocation || undefined,
          receivedDate: grn.receiptDate,
          expiryDate: item.expiryDate,
          unitCost: item.unitPrice,
          notes: item.manuallyCompleted 
            ? `Manually completed - ${item.completionReason}` 
            : 'Auto-approved - Item fully received',
          createdBy: 'System'
        });
        
        // Add initial movement record
        lot.movements.push({
          type: 'Received',
          quantity: item.receivedQuantity,
          date: grn.receiptDate,
          reference: grn.grnNumber,
          notes: item.manuallyCompleted 
            ? `Received via GRN ${grn.grnNumber} (Manually Completed)`
            : `Received via GRN ${grn.grnNumber}`,
          performedBy: createdBy || 'System'
        });
        
        await lot.save();
        inventoryLots.push(lot);
        console.log(`📦 Created inventory lot for ${item.productName}: ${item.receivedQuantity} ${item.unit}`);
        console.log(`✅ Lot saved with warehouse: ${lot.warehouse} (LotNumber: ${lot.lotNumber})`);
        
        // Update product inventory
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { 'inventory.currentStock': item.receivedQuantity } }
        );
      }
    }
    
    if (inventoryLots.length > 0) {
      console.log(`✅ Created ${inventoryLots.length} inventory lot(s) for manually completed items`);
    }
    
    // Populate the saved GRN for response
    const populatedGRN = await GoodsReceiptNote.findById(grn._id)
      .populate('supplier', 'companyName gstNumber')
      .populate('purchaseOrder', 'poNumber orderDate expectedDeliveryDate')
      .populate('items.product', 'productName');
    
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
    .populate('supplier', 'companyName gstNumber')
    .populate('purchaseOrder', 'poNumber orderDate expectedDeliveryDate')
    .populate('items.product', 'productName');
    
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
    .populate('supplier', 'companyName gstNumber');
    
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
    
    // Create inventory lots for approved items OR manually completed items
    const inventoryLots = [];
    for (const item of grn.items) {
      // Create inventory lot if:
      // 1. Quality is approved AND has accepted quantity, OR
      // 2. Item is manually completed (auto-approve)
      const shouldCreateLot = (item.qualityStatus === 'Approved' && item.acceptedQuantity > 0) ||
                              (item.manuallyCompleted && item.receivedQuantity > 0);
      
      if (shouldCreateLot) {
        const lotQuantity = item.manuallyCompleted ? item.receivedQuantity : item.acceptedQuantity;
        const lotWeight = item.manuallyCompleted ? item.receivedWeight : item.acceptedWeight;
        const lot = new InventoryLot({
          grn: grn._id,
          grnNumber: grn.grnNumber,
          purchaseOrder: grn.purchaseOrder,
          poNumber: grn.poNumber,
          product: item.product._id,
          productName: item.productName,
          category: item.product.category,
          supplier: grn.supplier._id,
          supplierName: grn.supplierDetails.companyName,
          supplierBatchNumber: item.batchNumber,
          specifications: item.specifications,
          receivedQuantity: lotQuantity,
          currentQuantity: lotQuantity,
          unit: item.unit,
          totalWeight: lotWeight || 0,
          qualityStatus: 'Approved',
          qualityNotes: item.manuallyCompleted ? 'Auto-approved (Manually Completed)' : item.qualityNotes,
          warehouse: grn.warehouseLocation || item.warehouseLocation || undefined,
          receivedDate: grn.receiptDate,
          expiryDate: item.expiryDate,
          unitCost: item.unitPrice,
          notes: item.manuallyCompleted ? `Manually completed - ${item.completionReason}` : item.notes,
          createdBy: approvedBy || 'System'
        });
        
        // Add initial movement record
        lot.movements.push({
          type: 'Received',
          quantity: lotQuantity,
          date: grn.receiptDate,
          reference: grn.grnNumber,
          notes: item.manuallyCompleted 
            ? `Received via GRN ${grn.grnNumber} (Manually Completed)`
            : `Received via GRN ${grn.grnNumber}`,
          performedBy: approvedBy || 'System'
        });
        
        await lot.save();
        inventoryLots.push(lot);
        console.log(`📦 Created inventory lot for ${item.productName}: ${lotQuantity} ${item.unit}`);
        
        // Update product inventory
        // Note: Product inventory tracking removed - use InventoryLot aggregation instead
      }
    }
    
    const populatedGRN = await GoodsReceiptNote.findById(grn._id)
      .populate('supplier', 'companyName gstNumber')
      .populate('purchaseOrder', 'poNumber orderDate expectedDeliveryDate')
      .populate('items.product', 'productName');
    
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
      .populate('supplier', 'companyName gstNumber')
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

// ============ MANUAL COMPLETION CONTROLLER ============

// Mark GRN item as manually completed (even if qty doesn't match)
export const markItemAsComplete = async (req, res) => {
  try {
    const { grnId } = req.params;
    const { itemId, reason } = req.body;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Item ID is required'
      });
    }

    // Find the GRN
    const grn = await GoodsReceiptNote.findById(grnId);
    if (!grn) {
      return res.status(404).json({
        success: false,
        message: 'GRN not found'
      });
    }

    // Find the item in GRN
    const item = grn.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in GRN'
      });
    }

    // Mark as manually completed
    item.manuallyCompleted = true;
    item.completionReason = reason || 'Manually marked as complete';
    item.completedAt = new Date();

    // Save the GRN
    await grn.save();

    // Recalculate GRN receipt status
    const allItemsComplete = grn.items.every(item => {
      if (item.manuallyCompleted) return true;
      const pending = (item.orderedQuantity || 0) - ((item.previouslyReceived || 0) + item.receivedQuantity);
      return pending <= 0;
    });

    if (allItemsComplete) {
      grn.receiptStatus = 'Complete';
    } else {
      const anyReceived = grn.items.some(item => item.receivedQuantity > 0 || item.manuallyCompleted);
      grn.receiptStatus = anyReceived ? 'Partial' : 'Pending';
    }

    await grn.save();

    res.status(200).json({
      success: true,
      message: 'Item marked as complete',
      data: grn
    });
  } catch (error) {
    console.error('Error marking item as complete:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark item as complete',
      error: error.message
    });
  }
};
