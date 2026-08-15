import { field, TYPES } from './_shared.js';

export default {
  key: 'inventory_lots',
  name: 'Inventory Lots',
  description: 'Inventory lots with stock in/out, balance quantities, warehouse and status.',
  category: 'Inventory',
  icon: 'Package',
  sourceModel: 'InventoryLot',
  baseCollection: 'inventorylots',
  defaultFields: [
    'lotNumber',
    'productName',
    'subProductName',
    'supplierName',
    'receivedQuantity',
    'currentQuantity',
    'availableQuantity',
    'totalWeight',
    'calculatedBagsOut',
    'calculatedWeightOut',
    'calculatedWeightBalance',
    'warehouse',
    'status',
    'receivedDate'
  ],
  fields: [
    field({ key: 'lotNumber', label: 'Lot No', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'grnNumber', label: 'GRN Number', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'poNumber', label: 'PO Number', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'receivedDate', label: 'Received Date', type: TYPES.DATE, path: 'receivedDate', group: 'Basic', formatter: 'date' }),
    field({ key: 'warehouse', label: 'Warehouse', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'status', label: 'Status', type: TYPES.ENUM, allowedValues: ['Active', 'Reserved', 'Consumed'], group: 'Basic' }),
    field({ key: 'createdAt', label: 'Created At', type: TYPES.DATE, group: 'Basic', formatter: 'datetime' }),

    field({ key: 'grn', label: 'GRN', type: TYPES.REFERENCE, reference: { model: 'GoodsReceiptNote', displayField: 'grnNumber', valueField: '_id' }, group: 'References' }),
    field({ key: 'purchaseOrder', label: 'Purchase Order', type: TYPES.REFERENCE, reference: { model: 'PurchaseOrder', displayField: 'poNumber', valueField: '_id' }, group: 'References' }),
    field({ key: 'product', label: 'Product', type: TYPES.REFERENCE, reference: { model: 'Product', displayField: 'productName', valueField: '_id' }, group: 'References' }),
    field({ key: 'productName', label: 'Product Name', type: TYPES.STRING, group: 'References' }),
    field({ key: 'subProduct', label: 'Sub Product', type: TYPES.REFERENCE, reference: { model: 'SubProduct', displayField: 'name', valueField: '_id' }, group: 'References' }),
    field({ key: 'subProductName', label: 'Sub Product Name', type: TYPES.STRING, group: 'References' }),
    field({ key: 'category', label: 'Category', type: TYPES.REFERENCE, reference: { model: 'Category', displayField: 'categoryName', valueField: '_id' }, group: 'References' }),
    field({ key: 'supplier', label: 'Supplier', type: TYPES.REFERENCE, reference: { model: 'Supplier', displayField: 'companyName', valueField: '_id' }, group: 'References' }),
    field({ key: 'supplierName', label: 'Supplier Name', type: TYPES.STRING, group: 'References' }),

    field({ key: 'receivedQuantity', label: 'Bags In', type: TYPES.NUMBER, group: 'Quantities' }),
    field({ key: 'currentQuantity', label: 'Bags Balance', type: TYPES.NUMBER, group: 'Quantities' }),
    field({ key: 'reservedQuantity', label: 'Reserved Qty', type: TYPES.NUMBER, group: 'Quantities' }),
    field({ key: 'availableQuantity', label: 'Available Qty', type: TYPES.NUMBER, group: 'Quantities' }),
    field({ key: 'unit', label: 'Unit', type: TYPES.STRING, group: 'Quantities' }),
    field({ key: 'totalWeight', label: 'Weight In (kg)', type: TYPES.NUMBER, group: 'Quantities' }),

    field({ key: 'calculatedBagsOut', label: 'Bags Out', type: TYPES.NUMBER, group: 'Calculated', expression: { $subtract: ['$receivedQuantity', { $ifNull: ['$currentQuantity', 0] }] } }),
    field({
      key: 'calculatedWeightOut',
      label: 'Weight Out (kg)',
      type: TYPES.NUMBER,
      group: 'Calculated',
      expression: {
        $round: [{
          $reduce: {
            input: {
              $filter: { input: '$movements', as: 'm', cond: { $eq: ['$$m.type', 'Issued'] } }
            },
            initialValue: 0,
            in: { $add: ['$$value', { $ifNull: ['$$this.weight', 0] }] }
          }
        }, 2]
      }
    }),
    field({
      key: 'calculatedWeightBalance',
      label: 'Weight Balance (kg)',
      type: TYPES.NUMBER,
      group: 'Calculated',
      expression: {
        $round: [{
          $subtract: [
            { $ifNull: ['$totalWeight', 0] },
            {
              $reduce: {
                input: {
                  $filter: { input: '$movements', as: 'm', cond: { $eq: ['$$m.type', 'Issued'] } }
                },
                initialValue: 0,
                in: { $add: ['$$value', { $ifNull: ['$$this.weight', 0] }] }
              }
            }
          ]
        }, 2]
      }
    })
  ],
  lookups: []
};
