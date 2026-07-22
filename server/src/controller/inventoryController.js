import InventoryLot from '../models/InventoryLot.js';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';
import SalesChallan from '../models/SalesChallan.js';
import GoodsReceiptNote from '../models/GoodsReceiptNote.js';
import { validationResult } from 'express-validator';

// ============ INVENTORY CONTROLLER ============
// Single source of truth for inventory data
// Shows both Stock In (GRN) and Stock Out (Sales Challan)

// Get inventory products with both Stock In and Stock Out data
export const getInventoryProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      sortBy = 'productName',
      sortOrder = 'asc',
      flat = 'false'
    } = req.query;
    console.log('search field',search);
    console.log('📊 Fetching inventory products:', { page, limit, search, category, sortBy, sortOrder });

    // Get all inventory lots (single source of truth)
    let inventoryLots = await InventoryLot.find({
      status: { $in: ['Active', 'Consumed'] }
    })
      .populate('product', 'productName productCode category')
      .populate('supplier', 'companyName')
      .populate({
        path: 'product',
        populate: {
          path: 'category',
          select: 'categoryName'
        }
      })
      .lean();
    console.log('invetory lots',inventoryLots);
    console.log(`📦 Found ${inventoryLots.length} inventory lots`);

    // Aggregate by product only (not per sub-product)
    // Each product appears once in the list; sub-product breakdown is inside subProducts[]
    const productAggregation = {};
    
    inventoryLots.forEach(lot => {
      if (!lot.product || !lot.product._id) return;
      
      const productKey = lot.product._id.toString();
      const subProductId = lot.subProduct ? lot.subProduct.toString() : null;
      
      if (!productAggregation[productKey]) {
        productAggregation[productKey] = {
          productId: lot.product._id,
          productName: lot.product.productName || 'Unknown Product',
          displayName: lot.product.productName || 'Unknown Product',
          categoryName: lot.product.category?.categoryName || 'Uncategorized',
          categoryId: lot.product.category?._id,
          productCode: lot.product.productCode || '',
          unit: lot.unit || 'Units',
          currentStock: 0,
          receivedStock: 0,
          issuedStock: 0,
          currentWeight: 0,
          receivedWeight: 0,
          issuedWeight: 0,
          hasSubProducts: false,
          subProductCount: 0,
          suppliers: new Set(),
          lots: [],
          latestReceiptDate: null
        };
      }
      
      const agg = productAggregation[productKey];
      
      // Aggregate quantities
      agg.currentStock += lot.currentQuantity || 0;
      agg.receivedStock += lot.receivedQuantity || 0;
      
      // Aggregate weights — use movement history as source of truth.
      // lot.totalWeight is mutable (decremented on stock-out) so it cannot be used for STOCK IN.
      // The Received movements hold the original weight at time of GRN and are never modified.
      const lotReceivedWeight = lot.movements
        ?.filter(m => m.type === 'Received')
        .reduce((sum, m) => sum + (m.weight || 0), 0) || lot.totalWeight || 0;
      agg.receivedWeight += lotReceivedWeight;
      
      // Calculate issued quantity and weight from movements
      const issuedQty = lot.movements
        ?.filter(m => m.type === 'Issued')
        .reduce((sum, m) => sum + (m.quantity || 0), 0) || 0;
      agg.issuedStock += issuedQty;
      
      const issuedWeight = lot.movements
        ?.filter(m => m.type === 'Issued')
        .reduce((sum, m) => sum + (m.weight || 0), 0) || 0;
      agg.issuedWeight += issuedWeight;
      
      // Current weight = original received weight - issued weight
      agg.currentWeight = agg.receivedWeight - agg.issuedWeight;
      
      // Track whether this product has any sub-products
      if (subProductId) {
        agg.hasSubProducts = true;
      }
      
      // Track supplier
      if (lot.supplier?.companyName) {
        agg.suppliers.add(lot.supplier.companyName);
      }
      
      // Add lot detail
      agg.lots.push({
        lotNumber: lot.lotNumber,
        lotId: lot._id,
        grnNumber: lot.grnNumber,
        receivedQuantity: lot.receivedQuantity,
        currentQuantity: lot.currentQuantity,
        issuedQuantity: issuedQty,
        status: lot.status,
        receivedDate: lot.receivedDate,
        supplierName: lot.supplierName || 'Unknown',
        warehouse: lot.warehouse,
        subProductId: lot.subProduct || null,
        subProductName: lot.subProductName || null,
        subProductWeights: lot.subProductWeights || [],
        movements: lot.movements || []
      });
      
      // Track latest receipt date
      if (lot.receivedDate) {
        if (!agg.latestReceiptDate || 
            new Date(lot.receivedDate) > new Date(agg.latestReceiptDate)) {
          agg.latestReceiptDate = lot.receivedDate;
        }
      }
    });

    // Compute distinct sub-product count per product
    Object.values(productAggregation).forEach(agg => {
      const subProductIds = new Set(
        agg.lots.filter(l => l.subProductId).map(l => l.subProductId.toString())
      );
      agg.subProductCount = subProductIds.size;
    });


    console.log('aggregation product list',productAggregation)
    // Convert to array
    let products = Object.values(productAggregation).map(product => {
      const supplierList = Array.from(product.suppliers);
      
      return {
        productId: product.productId,
        productName: product.productName,
        displayName: product.displayName,
        categoryName: product.categoryName,
        categoryId: product.categoryId,
        productCode: product.productCode,
        unit: product.unit,
        currentStock: product.currentStock,
        receivedStock: product.receivedStock,
        issuedStock: product.issuedStock,
        totalStock: product.currentStock,
        currentWeight: product.currentWeight,
        receivedWeight: product.receivedWeight,
        issuedWeight: product.issuedWeight,
        totalWeight: product.currentWeight,
        hasSubProducts: product.hasSubProducts,
        subProductCount: product.subProductCount,
        suppliers: supplierList,
        supplierNames: supplierList.join(', '),
        lotCount: product.lots.length,
        lots: product.lots.sort((a, b) => new Date(b.receivedDate) - new Date(a.receivedDate)),
        latestReceiptDate: product.latestReceiptDate
      };
    });
    
    console.log(`✅ Total products with stock: ${products.length}`);
    // console.log('product list data',products)

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(p => 
        p.productName.toLowerCase().includes(searchLower) ||
        p.productCode.toLowerCase().includes(searchLower) ||
        p.supplierNames.toLowerCase().includes(searchLower)
      );
    }
    
    if (category) {
      products = products.filter(p => p.categoryId?.toString() === category);
    }

    // Sort products alphabetically by default (or by explicit sort parameter)
    const order = sortOrder === 'desc' ? -1 : 1;
    products.sort((a, b) => {
      if (sortBy === 'latestReceiptDate') {
        const dateA = a.latestReceiptDate ? new Date(a.latestReceiptDate) : new Date(0);
        const dateB = b.latestReceiptDate ? new Date(b.latestReceiptDate) : new Date(0);
        return (dateB - dateA) * order;
      }
      return a.productName?.localeCompare(b.productName || '') * order;
    });

    // Group products by category
    const groupedByCategory = {};
    
    products.forEach(product => {
      const categoryKey = product.categoryId?.toString() || 'uncategorized';
      const categoryName = product.categoryName || 'Uncategorized';
      
      if (!groupedByCategory[categoryKey]) {
        groupedByCategory[categoryKey] = {
          categoryId: product.categoryId,
          categoryName: categoryName,
          products: [],
          totalProducts: 0
        };
      }
      
      groupedByCategory[categoryKey].products.push(product);
      groupedByCategory[categoryKey].totalProducts++;
    });

    // Convert to array and sort categories by name
    let categorizedProducts = Object.values(groupedByCategory);
    console.log('categorized products 1' ,categorizedProducts);

    categorizedProducts.sort((a, b) => 
      a.categoryName.localeCompare(b.categoryName)
    );

    console.log('categorized products 2',categorizedProducts);


    // Calculate totals
    const totalProducts = products.length;
    const totalCategories = categorizedProducts.length;

    const isFlat = flat === 'true';
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (isFlat) {
      // Return a flat paginated product list (useful for dropdowns)
      const paginatedProducts = products.slice(skip, skip + parseInt(limit));
      res.json({
        success: true,
        data: paginatedProducts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(totalProducts / parseInt(limit)),
          total: totalProducts,
          totalProducts,
          limit: parseInt(limit)
        }
      });
      return;
    }

    // Apply pagination to categories (not individual products)
    const paginatedCategories = categorizedProducts.slice(skip, skip + parseInt(limit));

    console.log('paginatedCategorized',paginatedCategories);
    res.json({
      success: true,
      data: paginatedCategories,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(totalCategories / parseInt(limit)),
        total: totalCategories,
        totalProducts: totalProducts,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching inventory products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory products',
      error: error.message
    });
  }
};

