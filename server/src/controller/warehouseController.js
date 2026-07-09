import WarehouseLocation from '../models/WarehouseLocation.js';

// Cache for warehouse name lookups (invalidated on any mutation)
let _cache = null;
export async function resolveWarehouseName(idOrName) {
  if (!idOrName) return '';
  if (!_cache) {
    const all = await WarehouseLocation.find().lean();
    _cache = {};
    all.forEach(w => { _cache[w._id.toString()] = w.name; _cache[w.name] = w.name; });
  }
  return _cache[idOrName.toString()] || idOrName;
}
export function clearWarehouseCache() { _cache = null; }

const DEFAULT_LOCATIONS = [
  { name: 'Shop - Chakinayat',   code: 'SHP-CHK', type: 'Shop' },
  { name: 'Godown - Maryadpatti',code: 'MYD-GDN', type: 'Godown' },
  { name: 'Others',              code: 'OTH',     type: 'Others' }
];

async function seedDefaults() {
  const count = await WarehouseLocation.countDocuments();
  if (count === 0) {
    await WarehouseLocation.insertMany(DEFAULT_LOCATIONS);
  }
}

export const getAll = async (req, res) => {
  try {
    await seedDefaults();
    const { includeInactive } = req.query;
    const filter = includeInactive === 'true' ? {} : { isActive: true };
    const locations = await WarehouseLocation.find(filter).sort({ name: 1 });
    return res.json({ success: true, data: locations });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { name, code, type, address } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: 'name and code are required' });
    const exists = await WarehouseLocation.findOne({ code: code.toUpperCase().trim() });
    if (exists) return res.status(409).json({ success: false, message: 'Location code already exists' });
    const loc = await WarehouseLocation.create({ name, code, type, address });
    clearWarehouseCache();
    return res.status(201).json({ success: true, data: loc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, type, address, isActive } = req.body;
    if (code) {
      const exists = await WarehouseLocation.findOne({ code: code.toUpperCase().trim(), _id: { $ne: id } });
      if (exists) return res.status(409).json({ success: false, message: 'Location code already exists' });
    }
    const loc = await WarehouseLocation.findByIdAndUpdate(
      id,
      { name, code, type, address, isActive },
      { new: true, runValidators: true }
    );
    if (!loc) return res.status(404).json({ success: false, message: 'Location not found' });
    clearWarehouseCache();
    return res.json({ success: true, data: loc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const loc = await WarehouseLocation.findByIdAndDelete(req.params.id);
    if (!loc) return res.status(404).json({ success: false, message: 'Location not found' });
    clearWarehouseCache();
    return res.json({ success: true, message: 'Location deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
