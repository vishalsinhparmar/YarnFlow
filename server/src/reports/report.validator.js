import mongoose from 'mongoose';
import { getReportDefinition } from './report.registry.js';

const VALID_CONDITIONS = new Set(['and', 'or']);
const VALID_DIRECTIONS = new Set(['asc', 'desc', 'ascending', 'descending']);
const MAX_SELECTED_FIELDS = 100;
const MAX_SORT_FIELDS = 5;
const MAX_FILTER_GROUPS = 3;
const MAX_FILTERS_PER_GROUP = 20;
const MAX_IN_ARRAY_LENGTH = 500;

export const REPORT_PREVIEW_LIMIT = 50;
export const REPORT_EXPORT_LIMIT = 50000;

export class ReportValidationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'ReportValidationError';
    this.status = status;
  }
}

export const validateReportKey = (reportKey) => {
  if (!reportKey || typeof reportKey !== 'string') {
    throw new ReportValidationError('Report key is required');
  }
  const definition = getReportDefinition(reportKey);
  if (!definition) {
    throw new ReportValidationError(`Unknown report: ${reportKey}`, 404);
  }
  return definition;
};

const validateFieldKey = (definition, key, context = 'selection') => {
  const field = definition.fields.find(f => f.key === key);
  if (!field) {
    throw new ReportValidationError(`Unsupported ${context} field: ${key}`);
  }
  return field;
};

const isValidObjectId = (value) => {
  try {
    if (Array.isArray(value)) {
      return value.every(v => mongoose.Types.ObjectId.isValid(String(v)));
    }
    return mongoose.Types.ObjectId.isValid(String(value));
  } catch {
    return false;
  }
};

const isEmptyValue = (v) => v === undefined || v === null || v === '';

const validateValueForOperator = (field, operator, value, valueTo) => {
  if (operator === 'between') {
    if (isEmptyValue(value) || isEmptyValue(valueTo)) {
      throw new ReportValidationError(`Between operator requires both values for ${field.key}`);
    }
    if (field.type === 'number') {
      if (Number.isNaN(Number(value)) || Number.isNaN(Number(valueTo))) {
        throw new ReportValidationError(`Invalid number range for ${field.key}`);
      }
    }
    return;
  }

  if (['in', 'notIn'].includes(operator)) {
    if (!Array.isArray(value) || value.length === 0) {
      throw new ReportValidationError(`Operator ${operator} requires a non-empty array for ${field.key}`);
    }
    if (value.length > MAX_IN_ARRAY_LENGTH) {
      throw new ReportValidationError(`Too many values for ${field.key}`);
    }
    if (field.type === 'reference' && !isValidObjectId(value)) {
      throw new ReportValidationError(`Invalid ObjectId in reference filter for ${field.key}`);
    }
    return;
  }

  if (isEmptyValue(value)) {
    throw new ReportValidationError(`Value is required for ${field.key}`);
  }

  if (field.type === 'date') {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new ReportValidationError(`Invalid date value for ${field.key}`);
    }
  }

  if (field.type === 'number' && operator !== 'in' && operator !== 'notIn') {
    const num = Number(value);
    if (Number.isNaN(num)) {
      throw new ReportValidationError(`Invalid number value for ${field.key}`);
    }
  }

  if (field.type === 'reference' && operator !== 'in' && operator !== 'notIn' && !isValidObjectId(value)) {
    throw new ReportValidationError(`Invalid ObjectId for reference field ${field.key}`);
  }

  if (field.type === 'boolean' && typeof value !== 'boolean') {
    throw new ReportValidationError(`Boolean value required for ${field.key}`);
  }

  if (field.type === 'enum' && field.allowedValues?.length && !field.allowedValues.includes(value)) {
    throw new ReportValidationError(`Invalid enum value for ${field.key}`);
  }
};

