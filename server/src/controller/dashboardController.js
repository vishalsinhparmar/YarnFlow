import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import GoodsReceiptNote from '../models/GoodsReceiptNote.js';
import InventoryLot from '../models/InventoryLot.js';
import SalesOrder from '../models/SalesOrder.js';
import SalesChallan from '../models/SalesChallan.js';
import logger from '../utils/logger.js';

const LOW_STOCK_THRESHOLD = 50;
const RECENT_ACTIVITY_LIMIT = 8;
const TREND_MONTHS = 6;

const statusCount = (summary, status) => (
  summary.statuses.find((entry) => entry.status === status)?.count || 0
);

const getDocumentSummary = (Model, dateField, startOfMonth) => Model.aggregate([
  {
    $facet: {
      statuses: [
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } }
      ],
      thisMonth: [
        { $match: { [dateField]: { $gte: startOfMonth } } },
        { $count: 'count' }
      ],
      total: [{ $count: 'count' }]
    }
  },
  {
    $project: {
      statuses: 1,
      thisMonth: { $ifNull: [{ $arrayElemAt: ['$thisMonth.count', 0] }, 0] },
      total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] }
    }
  }
]).then((rows) => rows[0] || { statuses: [], thisMonth: 0, total: 0 });

const getMonthBuckets = (now) => {
  const buckets = [];

  for (let offset = TREND_MONTHS - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    buckets.push({
      key: `${date.getFullYear()}-${date.getMonth() + 1}`,
      label: date.toLocaleString('en-IN', { month: 'short' }),
      year: date.getFullYear(),
      month: date.getMonth() + 1
    });
  }

  return buckets;
};

const mergeMonthlyFlow = (now, inboundRows, outboundRows) => {
  const inbound = new Map(
    inboundRows.map((row) => [`${row._id.year}-${row._id.month}`, row])
  );
  const outbound = new Map(
    outboundRows.map((row) => [`${row._id.year}-${row._id.month}`, row])
  );

  return getMonthBuckets(now).map((bucket) => ({
    month: bucket.label,
    year: bucket.year,
    receivedWeight: inbound.get(bucket.key)?.weight || 0,
    dispatchedWeight: outbound.get(bucket.key)?.weight || 0,
    receivedQuantity: inbound.get(bucket.key)?.quantity || 0,
    dispatchedQuantity: outbound.get(bucket.key)?.quantity || 0
  }));
};

const activityStatus = (status, successStatuses) => {
  if (successStatuses.includes(status)) return 'success';
  if (status === 'Cancelled') return 'error';
  if (['Draft', 'Pending', 'Partial', 'Partially_Received', 'Prepared'].includes(status)) {
    return 'warning';
  }
  return 'info';
};

const buildRecentActivities = ({ purchaseOrders, grns, salesOrders, challans }) => {
  const activities = [
    ...purchaseOrders.map((document) => ({
      id: `po-${document._id}`,
      type: 'purchase_order',
      title: 'Purchase order updated',
      reference: document.poNumber,
      party: document.supplierDetails?.companyName || '',
      documentStatus: document.status,
      timestamp: document.updatedAt || document.createdAt,
      status: activityStatus(document.status, ['Fully_Received'])
    })),
    ...grns.map((document) => ({
      id: `grn-${document._id}`,
      type: 'grn',
      title: 'Goods receipt recorded',
      reference: document.grnNumber,
      party: document.supplierDetails?.companyName || '',
      documentStatus: document.status,
      timestamp: document.updatedAt || document.createdAt,
      status: activityStatus(document.status, ['Complete', 'Received'])
    })),
    ...salesOrders.map((document) => ({
      id: `so-${document._id}`,
      type: 'sales_order',
      title: 'Sales order updated',
      reference: document.soNumber,
      party: document.customerName || '',
      documentStatus: document.status,
      timestamp: document.updatedAt || document.createdAt,
      status: activityStatus(document.status, ['Delivered'])
    })),
    ...challans.map((document) => ({
      id: `challan-${document._id}`,
      type: 'sales_challan',
      title: 'Sales challan updated',
      reference: document.challanNumber,
      party: document.customerName || '',
      documentStatus: document.status,
      timestamp: document.updatedAt || document.createdAt,
      status: activityStatus(document.status, ['Delivered'])
    }))
  ];

  return activities
    .filter((activity) => activity.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, RECENT_ACTIVITY_LIMIT);
};

