import mongoose from 'mongoose';
import { getReportDefinition } from './report.registry.js';

export const getReferenceOptions = async (reportKey, fieldKey) => {
  const definition = getReportDefinition(reportKey);
  if (!definition) {
    const error = new Error(`Unknown report: ${reportKey}`);
    error.status = 404;
    throw error;
  }

  const field = definition.fields.find(f => f.key === fieldKey);
  if (!field) {
    const error = new Error(`Field ${fieldKey} not found`);
    error.status = 400;
    throw error;
  }

  // Check for reference field or hasLookup field
  const lookupConfig = field.reference || field.hasLookup;
  if (!lookupConfig) {
    const error = new Error(`Field ${fieldKey} does not have lookup options`);
    error.status = 400;
    throw error;
  }

  const { model, displayField, valueField } = lookupConfig;
  const ModelClass = mongoose.model(model);
  const actualValueField = valueField || '_id';
  const actualDisplayField = displayField || 'name';

  const options = await ModelClass
    .find({}, { [actualValueField]: 1, [actualDisplayField]: 1 })
    .sort({ [actualDisplayField]: 1 })
    .lean();

  return options.map(opt => ({
    value: actualValueField === '_id' ? opt._id.toString() : opt[actualValueField],
    label: opt[actualDisplayField] || '(Unnamed)'
  }));
};