const validateFilterGroup = (definition, group, groupIndex = 0) => {
  if (!group || typeof group !== 'object') {
    throw new ReportValidationError('Filter group must be an object');
  }

  const condition = group.condition || 'and';
  if (!VALID_CONDITIONS.has(condition)) {
    throw new ReportValidationError(`Invalid filter condition: ${condition}`);
  }

  const filters = Array.isArray(group.filters) ? group.filters : [];
  if (filters.length > MAX_FILTERS_PER_GROUP) {
    throw new ReportValidationError(`Too many filters in group ${groupIndex + 1}`);
  }

  const validated = [];
  for (const filter of filters) {
    if (!filter || typeof filter !== 'object') continue;
    const field = validateFieldKey(definition, filter.field, 'filter');
    if (!field.filterable) {
      throw new ReportValidationError(`Field ${field.key} is not filterable`);
    }
    if (!field.operators.includes(filter.operator)) {
      throw new ReportValidationError(`Operator ${filter.operator} not allowed for ${field.key}`);
    }
    validateValueForOperator(field, filter.operator, filter.value, filter.valueTo);
    validated.push({
      fieldKey: field.key,
      operator: filter.operator,
      value: filter.value,
      valueTo: filter.valueTo,
      isItemField: field.isItemField
    });
  }

  return { condition, filters: validated };
};

export const validatePayload = (definition, payload = {}) => {
  const selectedFields = Array.isArray(payload.selectedFields) ? payload.selectedFields : [];
  if (selectedFields.length === 0) {
    throw new ReportValidationError('At least one field must be selected');
  }
  if (selectedFields.length > MAX_SELECTED_FIELDS) {
    throw new ReportValidationError('Too many fields selected');
  }

  const fieldMap = new Map();
  for (const key of selectedFields) {
    const field = validateFieldKey(definition, key, 'selected');
    if (!field.exportable) {
      throw new ReportValidationError(`Field ${field.key} is not exportable`);
    }
    fieldMap.set(key, field);
  }

  let filters = { condition: 'and', groups: [] };
  const rawFilters = payload.filters;
  if (rawFilters) {
    if (typeof rawFilters !== 'object') {
      throw new ReportValidationError('Filters must be an object');
    }

    if (Array.isArray(rawFilters.groups)) {
      if (rawFilters.groups.length > MAX_FILTER_GROUPS) {
        throw new ReportValidationError('Too many filter groups');
      }
      filters.condition = VALID_CONDITIONS.has(rawFilters.condition) ? rawFilters.condition : 'and';
      filters.groups = rawFilters.groups.map((g, i) => validateFilterGroup(definition, g, i));
    } else {
      filters.groups = [validateFilterGroup(definition, rawFilters, 0)];
    }
  }

  const rawSort = payload.sort || [];
  const sortInput = Array.isArray(rawSort) ? rawSort : [rawSort].filter(Boolean);
  if (sortInput.length > MAX_SORT_FIELDS) {
    throw new ReportValidationError('Too many sort fields');
  }

  const sort = [];
  for (const s of sortInput) {
    if (!s || typeof s !== 'object') continue;
    const field = validateFieldKey(definition, s.field, 'sort');
    if (!field.sortable) {
      throw new ReportValidationError(`Field ${field.key} is not sortable`);
    }
    const direction = s.direction || s.order || 'asc';
    if (!VALID_DIRECTIONS.has(direction)) {
      throw new ReportValidationError(`Invalid sort direction: ${direction}`);
    }
    sort.push({ fieldKey: field.key, direction: direction === 'desc' || direction === 'descending' ? -1 : 1 });
  }

  let dateRange = null;
  const rawDateRange = payload.dateRange;
  if (rawDateRange && typeof rawDateRange === 'object') {
    const startDate = rawDateRange.startDate ? new Date(rawDateRange.startDate) : null;
    const endDate = rawDateRange.endDate ? new Date(rawDateRange.endDate) : null;
    if (startDate && !isNaN(startDate.getTime()) && endDate && !isNaN(endDate.getTime())) {
      if (startDate > endDate) {
        throw new ReportValidationError('Start date must be before end date');
      }
      dateRange = { startDate, endDate };
    }
  }

  return { selectedFields, fieldMap, filters, sort, dateRange };
};

export const validatePagination = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || REPORT_PREVIEW_LIMIT));
  return { page, limit, skip: (page - 1) * limit };
};

export const validateSavedReport = (definition, body = {}, user) => {
  const name = String(body.name || '').trim();
  if (!name) {
    throw new ReportValidationError('Saved report name is required');
  }
  const config = validatePayload(definition, body.config || {});
  return {
    name: name.substring(0, 120),
    reportKey: definition.key,
    config: {
      selectedFields: config.selectedFields,
      filters: config.filters,
      sort: config.sort
    },
    createdBy: user?.email || 'System'
  };
};
