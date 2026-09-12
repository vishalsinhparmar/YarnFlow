import { field, TYPES } from './_shared.js';

export default {
  key: 'sales_orders',
  name: 'Sales Orders',
  description: 'Sales orders with customer, status, and ordered/dispatched item details.',
  category: 'Transactions',
  icon: 'FileText',
  sourceModel: 'SalesOrder',
  baseCollection: 'salesorders',
  defaultFields: [
    'soNumber',
    'orderDate',
    'customerName',
    'status',
    'itemProductName',
    'itemSubProductName',
    'itemQuantity',
    'itemShippedQuantity',
    'itemDeliveredQuantity',
    'itemUnit',
    'itemWeight',
    'completionPercentage'
  ],
  itemArrayPath: 'items',
  fields: [
    field({ key: 'soNumber', label: 'SO Number', type: TYPES.STRING, group: 'Basic', hasLookup: { model: 'SalesOrder', displayField: 'soNumber', valueField: 'soNumber' } }),
    field({ key: 'orderDate', label: 'Order Date', type: TYPES.DATE, group: 'Basic', formatter: 'date', isDateFilter: true }),
    field({ key: 'expectedDeliveryDate', label: 'Expected Delivery Date', type: TYPES.DATE, group: 'Basic', formatter: 'date' }),
    field({ key: 'status', label: 'Status', type: TYPES.ENUM, allowedValues: ['Draft', 'Pending', 'Processing', 'Delivered', 'Cancelled'], group: 'Basic' }),
    field({ key: 'createdAt', label: 'Created At', type: TYPES.DATE, group: 'Basic', formatter: 'datetime' }),

    field({ key: 'customerName', label: 'Customer Name', type: TYPES.STRING, group: 'Customer', hasLookup: { model: 'Customer', displayField: 'companyName', valueField: 'companyName' } }),

    field({
      key: 'completionPercentage',
      label: 'Completion %',
      type: TYPES.NUMBER,
      group: 'Calculated',
      formatter: 'percent',
      expression: {
        $cond: {
          if: { $gt: [{ $sum: '$items.quantity' }, 0] },
          then: {
            $round: [{
              $multiply: [
                { $divide: [{ $sum: '$items.deliveredQuantity' }, { $sum: '$items.quantity' }] },
                100
              ]
            }, 0]
          },
          else: 0
        }
      }
    }),

    field({ key: 'itemProductName', label: 'Product', type: TYPES.STRING, path: 'items.productName', isItemField: true, group: 'Item', hasLookup: { model: 'Product', displayField: 'productName', valueField: 'productName' } }),
    field({ key: 'itemCategory', label: 'Category', type: TYPES.REFERENCE, path: 'items.category', reference: { model: 'Category', displayField: 'categoryName', valueField: '_id' }, isItemField: true, group: 'Item' }),
    field({ key: 'itemSubProductName', label: 'Sub Product', type: TYPES.STRING, path: 'items.subProductName', isItemField: true, group: 'Item', hasLookup: { model: 'SubProduct', displayField: 'subProductName', valueField: 'subProductName' } }),
    field({ key: 'itemQuantity', label: 'Ordered Qty', type: TYPES.NUMBER, path: 'items.quantity', isItemField: true, group: 'Item' }),
    field({ key: 'itemShippedQuantity', label: 'Shipped Qty', type: TYPES.NUMBER, path: 'items.shippedQuantity', isItemField: true, group: 'Item' }),
    field({ key: 'itemDeliveredQuantity', label: 'Delivered Qty', type: TYPES.NUMBER, path: 'items.deliveredQuantity', isItemField: true, group: 'Item' }),
    field({ key: 'itemUnit', label: 'Unit', type: TYPES.STRING, path: 'items.unit', isItemField: true, group: 'Item' }),
    field({ key: 'itemWeight', label: 'Weight (kg)', type: TYPES.NUMBER, path: 'items.weight', isItemField: true, group: 'Item' }),
    field({ key: 'itemDispatchedWeight', label: 'Dispatched Weight (kg)', type: TYPES.NUMBER, path: 'items.dispatchedWeight', isItemField: true, group: 'Item' }),
    field({ key: 'itemNotes', label: 'Item Notes', type: TYPES.STRING, path: 'items.notes', isItemField: true, group: 'Item' })
  ],
  lookups: []
};
