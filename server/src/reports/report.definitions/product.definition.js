import { field, TYPES } from './_shared.js';

export default {
  key: 'products',
  name: 'Products',
  description: 'Products with category reference, unit and status.',
  category: 'Master Data',
  icon: 'Package',
  sourceModel: 'Product',
  baseCollection: 'products',
  defaultFields: ['productName', 'categoryName', 'unit', 'status', 'createdAt'],
  fields: [
    field({ key: 'productName', label: 'Product Name', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'description', label: 'Description', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'unit', label: 'Unit', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'status', label: 'Status', type: TYPES.ENUM, allowedValues: ['Active', 'Inactive', 'Discontinued'], group: 'Basic' }),
    field({ key: 'createdAt', label: 'Created At', type: TYPES.DATE, group: 'Audit', formatter: 'datetime', isDateFilter: true }),
    field({ key: 'updatedAt', label: 'Updated At', type: TYPES.DATE, group: 'Audit', formatter: 'datetime' }),

    field({ key: 'category', label: 'Category', type: TYPES.REFERENCE, reference: { model: 'Category', displayField: 'categoryName', valueField: '_id' }, group: 'Category' }),
    field({ key: 'categoryName', label: 'Category Name', type: TYPES.STRING, path: '_category.categoryName', group: 'Category' })
  ],
  lookups: [
    { from: 'categories', localField: 'category', foreignField: '_id', as: '_category', unwind: true }
  ]
};
