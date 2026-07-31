import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  salesOrderGetById,
  salesChallanGetById,
  salesChallansBySalesOrder,
  warehouseGetAll
} = vi.hoisted(() => ({
  salesOrderGetById: vi.fn(),
  salesChallanGetById: vi.fn(),
  salesChallansBySalesOrder: vi.fn(),
  warehouseGetAll: vi.fn()
}));

vi.mock('../services/salesOrderAPI', () => ({
  salesOrderAPI: {
    getById: salesOrderGetById
  }
}));

vi.mock('../services/salesChallanAPI', () => ({
  salesChallanAPI: {
    getById: salesChallanGetById,
    getBySalesOrder: salesChallansBySalesOrder,
    previewPDF: vi.fn(),
    generatePDF: vi.fn()
  },
  salesChallanUtils: {
    formatStatus: (status) => status
  }
}));

vi.mock('../services/warehouseAPI', () => ({
  warehouseAPI: {
    getAll: warehouseGetAll
  }
}));

import SalesOrderDetailModal from '../components/SalesOrders/SalesOrderDetailModal';
import ChallanDetailModal from '../components/SalesChallan/ChallanDetailModal';

const order = {
  _id: 'so-1',
  soNumber: 'PKRK/SO/101',
  status: 'Processing',
  orderDate: '2026-07-30T00:00:00.000Z',
  expectedDeliveryDate: '2026-08-05T00:00:00.000Z',
  customer: { companyName: 'ERP Customer' },
  category: { categoryName: 'Yarn' },
  items: [{
    _id: 'so-item-1',
    product: { _id: 'product-1', productName: '10 No Punjab' },
    productName: '10 No Punjab',
    quantity: 60,
    deliveredQuantity: 55,
    dispatchedWeight: 2750,
    manuallyCompleted: true,
    unit: 'Bags',
    weight: 3000,
    notes: 'Finalized below ordered quantity'
  }]
};

const challan = {
  _id: 'challan-1',
  challanNumber: 'PKRK/SC/201',
  soNumber: 'PKRK/SO/101',
  salesOrder: 'so-1',
  customerName: 'ERP Customer',
  warehouseLocation: 'warehouse-1',
  challanDate: '2026-07-30T00:00:00.000Z',
  status: 'Prepared',
  items: [{
    _id: 'challan-item-1',
    salesOrderItem: 'so-item-1',
    product: 'product-1',
    productName: '10 No Punjab',
    orderedQuantity: 60,
    dispatchQuantity: 55,
    manuallyCompleted: true,
    unit: 'Bags',
    weight: 2750,
    subProductWeights: [50, 40]
  }]
};

describe('Document detail modals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    salesOrderGetById.mockResolvedValue({ data: order });
    salesChallanGetById.mockResolvedValue({ data: challan });
    salesChallansBySalesOrder.mockResolvedValue({ data: [challan] });
    warehouseGetAll.mockResolvedValue({
      data: [{ _id: 'warehouse-1', name: 'Main Warehouse' }]
    });
  });

  it('shows a loading shell and then renders refreshed sales-order detail', async () => {
    render(
      <SalesOrderDetailModal
        isOpen
        onClose={vi.fn()}
        order={order}
      />
    );

    const loadingShell = screen.getByLabelText('Loading sales order details');
    expect(loadingShell).toBeInTheDocument();
    expect(loadingShell.closest('.fixed')).toHaveClass(
      'top-16',
      'lg:left-[var(--sidebar-width)]'
    );
    expect(await screen.findByText('Order Summary')).toBeInTheDocument();
    expect(screen.getByText('Closed by Mark Final')).toBeInTheDocument();
    expect(screen.getByText('55 Bags')).toBeInTheDocument();
    expect(screen.getByText('PKRK/SC/201')).toBeInTheDocument();
    expect(screen.getByText('50 kg')).toBeInTheDocument();
    expect(screen.getByText('40 kg')).toBeInTheDocument();
  });

  it('loads challan, sales-order, and warehouse detail before rendering', async () => {
    render(
      <ChallanDetailModal
        isOpen
        onClose={vi.fn()}
        challan={challan}
      />
    );

    expect(screen.getByLabelText('Loading challan details')).toBeInTheDocument();
    expect(await screen.findByText('Challan Summary')).toBeInTheDocument();
    expect(screen.getByText('Main Warehouse')).toBeInTheDocument();
    expect(screen.getByText('55 Bags')).toBeInTheDocument();

    await waitFor(() => {
      expect(salesChallanGetById).toHaveBeenCalledWith('challan-1');
      expect(salesOrderGetById).toHaveBeenCalledWith('so-1');
      expect(warehouseGetAll).toHaveBeenCalledOnce();
    });
  });
});
