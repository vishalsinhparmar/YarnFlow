import mongoose from 'mongoose';

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toObjectIds = (values) => {
  const arr = Array.isArray(values) ? values : [values];
  return arr
    .map(v => {
      try {
        if (mongoose.Types.ObjectId.isValid(String(v))) {
          return new mongoose.Types.ObjectId(String(v));
        }
      } catch {
        // ignore invalid ObjectId
      }
      return null;
    })
    .filter(Boolean);
};

const coerceValue = (field, rawValue) => {
  if (rawValue === null || rawValue === undefined) return null;

  switch (field.type) {
    case 'number':
      return Number(rawValue);
    case 'boolean':
      if (typeof rawValue === 'boolean') return rawValue;
      return String(rawValue).toLowerCase() === 'true';
    case 'date':
      return new Date(rawValue);
    case 'reference':
      // Check if this reference uses ObjectId or a string value
      const valueField = field.reference?.valueField;
      if (valueField && valueField !== '_id') {
        // String-based reference (e.g., warehouse with valueField: 'name')
        return String(rawValue);
      }
      // ObjectId-based reference
      return toObjectIds(rawValue);
    case 'enum':
      return String(rawValue);
    case 'string':
    default:
      return String(rawValue);
  }
};

const getMatchPath = (field, isItemLevel) => {
  if (field.expression) return field.key;
  if (isItemLevel) return field.path;
  return field.path;
};

const buildSingleCondition = (field, operator, rawValue, rawValueTo, isItemLevel) => {
  const path = getMatchPath(field, isItemLevel);

  if (operator === 'between') {
    const from = coerceValue(field, rawValue);
    const to = coerceValue(field, rawValueTo);
    const range = {};
    if (field.type === 'date' && to instanceof Date) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      range.$gte = from;
      range.$lte = end;
    } else {
      range.$gte = from;
      range.$lte = to;
    }
    return { [path]: range };
  }

  // Check if this is a reference field that uses ObjectId as valueField
  const isObjectIdReference = field.type === 'reference' && (!field.reference?.valueField || field.reference?.valueField === '_id');
  const rawValueAsReference = isObjectIdReference && !['in', 'notIn'].includes(operator);
  const value = rawValueAsReference ? toObjectIds(rawValue)[0] : coerceValue(field, rawValue);

  switch (operator) {
    case 'eq':
      return { [path]: { $eq: value } };
    case 'ne':
      return { [path]: { $ne: value } };
    case 'gt':
      return { [path]: { $gt: value } };
    case 'gte':
      return { [path]: { $gte: value } };
    case 'lt':
      return { [path]: { $lt: value } };
    case 'lte':
      return { [path]: { $lte: value } };
    case 'contains':
      return { [path]: { $regex: escapeRegex(value), $options: 'i' } };
    case 'startsWith':
      return { [path]: { $regex: `^${escapeRegex(value)}`, $options: 'i' } };
    case 'in': {
      const inArr = Array.isArray(rawValue) ? rawValue : [rawValue];
      const mappedValues = isObjectIdReference 
        ? inArr.map(v => toObjectIds(v)[0]).filter(Boolean)
        : inArr.map(v => coerceValue(field, v));
      return { [path]: { $in: mappedValues } };
    }
    case 'notIn': {
      const ninArr = Array.isArray(rawValue) ? rawValue : [rawValue];
      const mappedValues = isObjectIdReference 
        ? ninArr.map(v => toObjectIds(v)[0]).filter(Boolean)
        : ninArr.map(v => coerceValue(field, v));
      return { [path]: { $nin: mappedValues } };
    }
    case 'after':
      return { [path]: { $gt: value } };
    case 'before':
      return { [path]: { $lt: value } };
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
};

const buildGroupMatch = (group, definition, isItemLevel) => {
  if (!group || !Array.isArray(group.filters) || group.filters.length === 0) return null;

  const conditions = group.filters.map(f => {
    const field = definition.fields.find(fd => fd.key === f.fieldKey);
    return buildSingleCondition(field, f.operator, f.value, f.valueTo, isItemLevel);
  });

  if (conditions.length === 1) return conditions[0];
  return group.condition === 'or' ? { $or: conditions } : { $and: conditions };
};

