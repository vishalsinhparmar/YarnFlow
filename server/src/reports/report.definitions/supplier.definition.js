import { field, TYPES } from './_shared.js';

export default {
  key: 'suppliers',
  name: 'Suppliers',
  description: 'Supplier master data including contact, city, GSTIN and status.',
  category: 'Master Data',
  icon: 'Users',
  sourceModel: 'Supplier',
  baseCollection: 'suppliers',
  defaultFields: ['companyName', 'gstNumber', 'panNumber', 'city', 'status', 'createdAt'],
  fields: [
    field({ key: 'companyName', label: 'Company Name', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'gstNumber', label: 'GST Number', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'panNumber', label: 'PAN Number', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'city', label: 'City', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'notes', label: 'Notes', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'status', label: 'Status', type: TYPES.ENUM, allowedValues: ['Active', 'Inactive', 'Blocked'], group: 'Basic' }),
    field({ key: 'createdAt', label: 'Created At', type: TYPES.DATE, group: 'Audit', formatter: 'datetime', isDateFilter: true }),
    field({ key: 'updatedAt', label: 'Updated At', type: TYPES.DATE, group: 'Audit', formatter: 'datetime' })
  ],
  lookups: []
};
