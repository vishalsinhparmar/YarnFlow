import { field, TYPES } from './_shared.js';

export default {
  key: 'users',
  name: 'Users',
  description: 'System users with roles and active status.',
  category: 'Administration',
  icon: 'UserCircle',
  sourceModel: 'User',
  baseCollection: 'users',
  defaultFields: ['name', 'username', 'email', 'role', 'isActive', 'mobileAccess', 'createdAt'],
  fields: [
    field({ key: 'name', label: 'Name', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'username', label: 'Username', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'email', label: 'Email', type: TYPES.STRING, group: 'Basic' }),
    field({ key: 'role', label: 'Role', type: TYPES.ENUM, allowedValues: ['Admin', 'User'], group: 'Basic' }),
    field({ key: 'isActive', label: 'Active', type: TYPES.BOOLEAN, group: 'Basic', formatter: 'boolean' }),
    field({ key: 'mobileAccess', label: 'Mobile Access', type: TYPES.BOOLEAN, group: 'Basic', formatter: 'boolean' }),
    field({ key: 'createdAt', label: 'Created At', type: TYPES.DATE, group: 'Audit', formatter: 'datetime' }),
    field({ key: 'updatedAt', label: 'Updated At', type: TYPES.DATE, group: 'Audit', formatter: 'datetime' })
  ],
  lookups: []
};