const buildMatchStage = (filters, definition, isItemLevel) => {
  const { groups, condition } = filters;
  const groupMatches = groups.map(g => buildGroupMatch(g, definition, isItemLevel)).filter(Boolean);
  if (groupMatches.length === 0) return null;
  if (groupMatches.length === 1) return { $match: groupMatches[0] };
  return { $match: condition === 'or' ? { $or: groupMatches } : { $and: groupMatches } };
};

const collectRequiredExpressionFields = (definition, { selectedFields, filters, sort }) => {
  const required = new Set();

  for (const key of selectedFields) {
    const field = definition.fields.find(f => f.key === key);
    if (field?.expression) required.add(key);
  }

  for (const group of filters.groups) {
    for (const f of group.filters) {
      const field = definition.fields.find(fd => fd.key === f.fieldKey);
      if (field?.expression) required.add(f.fieldKey);
    }
  }

  for (const s of sort) {
    const field = definition.fields.find(f => f.key === s.fieldKey);
    if (field?.expression) required.add(s.fieldKey);
  }

  return Array.from(required);
};

const buildExpressionAddFields = (definition, expressionKeys) => {
  if (expressionKeys.length === 0) return null;
  const addFields = {};
  for (const key of expressionKeys) {
    const field = definition.fields.find(f => f.key === key);
    if (field?.expression) addFields[key] = field.expression;
  }
  return Object.keys(addFields).length ? { $addFields: addFields } : null;
};

const buildLookups = (definition) => {
  const stages = [];
  
  // First, add explicit lookups from definition
  if (Array.isArray(definition.lookups)) {
    for (const lookup of definition.lookups) {
      stages.push({
        $lookup: {
          from: lookup.from,
          localField: lookup.localField,
          foreignField: lookup.foreignField,
          as: lookup.as
        }
      });
      if (lookup.unwind) {
        stages.push({
          $unwind: {
            path: `$${lookup.as}`,
            preserveNullAndEmptyArrays: true
          }
        });
      }
    }
  }
  
  // Auto-generate lookups for reference fields to resolve names
  const referenceFields = definition.fields.filter(f => f.type === 'reference' && f.reference);
  const modelCollectionMap = {
    'Product': 'products',
    'Category': 'categories',
    'Supplier': 'suppliers',
    'SubProduct': 'subproducts',
    'Customer': 'customers',
    'GoodsReceiptNote': 'goodsreceiptnotes',
    'PurchaseOrder': 'purchaseorders',
    'SalesOrder': 'salesorders',
    'SalesChallan': 'saleschallans',
    'Warehouse': 'warehouselocations',
    'WarehouseLocation': 'warehouselocations',
    'User': 'users'
  };
  
  for (const field of referenceFields) {
    const { model, displayField, valueField } = field.reference;
    const collection = modelCollectionMap[model] || model.toLowerCase() + 's';
    const lookupAs = `${field.key}_lookup`;
    
    // Check if this lookup already exists
    const alreadyExists = stages.some(s => s.$lookup && s.$lookup.as === lookupAs);
    if (alreadyExists) continue;
    
    // Determine the foreign field to match on
    // If valueField is specified and not '_id', use that; otherwise use '_id'
    const foreignField = (valueField && valueField !== '_id') ? valueField : '_id';
    
    // For item-level fields (e.g., items.category), use the path directly
    const localField = field.path || field.key;
    
    stages.push({
      $lookup: {
        from: collection,
        localField: localField,
        foreignField: foreignField,
        as: lookupAs
      }
    });
    
    // Unwind the lookup result
    stages.push({
      $unwind: {
        path: `$${lookupAs}`,
        preserveNullAndEmptyArrays: true
      }
    });
    
    // Add a field that shows the display value
    // For item-level fields, we need to update the nested field
    if (field.isItemField && definition.itemArrayPath) {
      stages.push({
        $addFields: {
          [localField]: `$${lookupAs}.${displayField}`
        }
      });
    } else {
      stages.push({
        $addFields: {
          [field.key]: `$${lookupAs}.${displayField}`
        }
      });
    }
  }
  
  return stages;
};

const buildProjection = (definition, selectedFields) => {
  const projection = {};
  for (const key of selectedFields) {
    const field = definition.fields.find(f => f.key === key);
    if (!field) continue;
    if (field.expression) {
      projection[key] = `$${key}`;
    } else {
      projection[key] = `$${field.path}`;
    }
  }
  return { $project: projection };
};

