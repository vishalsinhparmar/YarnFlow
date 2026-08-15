import { field, TYPES } from './_shared.js';

export default {
  key: 'sales_challans',
  name: 'Sales Challans',
  description: 'Sales challans with SO/customer reference, warehouse, and dispatched items.',
  category: 'Transactions',
  icon: 'Truck',
  sourceModel: 'SalesChallan',
  baseCollection: 'saleschallans',
  defaultFields: [
    'challanNumber',
    'challanDate',
    'soNumber',
    'customerName',
    'status',
    'warehouseLocation',
    'itemProductName',
    'itemSubProductName',
    'itemOrderedQuantity',
    'itemDispatchQuantity',
    'itemUnit',
    'itemWeight'
  ],
  itemArrayPath: 'items',
  fields: [
    field({ key: 'challanNumber', label: 'Challan No', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'challanDate', label: 'Challan Date', type: TYPES.DATE, group: 'Basic', formatter: 'date' }),
    field({ key: 'expectedDeliveryDate', label: 'Expected Delivery Date', type: TYPES.DATE, group: 'Basic', formatter: 'date' }),
    field({ key: 'status', label: 'Status', type: TYPES.ENUM, allowedValues: ['Prepared', 'Dispatched', 'Delivered', 'Cancelled'], group: 'Basic' }),
    field({ key: 'warehouseLocation', label: 'Warehouse', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'notes', label: 'Notes', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'createdAt', label: 'Created At', type: TYPES.DATE, group: 'Basic', formatter: 'datetime' }),

    field({ key: 'salesOrder', label: 'Sales Order', type: TYPES.REFERENCE, reference: { model: 'SalesOrder', displayField: 'soNumber', valueField: '_id' }, group: 'References' }),
    field({ key: 'soNumber', label: 'SO Number', type: TYPES.STRING, group: 'References' }),
    field({ key: 'customer', label: 'Customer', type: TYPES.REFERENCE, reference: { model: 'Customer', displayField: 'companyName', valueField: '_id' }, group: 'References' }),
    field({ key: 'customerName', label: 'Customer Name', type: TYPES.STRING, group: 'References' }),

    field({ key: 'itemProductName', label: 'Product', type: TYPES.STRING, path: 'items.productName', isItemField: true, group: 'Item' }),
    field({ key: 'itemSubProductName', label: 'Sub Product', type: TYPES.STRING, path: 'items.subProductName', isItemField: true, group: 'Item' }),
    field({ key: 'itemOrderedQuantity', label: 'Ordered Qty', type: TYPES.NUMBER, path: 'items.orderedQuantity', isItemField: true, group: 'Item' }),
    field({ key: 'itemDispatchQuantity', label: 'Dispatch Qty', type: TYPES.NUMBER, path: 'items.dispatchQuantity', isItemField: true, group: 'Item' }),
    field({ key: 'itemUnit', label: 'Unit', type: TYPES.STRING, path: 'items.unit', isItemField: true, group: 'Item' }),
    field({ key: 'itemWeight', label: 'Weight (kg)', type: TYPES.NUMBER, path: 'items.weight', isItemField: true, group: 'Item' }),
    field({ key: 'itemNotes', label: 'Item Notes', type: TYPES.STRING, path: 'items.notes', isItemField: true, group: 'Item' })
  ],
  lookups: []
};
