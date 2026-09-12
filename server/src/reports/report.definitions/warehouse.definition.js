import { field, TYPES } from './_shared.js';

export default {
  key: 'warehouses',
  name: 'Warehouses',
  description: 'Warehouse and storage locations with type and active status.',
  category: 'Master Data',
  icon: 'Warehouse',
  sourceModel: 'WarehouseLocation',
  baseCollection: 'warehouselocations',
  defaultFields: ['name', 'code', 'type', 'address', 'isActive', 'createdAt'],
  fields: [
    field({ key: 'name', label: 'Name', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'code', label: 'Code', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'type', label: 'Type', type: TYPES.ENUM, allowedValues: ['Shop', 'Godown', 'Factory', 'Others'], group: 'Basic' }),
    field({ key: 'address', label: 'Address', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'isActive', label: 'Active', type: TYPES.BOOLEAN, group: 'Basic', formatter: 'boolean' }),
    field({ key: 'createdAt', label: 'Created At', type: TYPES.DATE, group: 'Audit', formatter: 'datetime', isDateFilter: true }),
    field({ key: 'updatedAt', label: 'Updated At', type: TYPES.DATE, group: 'Audit', formatter: 'datetime' })
  ],
  lookups: []
};