// Get all inventory lots with filtering and pagination
export const getAllInventoryLots = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      product,
      subProduct,
      supplier,
      warehouse,
      qualityStatus,
      productCategory,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    // Search across multiple fields
    if (search) {
      filter.$or = [
        { lotNumber: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { supplierName: { $regex: search, $options: 'i' } },
        { grnNumber: { $regex: search, $options: 'i' } },
        { poNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply filters
    if (status) filter.status = status;
    if (product) filter.product = product;
    if (subProduct) filter.subProduct = subProduct;
    if (supplier) filter.supplier = supplier;
    if (warehouse) filter.warehouse = { $regex: warehouse, $options: 'i' };
    if (qualityStatus) filter.qualityStatus = qualityStatus;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Get lots with population
    let query = InventoryLot.find(filter)
      .populate('product', 'name code category')
      .populate('supplier', 'companyName contactPerson')
      .populate('grn', 'grnNumber receiptDate')
      .populate('purchaseOrder', 'poNumber orderDate')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const lots = await query;

    // Filter by product category after population (if needed)
    let filteredLots = lots;
    if (productCategory) {
      filteredLots = lots.filter(lot => 
        lot.product && lot.product.category && 
        lot.product.category.toString() === productCategory
      );
    }

    // Get total count for pagination
    let total = await InventoryLot.countDocuments(filter);
    
    // If filtering by category, we need to count differently
    if (productCategory) {
      const allLots = await InventoryLot.find(filter).populate('product', 'category');
      total = allLots.filter(lot => 
        lot.product && lot.product.category && 
        lot.product.category.toString() === productCategory
      ).length;
    }

    res.json({
      success: true,
      data: filteredLots,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory lots:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory lots',
      error: error.message
    });
  }
};

// Get inventory statistics for dashboard
export const getInventoryStats = async (req, res) => {
  try {
    // Get basic counts
    const [
      totalLots,
      activeLots,
      lowStockLots,
      expiringSoonLots,
      totalValue
    ] = await Promise.all([
      InventoryLot.countDocuments(),
      InventoryLot.countDocuments({ status: 'Active' }),
      InventoryLot.countDocuments({ 
        status: 'Active',
        currentQuantity: { $lt: 50 } // Configurable threshold
      }),
      InventoryLot.countDocuments({
        status: 'Active',
        expiryDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      }),
      InventoryLot.aggregate([
        { $match: { status: 'Active' } },
        { $group: { _id: null, total: { $sum: '$totalCost' } } }
      ])
    ]);

    // Get product type breakdown
    const productTypeBreakdown = await InventoryLot.aggregate([
      { $match: { status: 'Active' } },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $lookup: {
          from: 'categories',
          localField: 'productInfo.category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$categoryInfo.name',
          quantity: { $sum: '$currentQuantity' },
          value: { $sum: '$totalCost' },
          lots: { $sum: 1 }
        }
      },
      { $sort: { quantity: -1 } }
    ]);

    // Get recent movements
    const recentMovements = await InventoryLot.aggregate([
      { $unwind: '$movements' },
      { $sort: { 'movements.date': -1 } },
      { $limit: 10 },
      {
        $project: {
          lotNumber: 1,
          productName: 1,
          'movements.type': 1,
          'movements.quantity': 1,
          'movements.date': 1,
          'movements.reference': 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalLots,
          activeLots,
          lowStockLots,
          expiringSoonLots,
          totalValue: totalValue[0]?.total || 0
        },
        productTypeBreakdown,
        recentMovements
      }
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory statistics',
      error: error.message
    });
  }
};

// Get single inventory lot by ID
export const getInventoryLotById = async (req, res) => {
  try {
    const { id } = req.params;

    const lot = await InventoryLot.findById(id)
      .populate('product', 'name code category specifications')
      .populate('supplier', 'companyName contactPerson phone')
      .populate('grn', 'grnNumber receiptDate invoiceNumber')
      .populate('purchaseOrder', 'poNumber orderDate expectedDeliveryDate');

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Inventory lot not found'
      });
    }

    res.json({
      success: true,
      data: lot
    });
  } catch (error) {
    console.error('Error fetching inventory lot:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory lot',
      error: error.message
    });
  }
};

