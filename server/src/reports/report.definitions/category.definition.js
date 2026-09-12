import { field, TYPES } from './_shared.js';

export default {
  key: 'categories',
  name: 'Categories',
  description: 'Product categories with status and sub-product support flag.',
  category: 'Master Data',
  icon: 'Layers',
  sourceModel: 'Category',
  baseCollection: 'categories',
  defaultFields: ['categoryName', 'description', 'hasSubProducts', 'status', 'createdAt'],
  fields: [
    field({ key: 'categoryName', label: 'Category Name', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'description', label: 'Description', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'hasSubProducts', label: 'Has Sub Products', type: TYPES.BOOLEAN, group: 'Basic', formatter: 'boolean' }),
    field({ key: 'status', label: 'Status', type: TYPES.ENUM, allowedValues: ['Active', 'Inactive'], group: 'Basic' }),
    field({ key: 'createdAt', label: 'Created At', type: TYPES.DATE, group: 'Audit', formatter: 'datetime', isDateFilter: true }),
    field({ key: 'updatedAt', label: 'Updated At', type: TYPES.DATE, group: 'Audit', formatter: 'datetime' })
  ],
  lookups: []
};