const buildSort = (definition, sort) => {
  if (!sort || sort.length === 0) return null;
  const sortDoc = {};
  for (const s of sort) {
    const field = definition.fields.find(f => f.key === s.fieldKey);
    if (!field) continue;
    // Use the field path directly (without $ prefix for $sort stage)
    const path = field.path || field.key;
    sortDoc[path] = s.direction;
  }
  return Object.keys(sortDoc).length > 0 ? { $sort: sortDoc } : null;
};

const buildDateRangeMatch = (definition, dateRange) => {
  if (!dateRange || !dateRange.startDate || !dateRange.endDate) return null;
  
  // Find the primary date field (usually createdAt or a similar timestamp field)
  const dateField = definition.fields.find(f => f.type === 'date' && f.key === 'createdAt') ||
                    definition.fields.find(f => f.type === 'date' && f.isDateFilter);
  
  if (!dateField) return null;
  
  const startDate = new Date(dateRange.startDate);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(dateRange.endDate);
  endDate.setHours(23, 59, 59, 999);
  
  return {
    $match: {
      [dateField.path]: {
        $gte: startDate,
        $lte: endDate
      }
    }
  };
};

export const buildPreviewPipeline = (definition, validatedPayload, pagination) => {
  const { selectedFields, filters, sort, dateRange } = validatedPayload;
  const expressionKeys = collectRequiredExpressionFields(definition, validatedPayload);

  const pipeline = [];

  // 1. Pre-compute expression fields so root filters/sort can use them
  const expressionStage = buildExpressionAddFields(definition, expressionKeys);
  if (expressionStage) pipeline.push(expressionStage);

  // 2. Date range filter (applied early for efficiency)
  const dateRangeMatch = buildDateRangeMatch(definition, dateRange);
  if (dateRangeMatch) pipeline.push(dateRangeMatch);

  // 3. Root-level match
  const rootMatch = buildMatchStage(filters, definition, false);
  if (rootMatch) pipeline.push(rootMatch);

  // 3. Lookups before unwinding to keep reference resolution efficient
  const lookups = buildLookups(definition);
  pipeline.push(...lookups);

  // 4. Item expansion if configured
  if (definition.itemArrayPath) {
    pipeline.push({ $unwind: `$${definition.itemArrayPath}` });
    const itemMatch = buildMatchStage(filters, definition, true);
    if (itemMatch) pipeline.push(itemMatch);
  }

  // 5. Sort on original paths before projection
  const sortStage = buildSort(definition, sort);
  if (sortStage) pipeline.push(sortStage);

  // 6. Projection
  pipeline.push(buildProjection(definition, selectedFields));

  // 7. Facet for count + paginated data
  pipeline.push({
    $facet: {
      total: [{ $count: 'count' }],
      data: [{ $skip: pagination.skip }, { $limit: pagination.limit }]
    }
  });

  return pipeline;
};

export const buildExportPipeline = (definition, validatedPayload, maxRows) => {
  const { selectedFields, filters, sort, dateRange } = validatedPayload;
  const expressionKeys = collectRequiredExpressionFields(definition, validatedPayload);

  const pipeline = [];

  // 1. Pre-compute expression fields
  const expressionStage = buildExpressionAddFields(definition, expressionKeys);
  if (expressionStage) pipeline.push(expressionStage);

  // 2. Date range filter
  const dateRangeMatch = buildDateRangeMatch(definition, dateRange);
  if (dateRangeMatch) pipeline.push(dateRangeMatch);

  // 3. Root-level match
  const rootMatch = buildMatchStage(filters, definition, false);
  if (rootMatch) pipeline.push(rootMatch);

  // 4. Lookups
  const lookups = buildLookups(definition);
  pipeline.push(...lookups);

  // 5. Item expansion if configured
  if (definition.itemArrayPath) {
    pipeline.push({ $unwind: `$${definition.itemArrayPath}` });
    const itemMatch = buildMatchStage(filters, definition, true);
    if (itemMatch) pipeline.push(itemMatch);
  }

  // 6. Sort on original paths before projection
  const sortStage = buildSort(definition, sort);
  if (sortStage) pipeline.push(sortStage);

  // 7. Projection
  pipeline.push(buildProjection(definition, selectedFields));

  // 8. Limit
  pipeline.push({ $limit: maxRows });

  return pipeline;
};
