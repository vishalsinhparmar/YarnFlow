import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  grnGetById,
  purchaseOrderGetById,
  warehouseGetAll
} = vi.hoisted(() => ({
  grnGetById: vi.fn(),
  purchaseOrderGetById: vi.fn(),
  warehouseGetAll: vi.fn()
}));

vi.mock('../services/grnAPI', () => ({
  grnAPI: {
    getById: grnGetById
  }
}));

vi.mock('../services/purchaseOrderAPI', () => ({
  purchaseOrderAPI: {
    getById: purchaseOrderGetById
  },
  poUtils: {
    calculateCompletion: (items) => {
      const ordered = items.reduce((sum, item) => sum + item.quantity, 0);
      const received = items.reduce((sum, item) => sum + item.receivedQuantity, 0);
      return ordered ? Math.round((received / ordered) * 100) : 0;
    },
    formatStatus: (status) => status.replaceAll('_', ' ')
  }
}));

vi.mock('../services/warehouseAPI', () => ({
  warehouseAPI: {
    getAll: warehouseGetAll
  }
}));

import GRNDetail from '../components/GRN/GRNDetail';
import PurchaseOrderDetail from '../components/PurchaseOrders/PurchaseOrderDetail';

const purchaseOrder = {
  _id: 'po-1',
  poNumber: 'PKRK/PO/004',
  status: 'Fully_Received',
  orderDate: '2026-07-30T00:00:00.000Z',
  expectedDeliveryDate: '2026-08-05T00:00:00.000Z',
  supplierDetails: { companyName: 'Apex International' },
  category: { categoryName: 'Yarn' },
  completionPercentage: 80,
  items: [{
    _id: 'po-item-1',
    product: 'product-1',
    productName: '2/40 VSF RMF',
    quantity: 5,
    weight: 210,
    receivedQuantity: 4,
    receivedWeight: 170,
    manuallyCompleted: true,
    completionReason: 'Supplier short closed',
    unit: 'Bags'
  }]
};

const grn = {
  _id: 'grn-1',
  grnNumber: 'PKRK/GRN/004',
  poNumber: 'PKRK/PO/004',
  receiptStatus: 'Complete',
  receiptDate: '2026-07-30T00:00:00.000Z',
  supplierDetails: { companyName: 'Apex International' },
  warehouseLocation: 'warehouse-1',
  items: [{
    _id: 'grn-item-1',
    product: 'product-1',
    productName: '2/40 VSF RMF',
    orderedQuantity: 5,
    orderedWeight: 210,
    receivedQuantity: 4,
    receivedWeight: 170,
    manuallyCompleted: true,
    completionReason: 'Supplier short closed',
    unit: 'Bags',
    receivedSubProductWeights: [50, 40, 40, 40]
  }]
};

describe('Procurement detail modals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    grnGetById.mockResolvedValue({ data: grn });
    purchaseOrderGetById.mockResolvedValue({ data: purchaseOrder });
    warehouseGetAll.mockResolvedValue({
      data: [{ _id: 'warehouse-1', name: 'Godown - Maryadpatti' }]
    });
  });

  it('opens the purchase-order shell immediately and renders refreshed receipt detail', async () => {
    render(
      <PurchaseOrderDetail
        isOpen
        onClose={vi.fn()}
        purchaseOrder={purchaseOrder}
      />
    );

    const loadingShell = screen.getByLabelText('Loading purchase order details');
    expect(loadingShell).toBeInTheDocument();
    expect(loadingShell.closest('.fixed')).toHaveClass(
      'top-16',
      'lg:left-[var(--sidebar-width)]'
    );
    expect(await screen.findByText('Order Summary')).toBeInTheDocument();
    expect(screen.getByText('Closed by Mark Final')).toBeInTheDocument();
    expect(screen.getByText('Remaining quantity was closed using Mark Final.')).toBeInTheDocument();

    await waitFor(() => {
      expect(purchaseOrderGetById).toHaveBeenCalledWith('po-1');
    });
  });

  it('loads current GRN data and resolves its warehouse name', async () => {
    render(
      <GRNDetail
        isOpen
        onClose={vi.fn()}
        grn={grn}
      />
    );

    expect(screen.getByLabelText('Loading GRN details')).toBeInTheDocument();
    expect(await screen.findByText('Receipt Summary')).toBeInTheDocument();
    expect(screen.getByText('Godown - Maryadpatti')).toBeInTheDocument();
    expect(screen.getByText('Closed by Mark Final')).toBeInTheDocument();

    await waitFor(() => {
      expect(grnGetById).toHaveBeenCalledWith('grn-1');
      expect(warehouseGetAll).toHaveBeenCalledOnce();
    });
  });
});