export const dashboardInternals = {
  buildRecentActivities,
  mergeMonthlyFlow
};

const loadRecentDocuments = () => Promise.all([
  PurchaseOrder.find(
    {},
    'poNumber status supplierDetails.companyName createdAt updatedAt'
  ).sort({ updatedAt: -1 }).limit(4).lean(),
  GoodsReceiptNote.find(
    {},
    'grnNumber status supplierDetails.companyName createdAt updatedAt'
  ).sort({ updatedAt: -1 }).limit(4).lean(),
  SalesOrder.find(
    {},
    'soNumber status customerName createdAt updatedAt'
  ).sort({ updatedAt: -1 }).limit(4).lean(),
  SalesChallan.find(
    {},
    'challanNumber status customerName createdAt updatedAt'
  ).sort({ updatedAt: -1 }).limit(4).lean()
]).then(([purchaseOrders, grns, salesOrders, challans]) => (
  buildRecentActivities({ purchaseOrders, grns, salesOrders, challans })
));

const loadLowStockProducts = () => InventoryLot.aggregate([
  {
    $group: {
      _id: {
        product: '$product',
        productName: '$productName',
        unit: '$unit'
      },
      quantity: { $sum: '$currentQuantity' },
      availableQuantity: { $sum: '$availableQuantity' },
      weight: { $sum: '$totalWeight' },
      lots: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      productId: '$_id.product',
      productName: '$_id.productName',
      unit: { $ifNull: ['$_id.unit', 'Units'] },
      quantity: 1,
      availableQuantity: 1,
      weight: 1,
      lots: 1
    }
  },
  { $sort: { quantity: 1, productName: 1 } }
]);

