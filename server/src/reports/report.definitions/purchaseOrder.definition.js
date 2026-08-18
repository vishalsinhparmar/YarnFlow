import { field, TYPES } from './_shared.js';

export default {
  key: 'purchase_orders',
  name: 'Purchase Orders',
  description: 'Purchase orders with supplier, status, item-level quantities, rates, and amounts.',
  category: 'Transactions',
  icon: 'ShoppingCart',
  sourceModel: 'PurchaseOrder',
  baseCollection: 'purchaseorders',
  defaultFields: [
    'poNumber',
    'orderDate',
    'supplierName',
    'status',
    'itemProductName',
    'itemSubProductName',
    'itemOrderedQuantity',
    'itemReceivedQuantity',
    'itemUnit',
    'itemWeight',
    'itemPendingQuantity',
    'itemReceiptStatus',
    'completionPercentage'
  ],
  itemArrayPath: 'items',
  fields: [
    // Basic fields
    field({ key: 'poNumber', label: 'PO Number', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'orderDate', label: 'Order Date', type: TYPES.DATE, group: 'Basic', formatter: 'date' }),
    field({ key: 'expectedDeliveryDate', label: 'Expected Delivery Date', type: TYPES.DATE, group: 'Basic', formatter: 'date' }),
    field({ key: 'status', label: 'Status', type: TYPES.ENUM, allowedValues: ['Draft', 'Partially_Received', 'Fully_Received', 'Cancelled'], group: 'Basic' }),
    field({ key: 'createdAt', label: 'Created At', type: TYPES.DATE, group: 'Basic', formatter: 'datetime' }),

    // Supplier
    field({ key: 'supplier', label: 'Supplier', type: TYPES.REFERENCE, reference: { model: 'Supplier', displayField: 'companyName', valueField: '_id' }, path: 'supplier', group: 'Supplier' }),
    field({ key: 'supplierName', label: 'Supplier Name', type: TYPES.STRING, path: 'supplierDetails.companyName', group: 'Supplier' }),

    // Calculated
    field({ key: 'completionPercentage', label: 'Completion %', type: TYPES.NUMBER, path: 'completionPercentage', group: 'Calculated', formatter: 'percent' }),
    field({ key: 'isOverdue', label: 'Is Overdue', type: TYPES.BOOLEAN, group: 'Calculated', expression: { $and: [{ $ne: ['$expectedDeliveryDate', null] }, { $lt: ['$expectedDeliveryDate', new Date()] }, { $not: { $in: ['$status', ['Fully_Received', 'Cancelled']] } }] }, formatter: 'boolean' }),

    // Item fields
    field({ key: 'itemProductName', label: 'Product', type: TYPES.STRING, path: 'items.productName', isItemField: true, group: 'Item' }),
    field({ key: 'itemSubProductName', label: 'Sub Product', type: TYPES.STRING, path: 'items.subProductName', isItemField: true, group: 'Item' }),
    field({ key: 'itemOrderedQuantity', label: 'Ordered Qty', type: TYPES.NUMBER, path: 'items.quantity', isItemField: true, group: 'Item' }),
    field({ key: 'itemReceivedQuantity', label: 'Received Qty', type: TYPES.NUMBER, path: 'items.receivedQuantity', isItemField: true, group: 'Item' }),
    field({ key: 'itemPendingQuantity', label: 'Pending Qty', type: TYPES.NUMBER, path: 'items.pendingQuantity', isItemField: true, group: 'Item' }),
    field({ key: 'itemUnit', label: 'Unit', type: TYPES.STRING, path: 'items.unit', isItemField: true, group: 'Item' }),
    field({ key: 'itemWeight', label: 'Weight (kg)', type: TYPES.NUMBER, path: 'items.weight', isItemField: true, group: 'Item' }),
    field({ key: 'itemReceiptStatus', label: 'Item Receipt Status', type: TYPES.ENUM, path: 'items.receiptStatus', allowedValues: ['Pending', 'Partial', 'Complete'], isItemField: true, group: 'Item' }),
    field({ key: 'itemNotes', label: 'Item Notes', type: TYPES.STRING, path: 'items.notes', isItemField: true, group: 'Item' })
  ],
  lookups: []
};