// Update inventory lot
export const updateInventoryLot = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Add last modified by
    updateData.lastModifiedBy = req.user?.name || 'Admin';

    const lot = await InventoryLot.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('product supplier grn purchaseOrder');

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Inventory lot not found'
      });
    }

    res.json({
      success: true,
      message: 'Inventory lot updated successfully',
      data: lot
    });
  } catch (error) {
    console.error('Error updating inventory lot:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating inventory lot',
      error: error.message
    });
  }
};

// Stock movement operations
export const stockMovement = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { type, quantity, reference, notes, performedBy } = req.body;

    const lot = await InventoryLot.findById(id);
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Inventory lot not found'
      });
    }

    // Validate movement based on type
    const movementQuantity = parseFloat(quantity);
    
    if (['Issued', 'Damaged', 'Transferred'].includes(type)) {
      if (movementQuantity > lot.availableQuantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient available quantity for this movement'
        });
      }
      lot.currentQuantity -= movementQuantity;
    } else if (['Returned', 'Adjusted'].includes(type)) {
      lot.currentQuantity += movementQuantity;
    } else if (type === 'Reserved') {
      if (movementQuantity > lot.availableQuantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient available quantity to reserve'
        });
      }
      lot.reservedQuantity += movementQuantity;
    }

    // Add movement record
    lot.movements.push({
      type,
      quantity: movementQuantity,
      date: new Date(),
      reference,
      notes,
      performedBy: performedBy || req.user?.name || 'Admin'
    });

    // Update last modified
    lot.lastModifiedBy = req.user?.name || 'Admin';

    await lot.save();

    res.json({
      success: true,
      message: `Stock ${type.toLowerCase()} recorded successfully`,
      data: lot
    });
  } catch (error) {
    console.error('Error recording stock movement:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording stock movement',
      error: error.message
    });
  }
};