export const getDashboardStats = async (req, res) => {
  try {
    res.set({
      'Cache-Control': 'private, max-age=30, stale-while-revalidate=30',
      'Vary': 'Accept-Encoding, Authorization'
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const trendStart = new Date(now.getFullYear(), now.getMonth() - (TREND_MONTHS - 1), 1);

    const [
      totalCustomers,
      totalSuppliers,
      totalCategories,
      totalProducts,
      purchaseOrderSummary,
      grnSummary,
      salesOrderSummary,
      challanSummary,
      inventoryLotCount,
      inventoryUnitTotals,
      inventoryCategories,
      inventoryProducts,
      inboundTrend,
      outboundTrend,
      overduePurchaseOrders,
      overdueSalesOrders,
      recentActivity
    ] = await Promise.all([
      Customer.countDocuments(),
      Supplier.countDocuments(),
      Category.countDocuments(),
      Product.countDocuments(),
      getDocumentSummary(PurchaseOrder, 'orderDate', startOfMonth),
      getDocumentSummary(GoodsReceiptNote, 'receiptDate', startOfMonth),
      getDocumentSummary(SalesOrder, 'orderDate', startOfMonth),
      getDocumentSummary(SalesChallan, 'challanDate', startOfMonth),
      InventoryLot.countDocuments(),
      InventoryLot.aggregate([
        { $match: { currentQuantity: { $gt: 0 } } },
        {
          $group: {
            _id: { $ifNull: ['$unit', 'Units'] },
            quantity: { $sum: '$currentQuantity' },
            availableQuantity: { $sum: '$availableQuantity' },
            reservedQuantity: { $sum: '$reservedQuantity' },
            weight: { $sum: '$totalWeight' },
            lots: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            unit: '$_id',
            quantity: 1,
            availableQuantity: 1,
            reservedQuantity: 1,
            weight: 1,
            lots: 1
          }
        },
        { $sort: { weight: -1, quantity: -1 } }
      ]),
      InventoryLot.aggregate([
        { $match: { currentQuantity: { $gt: 0 } } },
        {
          $group: {
            _id: '$category',
            quantity: { $sum: '$currentQuantity' },
            availableQuantity: { $sum: '$availableQuantity' },
            weight: { $sum: '$totalWeight' },
            lots: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: Category.collection.name,
            localField: '_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            categoryId: '$_id',
            categoryName: { $ifNull: ['$category.categoryName', 'Uncategorized'] },
            quantity: 1,
            availableQuantity: 1,
            weight: 1,
            lots: 1
          }
        },
        { $sort: { weight: -1, quantity: -1 } },
        { $limit: 8 }
      ]),
      loadLowStockProducts(),
      GoodsReceiptNote.aggregate([
        { $match: { receiptDate: { $gte: trendStart } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: {
              year: { $year: '$receiptDate' },
              month: { $month: '$receiptDate' }
            },
            weight: { $sum: { $ifNull: ['$items.receivedWeight', 0] } },
            quantity: { $sum: { $ifNull: ['$items.receivedQuantity', 0] } }
          }
        }
      ]),
      SalesChallan.aggregate([
        {
          $match: {
            challanDate: { $gte: trendStart },
            status: { $ne: 'Cancelled' }
          }
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: {
              year: { $year: '$challanDate' },
              month: { $month: '$challanDate' }
            },
            weight: { $sum: { $ifNull: ['$items.weight', 0] } },
            quantity: { $sum: { $ifNull: ['$items.dispatchQuantity', 0] } }
          }
        }
      ]),
      PurchaseOrder.countDocuments({
        expectedDeliveryDate: { $lt: now },
        status: { $in: ['Draft', 'Partially_Received'] }
      }),
      SalesOrder.countDocuments({
        expectedDeliveryDate: { $lt: now },
        status: { $in: ['Draft', 'Pending', 'Processing'] }
      }),
      loadRecentDocuments()
    ]);

    const allLowStockProducts = inventoryProducts.filter((product) => (
      product.quantity > 0 && product.quantity <= LOW_STOCK_THRESHOLD
    ));
    const lowStockProducts = allLowStockProducts.slice(0, 8);
    const outOfStockProducts = inventoryProducts.filter((product) => product.quantity <= 0);
    const topProducts = inventoryProducts
      .filter((product) => product.quantity > 0)
      .sort((a, b) => b.weight - a.weight || b.quantity - a.quantity)
      .slice(0, 6);

    const totalInventoryWeight = inventoryUnitTotals.reduce(
      (sum, unit) => sum + (unit.weight || 0),
      0
    );
    const activeInventoryLots = inventoryUnitTotals.reduce(
      (sum, unit) => sum + (unit.lots || 0),
      0
    );
    const reservedInventoryQuantity = inventoryUnitTotals.reduce(
      (sum, unit) => sum + (unit.reservedQuantity || 0),
      0
    );

    const purchaseOrders = {
      total: purchaseOrderSummary.total,
      open: statusCount(purchaseOrderSummary, 'Draft')
        + statusCount(purchaseOrderSummary, 'Partially_Received'),
      draft: statusCount(purchaseOrderSummary, 'Draft'),
      partial: statusCount(purchaseOrderSummary, 'Partially_Received'),
      complete: statusCount(purchaseOrderSummary, 'Fully_Received'),
      cancelled: statusCount(purchaseOrderSummary, 'Cancelled'),
      thisMonth: purchaseOrderSummary.thisMonth,
      overdue: overduePurchaseOrders
    };
    const grns = {
      total: grnSummary.total,
      open: statusCount(grnSummary, 'Draft')
        + statusCount(grnSummary, 'Partial')
        + statusCount(grnSummary, 'Received'),
      draft: statusCount(grnSummary, 'Draft'),
      partial: statusCount(grnSummary, 'Partial'),
      received: statusCount(grnSummary, 'Received'),
      complete: statusCount(grnSummary, 'Complete'),
      thisMonth: grnSummary.thisMonth
    };
    const salesOrders = {
      total: salesOrderSummary.total,
      open: statusCount(salesOrderSummary, 'Draft')
        + statusCount(salesOrderSummary, 'Pending')
        + statusCount(salesOrderSummary, 'Processing'),
      draft: statusCount(salesOrderSummary, 'Draft'),
      pending: statusCount(salesOrderSummary, 'Pending'),
      processing: statusCount(salesOrderSummary, 'Processing'),
      delivered: statusCount(salesOrderSummary, 'Delivered'),
      cancelled: statusCount(salesOrderSummary, 'Cancelled'),
      thisMonth: salesOrderSummary.thisMonth,
      overdue: overdueSalesOrders
    };
    const challans = {
      total: challanSummary.total,
      open: statusCount(challanSummary, 'Prepared')
        + statusCount(challanSummary, 'Dispatched'),
      prepared: statusCount(challanSummary, 'Prepared'),
      dispatched: statusCount(challanSummary, 'Dispatched'),
      delivered: statusCount(challanSummary, 'Delivered'),
      cancelled: statusCount(challanSummary, 'Cancelled'),
      thisMonth: challanSummary.thisMonth
    };

    const inventory = {
      totalLots: inventoryLotCount,
      activeLots: activeInventoryLots,
      currentWeight: totalInventoryWeight,
      reservedQuantity: reservedInventoryQuantity,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      lowStockCount: allLowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      unitTotals: inventoryUnitTotals,
      categoryDistribution: inventoryCategories,
      topProducts,
      lowStockProducts,
      outOfStockProducts: outOfStockProducts.slice(0, 8)
    };

    const alerts = {
      total: allLowStockProducts.length + outOfStockProducts.length
        + overduePurchaseOrders + overdueSalesOrders,
      lowStock: allLowStockProducts.length,
      outOfStock: outOfStockProducts.length,
      overduePurchaseOrders,
      overdueSalesOrders
    };

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          totalSuppliers,
          totalCategories,
          totalProducts,
          activePOs: purchaseOrders.open,
          pendingGRNs: grns.open,
          lowStockItems: inventory.lowStockCount,
          openSalesOrders: salesOrders.open,
          inventoryWeight: inventory.currentWeight
        },
        masterData: {
          customers: totalCustomers,
          suppliers: totalSuppliers,
          categories: totalCategories,
          products: totalProducts
        },
        operations: {
          purchaseOrders,
          grns,
          salesOrders,
          challans
        },
        inventory,
        monthlyFlow: mergeMonthlyFlow(now, inboundTrend, outboundTrend),
        alerts,
        recentActivity,
        workflowMetrics: {
          suppliers: totalSuppliers,
          purchaseOrders: purchaseOrders.open,
          goodsReceipt: grns.thisMonth,
          inventoryLots: inventory.activeLots,
          salesOrders: salesOrders.open,
          salesChallans: challans.open
        },
        stats: {
          purchaseOrders,
          grn: grns,
          inventory,
          salesOrders,
          salesChallans: challans
        }
      },
      timestamp: now.toISOString()
    });

    logger.info('Dashboard statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching dashboard statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to load dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getRecentActivities = async (req, res) => {
  try {
    const recentActivity = await loadRecentDocuments();
    res.status(200).json({ success: true, data: recentActivity });
  } catch (error) {
    logger.error('Error fetching dashboard activities:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to load recent activities'
    });
  }
};

export const getRealtimeMetrics = async (req, res) => {
  try {
    const [
      openPurchaseOrders,
      openSalesOrders,
      inTransitChallans,
      inventoryProducts
    ] = await Promise.all([
      PurchaseOrder.countDocuments({ status: { $in: ['Draft', 'Partially_Received'] } }),
      SalesOrder.countDocuments({ status: { $in: ['Draft', 'Pending', 'Processing'] } }),
      SalesChallan.countDocuments({ status: 'Dispatched' }),
      loadLowStockProducts()
    ]);

    const lowStock = inventoryProducts.filter((product) => (
      product.quantity > 0 && product.quantity <= LOW_STOCK_THRESHOLD
    )).length;
    const outOfStock = inventoryProducts.filter((product) => product.quantity <= 0).length;

    res.status(200).json({
      success: true,
      data: {
        systemStatus: 'operational',
        lastUpdated: new Date().toISOString(),
        openPurchaseOrders,
        openSalesOrders,
        inTransitChallans,
        alerts: {
          total: lowStock + outOfStock,
          lowStock,
          outOfStock
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching realtime metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to load realtime metrics'
    });
  }
};

export default {
  getDashboardStats,
  getRecentActivities,
  getRealtimeMetrics
};
