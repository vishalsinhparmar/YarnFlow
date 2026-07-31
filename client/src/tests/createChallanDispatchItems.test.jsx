import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getSalesOrder,
  getDispatchedQuantities,
  inventoryLotsRequest
} = vi.hoisted(() => ({
  getSalesOrder: vi.fn(),
  getDispatchedQuantities: vi.fn(),
  inventoryLotsRequest: vi.fn()
}));

const salesOrderSummary = {
  _id: 'so-1',
  soNumber: 'PKRK/SO/008',
  status: 'Partial',
  customer: { companyName: 'ERP Customer' },
  category: { categoryName: 'Yarn' }
};
const salesOrderList = [salesOrderSummary];

vi.mock('../hooks/usePaginatedSearch', () => ({
  usePaginatedSearch: () => ({
    items: salesOrderList,
    setItems: vi.fn(),
    loading: false,
    loadingMore: false,
    hasMore: false,
    total: 1,
    handleSearch: vi.fn(),
    handleLoadMore: vi.fn(),
    refresh: vi.fn()
  })
}));

vi.mock('../services/salesOrderAPI', () => ({
  salesOrderAPI: {
    getById: getSalesOrder
  }
}));

vi.mock('../services/salesChallanAPI', () => ({
  salesChallanAPI: {
    getDispatchedQuantities
  }
}));

vi.mock('../services/common', () => ({
  apiRequest: inventoryLotsRequest
}));

vi.mock('../components/SalesOrders/NewSalesOrderModal', () => ({
  default: () => null
}));

import CreateChallanModal from '../components/SalesChallan/CreateChallanModal';

describe('Create challan dispatch worklist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSalesOrder.mockResolvedValue({
      success: true,
      data: {
        ...salesOrderSummary,
        createdAt: '2026-07-31T00:00:00.000Z',
        items: [
          {
            _id: 'so-item-1',
            product: { _id: 'product-1', productName: '2/40 VSF RMF' },
            subProduct: { _id: 'sub-1' },
            subProductName: '3',
            quantity: 4,
            unit: 'Bags',
            weight: 180,
            subProductWeights: [50, 40, 40, 50],
            notes: 'Priority dispatch'
          },
          {
            _id: 'so-item-2',
            product: { _id: 'product-2', productName: '10 No Multi' },
            quantity: 10,
            unit: 'Rolls',
            weight: 500
          }
        ]
      }
    });
    getDispatchedQuantities.mockResolvedValue({
      success: true,
      data: [
        {
          salesOrderItem: 'so-item-1',
          totalDispatched: 1,
          manuallyCompleted: false
        }
      ]
    });
    inventoryLotsRequest.mockResolvedValue({
      success: true,
      data: [
        {
          warehouse: 'Godown - Maryadpatti',
          currentQuantity: 100
        }
      ]
    });
  });

  it('presents variant and standard lines without changing dispatch controls', async () => {
    render(
      <CreateChallanModal
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        preSelectedOrderId="so-1"
      />
    );

    const heading = await screen.findByRole('heading', { name: 'Items to dispatch' });
    const worklist = heading.closest('section');
    const selectedSalesOrder = screen.getByText('PKRK/SO/008').closest('button');

    expect(within(selectedSalesOrder).getByText('ERP Customer')).toBeInTheDocument();
    expect(within(selectedSalesOrder).getByText('Partial')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Selected order details' })).toBeInTheDocument();
    expect(within(worklist).queryByText(/pending lines?/i)).not.toBeInTheDocument();
    expect(within(worklist).queryByText(/order line|variant lines/i)).not.toBeInTheDocument();
    expect(within(worklist).queryByText('Standard product')).not.toBeInTheDocument();
    expect(within(worklist).queryByText(/kg ordered/i)).not.toBeInTheDocument();
    expect(within(worklist).getByText('2/40 VSF RMF X 3')).toBeInTheDocument();
    expect(within(worklist).getAllByText('10 No Multi')).toHaveLength(2);
    expect(within(worklist).getByText(/Previously dispatched:/)).toBeInTheDocument();
    expect(within(worklist).getByText('Exact bag weights (3)')).toBeInTheDocument();

    const quantityInputs = within(worklist).getAllByRole('spinbutton', {
      name: /Dispatch quantity for/
    });
    expect(quantityInputs[0]).toHaveValue(3);
    expect(quantityInputs[0]).toHaveAttribute('max', '3');
    expect(quantityInputs[0]).toHaveAttribute('step', '1');
    expect(quantityInputs[1]).toHaveValue(10);
    expect(quantityInputs[1]).toHaveAttribute('step', '0.01');

    const weightInputs = within(worklist).getAllByRole('spinbutton', {
      name: /Dispatch weight for/
    });
    expect(weightInputs[0]).toBeDisabled();
    expect(weightInputs[1]).toBeEnabled();

    fireEvent.click(within(worklist).getAllByRole('checkbox')[0]);
    await waitFor(() => {
      expect(within(worklist).getByText('Marked final')).toBeInTheDocument();
    });
  });
});