// Transfer stock between lots or locations
export const transferStock = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      fromLotId, 
      toLotId, 
      quantity, 
      transferType, // 'lot-to-lot' or 'location-change'
      newLocation,
      notes,
      performedBy 
    } = req.body;

    const fromLot = await InventoryLot.findById(fromLotId);
    if (!fromLot) {
      return res.status(404).json({
        success: false,
        message: 'Source lot not found'
      });
    }

    const transferQuantity = parseFloat(quantity);
    
    if (transferQuantity > fromLot.availableQuantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient available quantity in source lot'
      });
    }

    if (transferType === 'lot-to-lot') {
      const toLot = await InventoryLot.findById(toLotId);
      if (!toLot) {
        return res.status(404).json({
          success: false,
          message: 'Destination lot not found'
        });
      }

      // Transfer between lots
      fromLot.currentQuantity -= transferQuantity;
      toLot.currentQuantity += transferQuantity;

      // Add movement records
      const transferRef = `TRANSFER-${Date.now()}`;
      
      fromLot.movements.push({
        type: 'Transferred',
        quantity: transferQuantity,
        date: new Date(),
        reference: transferRef,
        notes: `Transferred to ${toLot.lotNumber}. ${notes || ''}`,
        performedBy: performedBy || req.user?.name || 'Admin'
      });

      toLot.movements.push({
        type: 'Received',
        quantity: transferQuantity,
        date: new Date(),
        reference: transferRef,
        notes: `Received from ${fromLot.lotNumber}. ${notes || ''}`,
        performedBy: performedBy || req.user?.name || 'Admin'
      });

      await Promise.all([fromLot.save(), toLot.save()]);

      res.json({
        success: true,
        message: 'Stock transferred successfully between lots',
        data: { fromLot, toLot }
      });

    } else if (transferType === 'location-change') {
      // Change location within same lot
      const oldLocation = { ...fromLot.location };
      fromLot.location = newLocation;

      fromLot.movements.push({
        type: 'Transferred',
        quantity: 0, // Location change, no quantity change
        date: new Date(),
        reference: `LOCATION-CHANGE-${Date.now()}`,
        notes: `Location changed from ${JSON.stringify(oldLocation)} to ${JSON.stringify(newLocation)}. ${notes || ''}`,
        performedBy: performedBy || req.user?.name || 'Admin'
      });

      await fromLot.save();

      res.json({
        success: true,
        message: 'Location updated successfully',
        data: fromLot
      });
    }

  } catch (error) {
    console.error('Error transferring stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error transferring stock',
      error: error.message
    });
  }
};

