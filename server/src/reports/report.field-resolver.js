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
  if (!field || field.type !== 'reference' || !field.reference) {
    const error = new Error(`Field ${fieldKey} is not a reference field`);
    error.status = 400;
    throw error;
  }

  const { reference } = field;
  const model = mongoose.model(reference.model);
  const valueField = reference.valueField || '_id';
  const displayField = reference.displayField || 'name';

  const options = await model
    .find({}, { [valueField]: 1, [displayField]: 1 })
    .sort({ [displayField]: 1 })
    .lean();

  return options.map(opt => ({
    value: valueField === '_id' ? opt._id.toString() : opt[valueField],
    label: opt[displayField] || '(Unnamed)'
  }));
};
