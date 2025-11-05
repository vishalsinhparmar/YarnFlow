// Warehouse Location Constants
// These are the fixed warehouse locations used throughout the application

export const WAREHOUSE_LOCATIONS = [
  {
    id: 'shop-chakinayat',
    name: 'Shop - Chakinayat',
    code: 'SHP-CHK',
    type: 'Shop'
  },
  {
    id: 'maryadpatti-godown',
    name: 'Maryadpatti - Godown',
    code: 'MYD-GDN',
    type: 'Godown'
  },
  {
    id: 'others',
    name: 'Others',
    code: 'OTH',
    type: 'Others'
  }
];

// Helper function to get warehouse name by ID
export const getWarehouseName = (warehouseId) => {
  const warehouse = WAREHOUSE_LOCATIONS.find(w => w.id === warehouseId);
  return warehouse ? warehouse.name : warehouseId || 'N/A';
};

// Helper function to get warehouse by ID
export const getWarehouseById = (warehouseId) => {
  return WAREHOUSE_LOCATIONS.find(w => w.id === warehouseId);
};

// Helper function to get all warehouse names as array
export const getWarehouseNames = () => {
  return WAREHOUSE_LOCATIONS.map(w => w.name);
};

// Helper function to get warehouse options for dropdown
export const getWarehouseOptions = () => {
  return WAREHOUSE_LOCATIONS.map(w => ({
    value: w.id,
    label: w.name
  }));
};
