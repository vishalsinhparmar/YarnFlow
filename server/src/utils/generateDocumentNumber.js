// utils/generateDocumentNumber.js
import Counter from '../models/Counter.js';

export const generateDocumentNumber = async ({
  type,        // 'GRN', 'PO', 'SO', 'SC'
  prefix = '',  // Optional prefix (e.g., 'PKRK')
  pad = 3
}) => {
  const counter = await Counter.findByIdAndUpdate(
    { _id: type },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedNumber = String(counter.seq).padStart(pad, '0');
  
  // Build document number with optional prefix
  if (prefix) {
    return `${prefix}/${type}/${paddedNumber}`;
  }
  return `${type}/${paddedNumber}`;
};
