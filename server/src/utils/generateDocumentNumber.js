// utils/generateDocumentNumber.js
import Counter from '../models/Counter.js';

export const generateDocumentNumber = async ({
  type,        // 'GRN'
  prefix = 'PKRK',
  pad = 3
}) => {
  const counter = await Counter.findByIdAndUpdate(
    { _id: type },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `${prefix}/${type}/${String(counter.seq).padStart(pad, '0')}`;
};
