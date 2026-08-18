import { field, TYPES } from './_shared.js';

export default {
  key: 'grn',
  name: 'Goods Receipt Notes',
  description: 'GRNs with PO reference, supplier, receipt date, warehouse, and received items.',
  category: 'Transactions',
  icon: 'ClipboardCheck',
  sourceModel: 'GoodsReceiptNote',
  baseCollection: 'goodsreceiptnotes',
  defaultFields: [
    'grnNumber',
    'poNumber',
    'receiptDate',
    'supplierName',
    'status',
    'warehouseLocation',
    'itemProductName',
    'itemSubProductName',
    'itemOrderedQuantity',
    'itemReceivedQuantity',
    'itemReceivedWeight',
    'itemUnit'
  ],
  itemArrayPath: 'items',
  fields: [
    field({ key: 'grnNumber', label: 'GRN Number', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'poNumber', label: 'PO Number', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'receiptDate', label: 'Receipt Date', type: TYPES.DATE, group: 'Basic', formatter: 'date' }),
    field({ key: 'status', label: 'Status', type: TYPES.ENUM, allowedValues: ['Draft', 'Received', 'Partial', 'Complete'], group: 'Basic' }),
    field({ key: 'receiptStatus', label: 'Receipt Status', type: TYPES.ENUM, allowedValues: ['Partial', 'Complete'], group: 'Basic' }),
    field({ key: 'warehouseLocation', label: 'Warehouse', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'generalNotes', label: 'General Notes', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'createdAt', label: 'Created At', type: TYPES.DATE, group: 'Basic', formatter: 'datetime' }),

    field({ key: 'purchaseOrder', label: 'Purchase Order', type: TYPES.REFERENCE, reference: { model: 'PurchaseOrder', displayField: 'poNumber', valueField: '_id' }, path: 'purchaseOrder', group: 'References' }),
    field({ key: 'supplier', label: 'Supplier', type: TYPES.REFERENCE, reference: { model: 'Supplier', displayField: 'companyName', valueField: '_id' }, path: 'supplier', group: 'References' }),
    field({ key: 'supplierName', label: 'Supplier Name', type: TYPES.STRING, path: 'supplierDetails.companyName', group: 'References' }),

    field({ key: 'itemProductName', label: 'Product', type: TYPES.STRING, path: 'items.productName', isItemField: true, group: 'Item' }),
    field({ key: 'itemSubProductName', label: 'Sub Product', type: TYPES.STRING, path: 'items.subProductName', isItemField: true, group: 'Item' }),
    field({ key: 'itemOrderedQuantity', label: 'Ordered Qty', type: TYPES.NUMBER, path: 'items.orderedQuantity', isItemField: true, group: 'Item' }),
    field({ key: 'itemPreviouslyReceived', label: 'Previously Received', type: TYPES.NUMBER, path: 'items.previouslyReceived', isItemField: true, group: 'Item' }),
    field({ key: 'itemReceivedQuantity', label: 'Received Qty', type: TYPES.NUMBER, path: 'items.receivedQuantity', isItemField: true, group: 'Item' }),
    field({ key: 'itemReceivedWeight', label: 'Received Weight (kg)', type: TYPES.NUMBER, path: 'items.receivedWeight', isItemField: true, group: 'Item' }),
    field({ key: 'itemPendingQuantity', label: 'Pending Qty', type: TYPES.NUMBER, path: 'items.pendingQuantity', isItemField: true, group: 'Item' }),
    field({ key: 'itemUnit', label: 'Unit', type: TYPES.STRING, path: 'items.unit', isItemField: true, group: 'Item' }),
    field({ key: 'itemManuallyCompleted', label: 'Manually Completed', type: TYPES.BOOLEAN, path: 'items.manuallyCompleted', isItemField: true, group: 'Item' }),
    field({ key: 'itemNotes', label: 'Item Notes', type: TYPES.STRING, path: 'items.notes', isItemField: true, group: 'Item' })
  ],
  lookups: []
};
