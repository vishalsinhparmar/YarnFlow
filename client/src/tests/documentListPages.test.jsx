import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  grnGetAll,
  grnGetStats,
  purchaseOrderGetAll,
  purchaseOrderGetStats,
  salesChallanGetAll,
  salesChallanGetStats
} = vi.hoisted(() => ({
  grnGetAll: vi.fn(),
  grnGetStats: vi.fn(),
  purchaseOrderGetAll: vi.fn(),
  purchaseOrderGetStats: vi.fn(),
  salesChallanGetAll: vi.fn(),
  salesChallanGetStats: vi.fn()
}));

vi.mock('../components/GRN/GRNForm', () => ({ default: () => null }));
vi.mock('../components/GRN/GRNDetail', () => ({ default: () => null }));
vi.mock('../components/PurchaseOrders/PurchaseOrderForm', () => ({ default: () => null }));
vi.mock('../components/PurchaseOrders/PurchaseOrderDetail', () => ({ default: () => null }));
vi.mock('../components/SalesChallan/CreateChallanModal', () => ({ default: () => null }));
vi.mock('../components/SalesChallan/ChallanDetailModal', () => ({ default: () => null }));

vi.mock('../services/grnAPI', () => ({
  grnAPI: {
    getAll: grnGetAll,
    getStats: grnGetStats
  },
  grnUtils: {
    formatDate: () => '30 Jul 2026'
  }
}));

vi.mock('../services/purchaseOrderAPI', () => ({
  purchaseOrderAPI: {
    getAll: purchaseOrderGetAll,
    getStats: purchaseOrderGetStats
  },
  poUtils: {
    formatDate: () => '30 Jul 2026',
    formatStatus: (status) => status,
    getStatusColor: () => 'bg-gray-100 text-gray-800',
    isOverdue: () => false
  }
}));

vi.mock('../services/salesChallanAPI', () => ({
  salesChallanAPI: {
    getAll: salesChallanGetAll,
    getStats: salesChallanGetStats
  },
  salesChallanUtils: {
    formatDate: () => '30 Jul 2026'
  }
}));

import GoodsReceipt from '../pages/GoodsReceipt';
import PurchaseOrder from '../pages/PurchaseOrder';
import SalesChallan from '../pages/SalesChallan';

const item = {
  _id: 'item-1',
  productName: '500 Gaze',
  subProductName: '11',
  quantity: 5,
  receivedQuantity: 5,
  dispatchQuantity: 5,
  orderedQuantity: 5,
  unit: 'Bags',
  weight: 250,
  receivedWeight: 250,
  subProductWeights: [50, 50, 50, 50, 50],
  receivedSubProductWeights: [50, 50, 50, 50, 50]
};

const purchaseOrder = {
  _id: 'po-1',
  poNumber: 'PKRK/PO/004',
  status: 'Fully_Received',
  orderDate: '2026-07-30T00:00:00.000Z',
  supplierDetails: { companyName: 'Apex International' },
  category: { categoryName: 'Yarn' },
  items: [item]
};

const grn = {
  _id: 'grn-1',
  grnNumber: 'PKRK/GRN/004',
  poNumber: 'PKRK/PO/004',
  purchaseOrder,
  receiptStatus: 'Complete',
  receiptDate: '2026-07-30T00:00:00.000Z',
  supplierDetails: { companyName: 'Apex International' },
  items: [item]
};

const challan = {
  _id: 'challan-1',
  challanNumber: 'PKRK/SC/004',
  soNumber: 'PKRK/SO/004',
  soReference: 'PKRK/SO/004',
  salesOrder: { _id: 'so-1', soNumber: 'PKRK/SO/004', status: 'Delivered' },
  customerName: 'ERP Customer',
  customerDetails: { companyName: 'ERP Customer' },
  challanDate: '2026-07-30T00:00:00.000Z',
  items: [item]
};

const renderInRouter = (component) => render(
  <MemoryRouter>{component}</MemoryRouter>
);

describe('Document list pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    purchaseOrderGetStats.mockResolvedValue({ data: {} });
    purchaseOrderGetAll.mockResolvedValue({
      data: [purchaseOrder],
      pagination: { current: 1, pages: 1, total: 1, limit: 10 }
    });
    grnGetStats.mockResolvedValue({ data: {} });
    grnGetAll.mockResolvedValue({
      data: [grn],
      pagination: { current: 1, pages: 1, total: 1, limit: 50 }
    });
    salesChallanGetStats.mockResolvedValue({
      success: true,
      data: { overview: { totalChallans: 1, thisMonth: 1 } }
    });
    salesChallanGetAll.mockResolvedValue({
      success: true,
      data: [challan],
      pagination: { totalPages: 1 }
    });
  });

  it('loads purchase orders once and keeps each item with its quantity and weight', async () => {
    renderInRouter(<PurchaseOrder />);

    const product = await screen.findByText('500 Gaze X 11');
    const itemCell = product.closest('td');
    expect(within(itemCell).getByText('5 Bags')).toBeInTheDocument();
    expect(within(itemCell).getByText('250.00 kg')).toBeInTheDocument();
    expect(purchaseOrderGetAll).toHaveBeenCalledOnce();

    fireEvent.change(screen.getByPlaceholderText(/search pos/i), {
      target: { value: 'Apex' }
    });
    await waitFor(() => {
      expect(purchaseOrderGetAll).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'Apex' })
      );
    });
  });

  it('loads GRNs once and keeps received item metrics on the same visual row', async () => {
    renderInRouter(<GoodsReceipt />);

    const product = await screen.findByText('500 Gaze X 11');
    const itemCell = product.closest('td');
    expect(within(itemCell).getByText('5 Bags')).toBeInTheDocument();
    expect(within(itemCell).getByText('250.00 kg')).toBeInTheDocument();
    expect(grnGetAll).toHaveBeenCalledOnce();

    fireEvent.change(screen.getByPlaceholderText(/search grns/i), {
      target: { value: 'PKRK/GRN/004' }
    });
    await waitFor(() => {
      expect(grnGetAll).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'PKRK/GRN/004' })
      );
    });
  });

  it('keeps challan item metrics aligned and sends the search term to the API', async () => {
    renderInRouter(<SalesChallan />);

    const product = await screen.findByText('500 Gaze X 11');
    const itemCell = product.closest('td');
    expect(within(itemCell).getByText('5 Bags')).toBeInTheDocument();
    expect(within(itemCell).getByText('250.00 kg')).toBeInTheDocument();
    expect(salesChallanGetAll).toHaveBeenCalledOnce();

    fireEvent.change(screen.getByPlaceholderText(/search challans/i), {
      target: { value: 'ERP Customer' }
    });
    await waitFor(() => {
      expect(salesChallanGetAll).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'ERP Customer' })
      );
    });
  });
});
