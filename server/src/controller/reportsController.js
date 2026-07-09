import XLSX from 'xlsx';
import { resolveWarehouseName } from './warehouseController.js';
import GoodsReceiptNote from '../models/GoodsReceiptNote.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import SalesOrder from '../models/SalesOrder.js';
import SalesChallan from '../models/SalesChallan.js';
import InventoryLot from '../models/InventoryLot.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';

function dateFilter(field, from, to) {
  const f = {};
  if (from) f.$gte = new Date(from);
  if (to)   { const d = new Date(to); d.setHours(23,59,59,999); f.$lte = d; }
  return Object.keys(f).length ? { [field]: f } : {};
}

function sendExcel(res, workbook, filename) {
  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
}

function addSheet(wb, name, rows) {
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31));
}

// ─── Inventory Report ────────────────────────────────────────────────────────
export const inventoryReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = dateFilter('createdAt', from, to);

    const lots = await InventoryLot.find(filter)
      .populate('product', 'productName')
      .populate('category', 'categoryName')
      .populate('subProduct', 'name')
      .populate('supplier', 'companyName')
      .lean();

    const rows = await Promise.all(lots.map(async l => {
      const bagsIn  = l.receivedQuantity || 0;
      const bagsOut = Math.max(0, bagsIn - (l.currentQuantity || 0));
      const weightIn  = l.totalWeight || 0;
      // dispatchedWeight isn't stored; derive from movements (Issued type)
      const weightOut = (l.movements || [])
        .filter(m => m.type === 'Issued')
        .reduce((sum, m) => sum + (m.weight || 0), 0);
      return {
        'Lot No':             l.lotNumber || '',
        'Product':            l.product?.productName || l.productName || '',
        'Sub Product':        l.subProduct?.name || l.subProductName || '',
        'Category':           l.category?.categoryName || l.categoryName || '',
        'Supplier':           l.supplier?.companyName || l.supplierName || '',
        'Bags In':            bagsIn,
        'Weight In (kg)':     weightIn,
        'Bags Out':           bagsOut,
        'Weight Out (kg)':    Number(weightOut.toFixed(2)),
        'Bags Balance':       (l.currentQuantity || 0),
        'Weight Balance (kg)':Number((weightIn - weightOut).toFixed(2)),
        'Warehouse':          await resolveWarehouseName(l.warehouseLocation),
        'Status':             l.status || '',
        'Date':               l.receivedDate
                                ? new Date(l.receivedDate).toLocaleDateString('en-IN')
                                : l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN') : ''
      };
    }));

    const wb = XLSX.utils.book_new();
    addSheet(wb, 'Inventory', rows);
    sendExcel(res, wb, `Inventory_Report_${Date.now()}.xlsx`);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GRN Report ──────────────────────────────────────────────────────────────
export const grnReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = dateFilter('receiptDate', from, to);

    const grns = await GoodsReceiptNote.find(filter)
      .populate('purchaseOrder', 'poNumber')
      .populate({ path: 'items.product', select: 'productName' })
      .lean();

    const rows = (await Promise.all(grns.map(async g => {
      const warehouse = await resolveWarehouseName(g.warehouseLocation);
      return (g.items || []).map(item => ({
        'GRN Number':    g.grnNumber || '',
        'PO Number':     g.purchaseOrder?.poNumber || '',
        'Receipt Date':  g.receiptDate ? new Date(g.receiptDate).toLocaleDateString('en-IN') : '',
        'Warehouse':     warehouse,
        'Product':       item.productName || item.product?.productName || '',
        'Sub Product':   item.subProductName || '',
        'Ordered Qty':   item.orderedQuantity || 0,
        'Received Qty':  item.receivedQuantity || 0,
        'Unit':          item.unit || '',
        'Weight (kg)':   item.weight || 0,
        'Notes':         item.notes || ''
      }));
    }))).flat();

    const wb = XLSX.utils.book_new();
    addSheet(wb, 'GRN', rows);
    sendExcel(res, wb, `GRN_Report_${Date.now()}.xlsx`);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Purchase Order Report ────────────────────────────────────────────────────
export const purchaseOrderReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = dateFilter('orderDate', from, to);

    const orders = await PurchaseOrder.find(filter)
      .populate('supplier', 'companyName')
      .lean();

    const rows = [];
    orders.forEach(po => {
      po.items?.forEach(item => {
        rows.push({
          'PO Number':     po.poNumber || '',
          'Order Date':    po.orderDate ? new Date(po.orderDate).toLocaleDateString('en-IN') : '',
          'Supplier':      po.supplier?.companyName || '',
          'Status':        po.status || '',
          'Product':       item.productName || '',
          'Sub Product':   item.subProductName || '',
          'Category':      item.categoryName  || '',
          'Ordered Qty':   item.orderedQuantity || 0,
          'Received Qty':  item.receivedQuantity || 0,
          'Unit':          item.unit || '',
          'Weight (kg)':   item.weight || 0,
          'Rate':          item.rate || 0,
          'Amount':        item.amount || 0,
          'Notes':         item.notes || ''
        });
      });
    });

    const wb = XLSX.utils.book_new();
    addSheet(wb, 'Purchase Orders', rows);
    sendExcel(res, wb, `PurchaseOrder_Report_${Date.now()}.xlsx`);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Sales Order Report ───────────────────────────────────────────────────────
