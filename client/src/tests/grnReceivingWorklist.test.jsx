import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getPurchaseOrder,
  getWarehouses,
  getSubProducts
} = vi.hoisted(() => ({
  getPurchaseOrder: vi.fn(),
  getWarehouses: vi.fn(),
  getSubProducts: vi.fn()
}));

const purchaseOrderSummary = {
  _id: 'po-1',
  poNumber: 'PKRK/PO/008',
  status: 'Partially_Received',
  supplierDetails: { companyName: 'CKT Freight Carriers Kolkata' },
  category: { categoryName: 'Yarn' }
};
const purchaseOrderList = [purchaseOrderSummary];

vi.mock('../hooks/usePaginatedSearch', () => ({
  usePaginatedSearch: () => ({
    items: purchaseOrderList,
    loading: false,
    loadingMore: false,
    hasMore: false,
    total: 1,
    handleSearch: vi.fn(),
    handleLoadMore: vi.fn(),
    setItems: vi.fn(),
    refresh: vi.fn()
  })
}));

vi.mock('../services/purchaseOrderAPI', () => ({
  purchaseOrderAPI: {
    getById: getPurchaseOrder
  }
}));

vi.mock('../services/warehouseAPI', () => ({
  default: {
    getAll: getWarehouses
  }
}));

vi.mock('../services/masterDataAPI', () => ({
  subProductAPI: {
    getAll: getSubProducts
  }
}));

vi.mock('../components/PurchaseOrders/PurchaseOrderForm', () => ({
  default: () => null
}));

import GRNForm from '../components/GRN/GRNForm';

describe('GRN receiving worklist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
    getWarehouses.mockResolvedValue({
      data: [{ _id: 'warehouse-1', name: 'Godown - Maryadpatti' }]
    });
    getSubProducts.mockResolvedValue({ success: true, data: [] });
    getPurchaseOrder.mockResolvedValue({
      data: {
        ...purchaseOrderSummary,
        items: [
          {
            _id: 'po-item-1',
            product: { _id: 'product-1' },
            productName: 'Hemp Yarn',
            subProduct: { _id: 'sub-7' },
            subProductName: '7',
            quantity: 4,
            receivedQuantity: 1,
            receivedWeight: 50,
            unit: 'Bags',
            weight: 180,
            subProductWeights: [50, 40, 40, 50]
          },
          {
            _id: 'po-item-2',
            product: { _id: 'product-2' },
            productName: 'Jute2102',
            quantity: 10,
            receivedQuantity: 0,
            unit: 'Bags',
            weight: 500
          }
        ]
      }
    });
  });

  it('presents the selected PO and preserves variant and standard receipt controls', async () => {
    render(
      <GRNForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        preSelectedPO="po-1"
      />
    );

    const heading = await screen.findByRole('heading', { name: 'Items to receive' });
    const worklist = heading.closest('section');
    const selectedPurchaseOrder = screen.getByText('PKRK/PO/008').closest('button');

    expect(within(selectedPurchaseOrder).getByText('CKT Freight Carriers Kolkata')).toBeInTheDocument();
    expect(within(selectedPurchaseOrder).getByText('Partially Received')).toBeInTheDocument();
    expect(within(worklist).getByText('Hemp Yarn X 7')).toBeInTheDocument();
    expect(within(worklist).getAllByText('Jute2102')).toHaveLength(2);
    expect(within(worklist).getByText('Exact unit weights (3)')).toBeInTheDocument();

    const variantQuantity = within(worklist).getByRole('spinbutton', {
      name: 'Received quantity for Hemp Yarn X 7'
    });
    const standardQuantity = within(worklist).getByRole('spinbutton', {
      name: 'Received quantity for Jute2102'
    });
    expect(variantQuantity).toHaveValue(3);
    expect(variantQuantity).toHaveAttribute('max', '3');
    expect(standardQuantity).toHaveValue(10);

    const standardWeight = within(worklist).getByRole('spinbutton', {
      name: 'Received weight for Jute2102'
    });
    expect(standardWeight).toHaveValue(500);
    expect(standardWeight).toBeEnabled();

    fireEvent.click(within(worklist).getAllByRole('checkbox')[0]);
    await waitFor(() => {
      expect(within(worklist).getByText('Marked final')).toBeInTheDocument();
    });
  });
});
