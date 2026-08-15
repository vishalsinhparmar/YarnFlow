import mongoose from 'mongoose';

export const TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DATE: 'date',
  ENUM: 'enum',
  REFERENCE: 'reference'
};

export const OPERATORS = {
  [TYPES.STRING]: ['eq', 'ne', 'contains', 'startsWith', 'in', 'notIn'],
  [TYPES.NUMBER]: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'notIn'],
  [TYPES.BOOLEAN]: ['eq'],
  [TYPES.DATE]: ['eq', 'ne', 'before', 'after', 'between', 'in', 'notIn'],
  [TYPES.ENUM]: ['eq', 'ne', 'in', 'notIn'],
  [TYPES.REFERENCE]: ['eq', 'ne', 'in', 'notIn']
};

export const field = ({
  key,
  path = key,
  label,
  type = TYPES.STRING,
  operators,
  allowedValues,
  reference,
  group = 'General',
  exportable = true,
  filterable = true,
  sortable = true,
  isItemField = false,
  width = 18,
  formatter = null,
  transform = null,
  expression = null
}) => ({
  key,
  path,
  label: label || key,
  type,
  operators: operators || OPERATORS[type] || [],
  allowedValues: allowedValues || [],
  reference,
  group,
  exportable,
  filterable,
  sortable,
  isItemField,
  width,
  formatter,
  transform,
  expression
});

export const toObjectId = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value.map(v => mongoose.Types.ObjectId.createFromHexString(String(v))).filter(Boolean);
  }
  return mongoose.Types.ObjectId.createFromHexString(String(value));
};

export const safeObjectIds = (values) => {
  if (!Array.isArray(values)) values = [values];
  return values
    .map(v => {
      try {
        return mongoose.Types.ObjectId.createFromHexString(String(v));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};

export const dateRangeMatch = (path, from, to) => {
  const match = {};
  if (from) match.$gte = new Date(from);
  if (to) {
    const t = new Date(to);
    t.setHours(23, 59, 59, 999);
    match.$lte = t;
  }
  return Object.keys(match).length ? { [path]: match } : {};
};

export const formatDateIN = (val) => {
  if (!val) return '';
  return new Date(val).toLocaleDateString('en-IN');
};