// Get low stock alerts
export const getLowStockAlerts = async (req, res) => {
  try {
    const { threshold = 50 } = req.query;

    const lowStockLots = await InventoryLot.find({
      status: 'Active',
      currentQuantity: { $lt: parseInt(threshold) },
      currentQuantity: { $gt: 0 }
    })
    .populate('product', 'name code')
    .populate('supplier', 'companyName')
    .sort({ currentQuantity: 1 });

    res.json({
      success: true,
      data: lowStockLots,
      count: lowStockLots.length
    });
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock alerts',
      error: error.message
    });
  }
};

// Get expiry alerts
export const getExpiryAlerts = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const alertDate = new Date();
    alertDate.setDate(alertDate.getDate() + parseInt(days));

    const expiringLots = await InventoryLot.find({
      status: 'Active',
      expiryDate: {
        $gte: new Date(),
        $lte: alertDate
      }
    })
    .populate('product', 'name code')
    .populate('supplier', 'companyName')
    .sort({ expiryDate: 1 });

    res.json({
      success: true,
      data: expiringLots,
      count: expiringLots.length
    });
  } catch (error) {
    console.error('Error fetching expiry alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expiry alerts',
      error: error.message
    });
  }
};

// Acknowledge alerts
export const acknowledgeAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { alertId } = req.body;

    const lot = await InventoryLot.findById(id);
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Inventory lot not found'
      });
    }

    const alert = lot.alerts.id(alertId);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    alert.acknowledged = true;
    await lot.save();

    res.json({
      success: true,
      message: 'Alert acknowledged successfully'
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error acknowledging alert',
      error: error.message
    });
  }
};

// Get inventory movements history
export const getMovementHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const lot = await InventoryLot.findById(id);
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Inventory lot not found'
      });
    }

    // Sort movements by date (newest first)
    const movements = lot.movements
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      data: {
        lotNumber: lot.lotNumber,
        productName: lot.productName,
        movements,
        pagination: {
          current: parseInt(page),
          total: lot.movements.length,
          pages: Math.ceil(lot.movements.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching movement history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching movement history',
      error: error.message
    });
  }
};

