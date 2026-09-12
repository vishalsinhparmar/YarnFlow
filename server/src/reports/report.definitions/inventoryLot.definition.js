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
    'calculatedBagsOut',
    'calculatedWeightIn',
    'calculatedWeightOut',
    'calculatedWeightBalance',
    'warehouse',
    'status',
    'receivedDate'
  ],
  fields: [
    field({ key: 'lotNumber', label: 'Lot No', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'grnNumber', label: 'GRN Number', type: TYPES.STRING, group: 'Basic', hasLookup: { model: 'GoodsReceiptNote', displayField: 'grnNumber', valueField: 'grnNumber' } }),
    field({ key: 'poNumber', label: 'PO Number', type: TYPES.STRING, group: 'Basic', hasLookup: { model: 'PurchaseOrder', displayField: 'poNumber', valueField: 'poNumber' } }),
    field({ key: 'receivedDate', label: 'Received Date', type: TYPES.DATE, path: 'receivedDate', group: 'Basic', formatter: 'date', isDateFilter: true }),
    field({ key: 'warehouse', label: 'Warehouse', type: TYPES.REFERENCE, reference: { model: 'WarehouseLocation', displayField: 'name', valueField: 'name' }, group: 'Basic' }),
    field({ key: 'status', label: 'Status', type: TYPES.ENUM, allowedValues: ['Active', 'Reserved', 'Consumed'], group: 'Basic' }),
    field({ key: 'createdAt', label: 'Created At', type: TYPES.DATE, group: 'Basic', formatter: 'datetime' }),

    field({ key: 'productName', label: 'Product Name', type: TYPES.STRING, group: 'References', hasLookup: { model: 'Product', displayField: 'productName', valueField: 'productName' } }),
    field({ key: 'subProductName', label: 'Sub Product Name', type: TYPES.STRING, group: 'References', hasLookup: { model: 'SubProduct', displayField: 'subProductName', valueField: 'subProductName' } }),
    field({ key: 'category', label: 'Category', type: TYPES.REFERENCE, reference: { model: 'Category', displayField: 'categoryName', valueField: '_id' }, group: 'References' }),
    field({ key: 'supplierName', label: 'Supplier Name', type: TYPES.STRING, group: 'References', hasLookup: { model: 'Supplier', displayField: 'companyName', valueField: 'companyName' } }),

    field({ key: 'receivedQuantity', label: 'Bags In', type: TYPES.NUMBER, group: 'Quantities' }),
    field({ key: 'currentQuantity', label: 'Bags Balance', type: TYPES.NUMBER, group: 'Quantities' }),
    field({ key: 'availableQuantity', label: 'Available Qty', type: TYPES.NUMBER, group: 'Quantities' }),
    field({ key: 'unit', label: 'Unit', type: TYPES.STRING, group: 'Quantities' }),
    field({ key: 'totalWeight', label: 'Weight In (kg)', type: TYPES.NUMBER, group: 'Quantities' }),

    field({ key: 'calculatedBagsOut', label: 'Bags Out', type: TYPES.NUMBER, group: 'Calculated', expression: { $subtract: ['$receivedQuantity', { $ifNull: ['$currentQuantity', 0] }] } }),
    
    // Received Weight = sum of all Received movements (immutable source of truth)
    field({
      key: 'calculatedWeightIn',
      label: 'Received Weight (kg)',
      type: TYPES.NUMBER,
      group: 'Calculated',
      expression: {
        $round: [{
          $reduce: {
            input: {
              $filter: { input: '$movements', as: 'm', cond: { $eq: ['$$m.type', 'Received'] } }
            },
            initialValue: 0,
            in: { $add: ['$$value', { $ifNull: ['$$this.weight', 0] }] }
          }
        }, 2]
      }
    }),
    
    field({
      key: 'calculatedWeightOut',
      label: 'Issued Weight (kg)',
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
      label: 'Balance Weight (kg)',
      type: TYPES.NUMBER,
      group: 'Calculated',
      expression: {
        $round: [{
          $subtract: [
            {
              $reduce: {
                input: {
                  $filter: { input: '$movements', as: 'm', cond: { $eq: ['$$m.type', 'Received'] } }
                },
                initialValue: 0,
                in: { $add: ['$$value', { $ifNull: ['$$this.weight', 0] }] }
              }
            },
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
