import { API_BASE_URL } from './common.js';

async function downloadExcel(endpoint, filename, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}${endpoint}${qs ? `?${qs}` : ''}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to download report');
  }
  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export const reportsAPI = {
  inventory:      (params) => downloadExcel('/reports/inventory',       `Inventory_Report_${Date.now()}.xlsx`,      params),
  grn:            (params) => downloadExcel('/reports/grn',             `GRN_Report_${Date.now()}.xlsx`,            params),
  purchaseOrders: (params) => downloadExcel('/reports/purchase-orders', `PurchaseOrder_Report_${Date.now()}.xlsx`,  params),
  salesOrders:    (params) => downloadExcel('/reports/sales-orders',    `SalesOrder_Report_${Date.now()}.xlsx`,     params),
  salesChallans:  (params) => downloadExcel('/reports/sales-challans',  `SalesChallan_Report_${Date.now()}.xlsx`,   params),
  masterData:     ()       => downloadExcel('/reports/master-data',     `MasterData_Report_${Date.now()}.xlsx`),
};

export default reportsAPI;
