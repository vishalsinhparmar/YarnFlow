import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NewSalesOrderModal from '../components/SalesOrders/NewSalesOrderModal';
import { inventoryAPI } from '../services/inventoryAPI';

vi.mock('../services/masterDataAPI', () => ({
  default: {
    customers: {
      getAll: vi.fn(() => Promise.resolve({
        success: true,
        data: [{ _id: 'customer-1', companyName: 'Apex Textiles' }],
        pagination: { current: 1, pages: 1, total: 1 }
      }))
    },
    categories: {
      getAll: vi.fn(() => Promise.resolve({
        success: true,
        data: [{
          _id: 'category-1',
          categoryName: 'Variant Yarn',
          description: 'Products tracked by size',
          hasSubProducts: true
        }],
        pagination: { current: 1, pages: 1, total: 1 }
      }))
    }
  }
}));

vi.mock('../services/inventoryAPI.js', () => ({
  inventoryAPI: {
    getAll: vi.fn(),
    getProductDetail: vi.fn()
  }
}));

vi.mock('../services/salesOrderAPI.js', () => ({
  salesOrderAPI: {
    getById: vi.fn()
  }
}));

vi.mock('../services/common.js', () => ({
  apiRequest: vi.fn()
}));

describe('Sales order product selection visibility', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    inventoryAPI.getAll.mockImplementation((params = {}) => {
      if (params.flat) {
        return Promise.resolve({
          success: true,
          data: [{
            productId: 'product-1',
            productName: 'Variant Product',
            productCode: 'VP-1',
            unit: 'Bags',
            currentStock: 3,
            currentWeight: 120,
            hasSubProducts: true
          }],
          pagination: { current: 1, pages: 1, total: 1 }
        });
      }

      return Promise.resolve({
        success: true,
        data: [{ categoryId: 'category-1', products: [{ productId: 'product-1' }] }]
      });
    });
    inventoryAPI.getProductDetail.mockResolvedValue({
      success: true,
      data: {
        subProductBreakdown: [
          {
            subProductId: 'sub-5',
            subProductName: '5',
            currentStock: 1,
            currentWeight: 50,
            lots: [{
              status: 'Active',
              currentQuantity: 1,
              receivedDate: '2026-07-01T00:00:00.000Z',
              subProductWeights: [50]
            }]
          },
          {
            subProductId: 'sub-10',
            subProductName: '10',
            currentStock: 2,
            currentWeight: 70,
            lots: [{
              status: 'Active',
              currentQuantity: 2,
              receivedDate: '2026-07-02T00:00:00.000Z',
              subProductWeights: [30, 40]
            }]
          }
        ]
      }
    });
  });

  it('marks categories, repeated products, and already-selected sub-products', async () => {
    render(
      <NewSalesOrderModal
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(inventoryAPI.getAll).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Select Category$/i }));
    expect(screen.getByText('Variants')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Variant Yarn/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Select Product$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Select Product$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Variant Product/i }));

    fireEvent.click(screen.getByRole('button', { name: /^Add Product$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Select Product$/i }));

    expect(screen.getByText('Already added')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Variant Product.*Already added/i }));

    await waitFor(() => {
      expect(screen.getByText('2 variant lines')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /^Select Sub Pr\.\.\.$/i })).toHaveLength(2);
    });

    const subProductSelectors = screen.getAllByRole('button', { name: /^Select Sub Pr\.\.\.$/i });
    fireEvent.click(subProductSelectors[0]);
    fireEvent.click(screen.getByRole('button', { name: /^5 Available:/i }));

    fireEvent.click(screen.getByRole('button', { name: /^Select Sub Pr\.\.\.$/i }));
    expect(screen.getByText('Already selected')).toBeInTheDocument();
  });
});