// Get detailed inventory view for a single product, broken down by sub-product
export const getProductInventoryDetail = async (req, res) => {
  try {
    const { productId } = req.params;

    const lots = await InventoryLot.find({
      product: productId,
      status: { $in: ['Active', 'Consumed'] }
    })
      .populate('product', 'productName productCode category')
      .populate('supplier', 'companyName')
      .populate({
        path: 'product',
        populate: { path: 'category', select: 'categoryName' }
      })
      .sort({ receivedDate: 1 }) // FIFO — must match the order challan stock-out deducts from
      .lean();

    const subProductMap = {};
    let totalCurrentStock = 0;
    let totalReceivedStock = 0;
    let totalIssuedStock = 0;
    let totalReceivedWeight = 0;
    let totalIssuedWeight = 0;

    lots.forEach(lot => {
      const key = lot.subProduct ? lot.subProduct.toString() : '__none__';
      if (!subProductMap[key]) {
        subProductMap[key] = {
          subProductId: lot.subProduct || null,
          subProductName: lot.subProductName || null,
          currentStock: 0,
          receivedStock: 0,
          issuedStock: 0,
          currentWeight: 0,
          receivedWeight: 0,
          issuedWeight: 0,
          lots: []
        };
      }
      const sp = subProductMap[key];
      const issuedQty = lot.movements
        ?.filter(m => m.type === 'Issued')
        .reduce((sum, m) => sum + (m.quantity || 0), 0) || 0;
      const issuedWeight = lot.movements
        ?.filter(m => m.type === 'Issued')
        .reduce((sum, m) => sum + (m.weight || 0), 0) || 0;
      // Use Received movement weight (immutable) — lot.totalWeight is decremented on stock-out
      const receivedWeight = lot.movements
        ?.filter(m => m.type === 'Received')
        .reduce((sum, m) => sum + (m.weight || 0), 0) || lot.totalWeight || 0;

      sp.currentStock += lot.currentQuantity || 0;
      sp.receivedStock += lot.receivedQuantity || 0;
      sp.issuedStock += issuedQty;
      sp.receivedWeight += receivedWeight;
      sp.issuedWeight += issuedWeight;
      sp.currentWeight = sp.receivedWeight - sp.issuedWeight;

      totalCurrentStock += lot.currentQuantity || 0;
      totalReceivedStock += lot.receivedQuantity || 0;
      totalIssuedStock += issuedQty;
      totalReceivedWeight += receivedWeight;
      totalIssuedWeight += issuedWeight;

      sp.lots.push({
        lotNumber: lot.lotNumber,
        lotId: lot._id,
        grnNumber: lot.grnNumber,
        receivedQuantity: lot.receivedQuantity,
        currentQuantity: lot.currentQuantity,
        issuedQuantity: issuedQty,
        subProductWeights: lot.subProductWeights || [],
        status: lot.status,
        receivedDate: lot.receivedDate,
        supplierName: lot.supplierName || 'Unknown',
        warehouse: lot.warehouse,
        movements: lot.movements || []
      });
    });

    const productInfo = lots.length > 0 ? {
      productId: lots[0].product._id,
      productName: lots[0].product.productName,
      productCode: lots[0].product.productCode,
      categoryName: lots[0].product.category?.categoryName || 'Uncategorized',
      unit: lots[0].unit || 'Units'
    } : null;

    const subProductBreakdown = Object.values(subProductMap).map(sp => ({
      ...sp,
      displayName: sp.subProductName && productInfo
        ? `${productInfo.productName} X ${sp.subProductName}`
        : (productInfo?.productName || 'Unknown')
    }));

    res.json({
      success: true,
      data: {
        product: productInfo,
        totals: {
          currentStock: totalCurrentStock,
          receivedStock: totalReceivedStock,
          issuedStock: totalIssuedStock,
          currentWeight: totalReceivedWeight - totalIssuedWeight,
          receivedWeight: totalReceivedWeight,
          issuedWeight: totalIssuedWeight
        },
        subProductBreakdown,
        lotsCount: lots.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching product inventory detail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product inventory detail',
      error: error.message
    });
  }
};

export default {
  getInventoryProducts,
  getAllInventoryLots,
  getInventoryStats,
  getInventoryLotById,
  getProductInventoryDetail,
  updateInventoryLot,
  stockMovement,
  transferStock,
  getLowStockAlerts,
  getExpiryAlerts,
  acknowledgeAlert,
  getMovementHistory
};