export const salesOrderReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = dateFilter('orderDate', from, to);

    const orders = await SalesOrder.find(filter)
      .populate('customer', 'companyName')
      .lean();

    const rows = [];
    orders.forEach(so => {
      so.items?.forEach(item => {
        rows.push({
          'SO Number':     so.soNumber || '',
          'Order Date':    so.orderDate ? new Date(so.orderDate).toLocaleDateString('en-IN') : '',
          'Customer':      so.customer?.companyName || '',
          'Status':        so.status || '',
          'Product':       item.productName || '',
          'Sub Product':   item.subProductName || '',
          'Category':      item.categoryName  || '',
          'Ordered Qty':   item.orderedQuantity || 0,
          'Dispatched Qty':item.dispatchedQuantity || 0,
          'Unit':          item.unit || '',
          'Weight (kg)':   item.weight || 0,
          'Rate':          item.rate || 0,
          'Amount':        item.amount || 0,
          'Notes':         item.notes || ''
        });
      });
    });

    const wb = XLSX.utils.book_new();
    addSheet(wb, 'Sales Orders', rows);
    sendExcel(res, wb, `SalesOrder_Report_${Date.now()}.xlsx`);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Sales Challan Report ─────────────────────────────────────────────────────
export const salesChallanReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = dateFilter('challanDate', from, to);

    const challans = await SalesChallan.find(filter)
      .populate('salesOrder', 'soNumber')
      .populate('customer', 'companyName')
      .lean();

    const rows = (await Promise.all(challans.map(async c => {
      const warehouse = await resolveWarehouseName(c.warehouseLocation);
      return (c.items || []).map(item => ({
        'Challan No':    c.challanNumber || '',
        'Challan Date':  c.challanDate ? new Date(c.challanDate).toLocaleDateString('en-IN') : '',
        'SO Number':     c.salesOrder?.soNumber || '',
        'Customer':      c.customer?.companyName || '',
        'Status':        c.status || '',
        'Warehouse':     warehouse,
        'Product':       item.productName || '',
        'Sub Product':   item.subProductName || '',
        'Category':      item.categoryName  || '',
        'Qty':           item.dispatchQuantity || 0,
        'Unit':          item.unit || '',
        'Weight (kg)':   item.weight || 0,
        'Notes':         item.notes || ''
      }));
    }))).flat();

    const wb = XLSX.utils.book_new();
    addSheet(wb, 'Sales Challans', rows);
    sendExcel(res, wb, `SalesChallan_Report_${Date.now()}.xlsx`);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Master Data Report ───────────────────────────────────────────────────────
export const masterDataReport = async (req, res) => {
  try {
    const [categories, products, customers, suppliers] = await Promise.all([
      Category.find().lean(),
      Product.find().populate('category', 'categoryName').lean(),
      Customer.find().lean(),
      Supplier.find().lean()
    ]);

    const catRows = categories.map(c => ({
      'Category Name': c.categoryName || '',
      'Has Sub Products': c.hasSubProducts ? 'Yes' : 'No',
      'Status': c.isActive !== false ? 'Active' : 'Inactive'
    }));

    const prodRows = products.map(p => ({
      'Product Name': p.productName || '',
      'Category':     p.category?.categoryName || '',
      'Unit':         p.unit || '',
      'Status':       p.isActive !== false ? 'Active' : 'Inactive'
    }));

    const custRows = customers.map(c => ({
      'Company Name': c.companyName || '',
      'Contact':      c.contactPerson || '',
      'Phone':        c.phone || '',
      'Email':        c.email || '',
      'City':         c.address?.city || '',
      'GSTIN':        c.gstin || ''
    }));

    const suppRows = suppliers.map(s => ({
      'Company Name': s.companyName || '',
      'Contact':      s.contactPerson || '',
      'Phone':        s.phone || '',
      'Email':        s.email || '',
      'City':         s.address?.city || '',
      'GSTIN':        s.gstin || ''
    }));

    const wb = XLSX.utils.book_new();
    addSheet(wb, 'Categories',  catRows);
    addSheet(wb, 'Products',    prodRows);
    addSheet(wb, 'Customers',   custRows);
    addSheet(wb, 'Suppliers',   suppRows);
    sendExcel(res, wb, `MasterData_Report_${Date.now()}.xlsx`);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
